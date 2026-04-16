from datetime import UTC, datetime
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
            "role": "member" if challenge.get("organization_id") else "admin",
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