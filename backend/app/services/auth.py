from datetime import UTC, datetime
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest, urlopen
import json
import uuid

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from redis.asyncio import Redis

from backend.app.core.config import Settings
from backend.app.core.emailer import send_email
from backend.app.core.security import create_access_token, generate_otp, hash_password, verify_password
from backend.app.schemas.auth import LoginRequest, SignupStartRequest
from backend.app.services.organizations import OrganizationService


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase, redis: Redis, settings: Settings):
        self.db = db
        self.redis = redis
        self.settings = settings
        self.users: AsyncIOMotorCollection = db["users"]
        self.organizations: AsyncIOMotorCollection = db["organizations"]
        self.invitations: AsyncIOMotorCollection = db["invitations"]
        self.organization_service = OrganizationService(
            organizations=self.organizations,
            invitations=self.invitations,
            users=self.users,
            redis=redis,
            settings=settings,
        )

    async def start_google_oauth(self, invite_token: str | None = None) -> dict:
        if not self.settings.google_client_id or not self.settings.google_client_secret:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth is not configured")

        state = str(uuid.uuid4())
        await self.redis.setex(
            self._google_state_key(state),
            self.settings.oauth_state_ttl_minutes * 60,
            json.dumps({"invite_token": invite_token, "created_at": datetime.now(UTC).isoformat()}),
        )

        redirect_uri = self.settings.google_redirect_uri or "http://localhost:8000/api/auth/google/callback"
        query = urlencode(
            {
                "client_id": self.settings.google_client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": self.settings.google_scopes,
                "state": state,
                "access_type": "offline",
                "prompt": "consent",
            }
        )
        return {"auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?{query}", "state": state}

    async def handle_google_callback(self, code: str, state: str) -> dict:
        if not self.settings.google_client_id or not self.settings.google_client_secret:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth is not configured")

        state_raw = await self.redis.get(self._google_state_key(state))
        if state_raw is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth state expired")
        await self.redis.delete(self._google_state_key(state))

        state_payload = json.loads(state_raw)
        redirect_uri = self.settings.google_redirect_uri or "http://localhost:8000/api/auth/google/callback"
        token_response = self._google_exchange_code(code, redirect_uri)
        google_user = self._google_fetch_userinfo(token_response["access_token"])
        if not google_user.get("email_verified"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google email is not verified")

        email = google_user["email"].lower()
        invite = None
        if state_payload.get("invite_token"):
            invite = await self.organization_service._find_pending_invite_by_token(state_payload["invite_token"])
            if invite["email"] != email:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invite email does not match Google account email")

        now = datetime.now(UTC)
        user = await self.users.find_one({"email": email})
        if user is None:
            user_doc = {
                "email": email,
                "full_name": google_user.get("name") or google_user.get("given_name") or email.split("@")[0],
                "password_hash": None,
                "google_sub": google_user.get("sub"),
                "oauth_provider": "google",
                "is_email_verified": True,
                "organization_id": invite["organization_id"] if invite else None,
                "created_organization_id": None,
                "role": "member" if invite else "owner",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
                "last_login_at": now,
            }
            result = await self.users.insert_one(user_doc)
            user = await self.users.find_one({"_id": result.inserted_id})
        else:
            if not user.get("is_active", True):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")
            if invite and user.get("organization_id") and str(user["organization_id"]) != str(invite["organization_id"]):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already belongs to another organization")
            update_payload = {
                "google_sub": user.get("google_sub") or google_user.get("sub"),
                "oauth_provider": user.get("oauth_provider") or "google",
                "is_email_verified": True,
                "full_name": user.get("full_name") or google_user.get("name") or email.split("@")[0],
                "last_login_at": now,
            }
            if invite and user.get("organization_id") is None and user.get("created_organization_id") is None:
                update_payload["organization_id"] = invite["organization_id"]
                update_payload["role"] = "member"
            await self.users.update_one({"_id": user["_id"]}, {"$set": update_payload})
            user = await self.users.find_one({"_id": user["_id"]})

        if user is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google login failed")

        if invite:
            await self.invitations.update_one(
                {"_id": invite["_id"]},
                {"$set": {"status": "accepted", "accepted_at": now, "accepted_user_id": user["_id"]}},
            )

        token = create_access_token(
            settings=self.settings,
            subject=str(user["_id"]),
            user_id=str(user["_id"]),
            email=user["email"],
            role=user["role"],
            organization_id=str(user["organization_id"]) if user.get("organization_id") else None,
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "requires_organization_setup": not bool(user.get("organization_id")),
            "organization_id": str(user["organization_id"]) if user.get("organization_id") else None,
            "role": user["role"],
        }

    async def request_signup(self, payload: SignupStartRequest) -> dict:
        email = payload.email.lower()
        existing_user = await self.users.find_one({"email": email})
        if existing_user is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account already exists")

        invite = None
        if payload.invite_token:
            invite = await self.organization_service._find_pending_invite_by_token(payload.invite_token)
            if invite["email"] != email:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invite email does not match signup email")

        otp = generate_otp(self.settings.otp_length)
        challenge_id = str(uuid.uuid4())
        challenge_key = self._challenge_key(challenge_id)
        challenge_payload = {
            "email": email,
            "full_name": payload.full_name,
            "password_hash": hash_password(payload.password),
            "invite_id": str(invite["_id"]) if invite else None,
            "organization_id": str(invite["organization_id"]) if invite else None,
            "otp_hash": hash_password(otp),
            "created_at": datetime.now(UTC).isoformat(),
            "attempts": 0,
        }
        await self.redis.setex(
            challenge_key,
            self.settings.otp_ttl_minutes * 60,
            json.dumps(challenge_payload),
        )
        try:
            send_email(
                self.settings,
                email,
                subject=f"Your {self.settings.app_name} verification code",
                body=(
                    f"Your verification code is: {otp}\n\n"
                    f"This code expires in {self.settings.otp_ttl_minutes} minutes."
                ),
            )
        except RuntimeError as exc:
            await self.redis.delete(challenge_key)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Email service is not configured") from exc

        return {
            "challenge_id": challenge_id,
            "expires_in_seconds": self.settings.otp_ttl_minutes * 60,
            "message": "OTP sent to email",
        }

    async def verify_signup(self, challenge_id: str, otp: str) -> dict:
        challenge_key = self._challenge_key(challenge_id)
        challenge_raw = await self.redis.get(challenge_key)
        if challenge_raw is None:
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Signup challenge expired")

        challenge = json.loads(challenge_raw)
        attempts = int(challenge.get("attempts", 0))
        if attempts >= 5:
            await self.redis.delete(challenge_key)
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many OTP attempts")

        challenge["attempts"] = attempts + 1
        await self.redis.setex(challenge_key, self.settings.otp_ttl_minutes * 60, json.dumps(challenge))

        if not verify_password(otp, challenge["otp_hash"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

        now = datetime.now(UTC)
        user_doc = {
            "email": challenge["email"],
            "full_name": challenge["full_name"],
            "password_hash": challenge["password_hash"],
            "organization_id": ObjectId(challenge["organization_id"]) if challenge.get("organization_id") else None,
            "created_organization_id": None,
            "role": "member" if challenge.get("organization_id") else "owner",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            "last_login_at": now,
        }
        result = await self.users.insert_one(user_doc)

        if challenge.get("invite_id"):
            await self.invitations.update_one(
                {"_id": ObjectId(challenge["invite_id"])},
                {
                    "$set": {
                        "status": "accepted",
                        "accepted_at": now,
                        "accepted_user_id": result.inserted_id,
                    }
                },
            )

        await self.redis.delete(challenge_key)
        user = await self.users.find_one({"_id": result.inserted_id})
        if user is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User creation failed")

        token = create_access_token(
            settings=self.settings,
            subject=str(user["_id"]),
            user_id=str(user["_id"]),
            email=user["email"],
            role=user["role"],
            organization_id=str(user["organization_id"]) if user.get("organization_id") else None,
        )
        return {"access_token": token, "token_type": "bearer"}

    async def login(self, payload: LoginRequest) -> dict:
        email = payload.email.lower()
        user = await self.users.find_one({"email": email, "is_active": True})
        if user is None or not user.get("password_hash"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        await self.users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": datetime.now(UTC)}})
        token = create_access_token(
            settings=self.settings,
            subject=str(user["_id"]),
            user_id=str(user["_id"]),
            email=user["email"],
            role=user["role"],
            organization_id=str(user["organization_id"]) if user.get("organization_id") else None,
        )
        return {"access_token": token, "token_type": "bearer"}

    @staticmethod
    def _challenge_key(challenge_id: str) -> str:
        return f"signup:challenge:{challenge_id}"

    def _google_state_key(self, state: str) -> str:
        return f"oauth:google:state:{state}"

    def _google_exchange_code(self, code: str, redirect_uri: str) -> dict:
        data = urlencode(
            {
                "code": code,
                "client_id": self.settings.google_client_id,
                "client_secret": self.settings.google_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            }
        ).encode("utf-8")
        request = UrlRequest("https://oauth2.googleapis.com/token", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        if "access_token" not in payload:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token exchange failed")
        return payload

    def _google_fetch_userinfo(self, access_token: str) -> dict:
        request = UrlRequest("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))