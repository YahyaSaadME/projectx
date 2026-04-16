from datetime import UTC, datetime, timedelta
import secrets

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorCollection
from redis.asyncio import Redis

from backend.app.core.config import Settings
from backend.app.core.emailer import send_email
from backend.app.core.security import hash_token
from backend.app.schemas.auth import CreateInviteRequest, CreateOrganizationRequest


class OrganizationService:
    def __init__(
        self,
        *,
        organizations: AsyncIOMotorCollection,
        invitations: AsyncIOMotorCollection,
        users: AsyncIOMotorCollection,
        redis: Redis,
        settings: Settings,
    ):
        self.organizations = organizations
        self.invitations = invitations
        self.users = users
        self.redis = redis
        self.settings = settings

    async def create_organization(self, user: dict, payload: CreateOrganizationRequest) -> dict:
        if user.get("organization_id") or user.get("created_organization_id"):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User can only create one organization")

        now = datetime.now(UTC)
        org_doc = {
            "name": payload.name,
            "domain": payload.domain,
            "timezone": payload.timezone,
            "owner_user_id": user["_id"],
            "created_at": now,
            "updated_at": now,
        }
        result = await self.organizations.insert_one(org_doc)
        organization_id = result.inserted_id

        update_result = await self.users.update_one(
            {"_id": user["_id"], "organization_id": None, "created_organization_id": None},
            {
                "$set": {
                    "organization_id": organization_id,
                    "created_organization_id": organization_id,
                    "role": "owner",
                    "updated_at": now,
                }
            },
        )
        if update_result.matched_count == 0:
            await self.organizations.delete_one({"_id": organization_id})
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User can only create one organization")

        created = await self.organizations.find_one({"_id": organization_id})
        return self._serialize_organization(created)

    async def create_invite(self, user: dict, payload: CreateInviteRequest) -> dict:
        return await self.create_invite_for_organization(user=user, payload=payload, organization_id=user.get("organization_id"))

    async def create_invite_for_organization(self, user: dict, payload: CreateInviteRequest, organization_id: str | None) -> dict:
        if not organization_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization access required")
        if user.get("role") not in {"admin", "owner"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners and admins can create invites")
        if user.get("organization_id") and str(user["organization_id"]) != str(organization_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot invite people to another organization")

        existing_user = await self.users.find_one({"email": payload.email.lower()})
        if existing_user and existing_user.get("organization_id") and str(existing_user["organization_id"]) != str(organization_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already belongs to another organization")

        invite_token = secrets.token_urlsafe(32)
        invite_hash = hash_token(invite_token)
        expires_at = datetime.now(UTC) + timedelta(days=self.settings.invite_ttl_days)
        now = datetime.now(UTC)
        invite_doc = {
            "email": payload.email.lower(),
            "organization_id": organization_id,
            "token_hash": invite_hash,
            "status": "pending",
            "created_by_user_id": user["_id"],
            "created_at": now,
            "expires_at": expires_at,
            "accepted_at": None,
            "accepted_user_id": None,
        }
        result = await self.invitations.insert_one(invite_doc)
        invite_url = f"{self.settings.public_app_url}/api/orgs/invitations/{invite_token}"

        organization = await self.organizations.find_one({"_id": organization_id})
        if organization is None:
            await self.invitations.delete_one({"_id": result.inserted_id})
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

        try:
            send_email(
                self.settings,
                payload.email,
                subject=f"Invitation to join {organization['name']}",
                body=(
                    f"You have been invited to join {organization['name']}.\n\n"
                    f"Open this link to continue: {invite_url}\n\n"
                    f"The invitation expires at {expires_at.isoformat()}."
                ),
            )
        except RuntimeError as exc:
            await self.invitations.delete_one({"_id": result.inserted_id})
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Email service is not configured") from exc

        return {
            "id": str(result.inserted_id),
            "email": payload.email,
            "organization_id": str(organization_id),
            "invite_url": invite_url,
            "expires_at": expires_at.isoformat(),
        }

    async def get_organization(self, user: dict, organization_id: str) -> dict:
        if not user.get("organization_id") or str(user["organization_id"]) != str(organization_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        organization = await self.organizations.find_one({"_id": ObjectId(organization_id)})
        if organization is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        return self._serialize_organization(organization)

    async def list_members(self, user: dict, organization_id: str) -> list[dict]:
        if not user.get("organization_id") or str(user["organization_id"]) != str(organization_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        cursor = self.users.find({"organization_id": user["organization_id"]}).sort("created_at", 1)
        members = []
        async for member in cursor:
            members.append(
                {
                    "id": str(member["_id"]),
                    "email": member["email"],
                    "full_name": member.get("full_name"),
                    "role": member.get("role"),
                    "is_active": member.get("is_active", True),
                }
            )
        return members

    async def preview_invite(self, invite_token: str) -> dict:
        invite = await self._find_pending_invite_by_token(invite_token)
        organization = await self.organizations.find_one({"_id": invite["organization_id"]})
        if organization is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

        return {
            "email": invite["email"],
            "organization_name": organization["name"],
            "organization_id": str(organization["_id"]),
            "expires_at": invite["expires_at"].isoformat(),
            "status": invite["status"],
        }

    async def accept_invite(self, user: dict, invite_token: str) -> dict:
        if user.get("organization_id") or user.get("created_organization_id"):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User can only belong to one organization")

        invite = await self._find_pending_invite_by_token(invite_token)
        if invite["email"] != user["email"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invite email does not match account email")

        organization_id = invite["organization_id"]
        now = datetime.now(UTC)
        await self.users.update_one(
            {"_id": user["_id"], "organization_id": None, "created_organization_id": None},
            {"$set": {"organization_id": organization_id, "role": "member", "updated_at": now}},
        )
        await self.invitations.update_one(
            {"_id": invite["_id"]},
            {"$set": {"status": "accepted", "accepted_at": now, "accepted_user_id": user["_id"]}},
        )
        return {"status": "accepted"}

    async def _find_pending_invite_by_token(self, invite_token: str) -> dict:
        invite_hash = hash_token(invite_token)
        invite = await self.invitations.find_one({"token_hash": invite_hash})
        if invite is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
        if invite["status"] != "pending":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite is no longer active")
        if invite["expires_at"] < datetime.now(UTC):
            await self.invitations.update_one({"_id": invite["_id"]}, {"$set": {"status": "expired"}})
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite expired")
        return invite

    @staticmethod
    def _serialize_organization(document: dict | None) -> dict:
        if document is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        return {
            "id": str(document["_id"]),
            "name": document["name"],
            "domain": document.get("domain"),
            "timezone": document.get("timezone"),
            "owner_user_id": str(document["owner_user_id"]),
        }