from datetime import UTC, datetime
import re
import secrets

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorCollection

from backend.app.schemas.forms import FormCreateRequest, FormUpdateRequest


class FormService:
    def __init__(self, forms: AsyncIOMotorCollection, versions: AsyncIOMotorCollection):
        self.forms = forms
        self.versions = versions

    async def create_form(self, user: dict, payload: FormCreateRequest) -> dict:
        organization_id = self._organization_id_for_user(user)
        self._require_manage_access(user)
        now = datetime.now(UTC)
        slug = await self._resolve_slug(payload.slug or payload.title, organization_id)
        form_doc = {
            "organization_id": organization_id,
            "title": payload.title,
            "description": payload.description,
            "slug": slug,
            "status": "draft",
            "version": 1,
            "fields": [field.model_dump() for field in payload.fields],
            "created_by_user_id": user["_id"],
            "updated_by_user_id": user["_id"],
            "created_at": now,
            "updated_at": now,
            "published_at": None,
        }
        result = await self.forms.insert_one(form_doc)
        await self.versions.insert_one(
            {
                "form_id": result.inserted_id,
                "organization_id": organization_id,
                "version": 1,
                "action": "created",
                "schema": form_doc,
                "created_by_user_id": user["_id"],
                "created_at": now,
            }
        )
        created = await self.forms.find_one({"_id": result.inserted_id})
        return self._serialize_form(created)

    async def list_forms(self, user: dict) -> list[dict]:
        organization_id = self._organization_id_for_user(user)
        cursor = self.forms.find({"organization_id": organization_id}).sort("created_at", -1)
        forms: list[dict] = []
        async for document in cursor:
            forms.append(self._serialize_form(document))
        return forms

    async def get_form(self, user: dict, form_id: str) -> dict:
        organization_id = self._organization_id_for_user(user)
        document = await self.forms.find_one({"_id": ObjectId(form_id), "organization_id": organization_id})
        if document is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
        return self._serialize_form(document)

    async def update_form(self, user: dict, form_id: str, payload: FormUpdateRequest) -> dict:
        organization_id = self._organization_id_for_user(user)
        self._require_manage_access(user)
        document = await self.forms.find_one({"_id": ObjectId(form_id), "organization_id": organization_id})
        if document is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

        changes = payload.model_dump(exclude_unset=True)
        if "slug" in changes and changes["slug"] is not None:
            changes["slug"] = await self._resolve_slug(changes["slug"], organization_id, form_id)
        if "title" in changes and "slug" not in changes:
            changes["slug"] = await self._resolve_slug(changes["title"], organization_id, form_id)
        if "fields" in changes and changes["fields"] is not None:
            changes["fields"] = [field.model_dump() for field in changes["fields"]]

        changes["updated_by_user_id"] = user["_id"]
        changes["updated_at"] = datetime.now(UTC)
        if document["status"] == "published":
            changes["version"] = document["version"] + 1

        await self.forms.update_one({"_id": document["_id"]}, {"$set": changes})
        updated = await self.forms.find_one({"_id": document["_id"]})
        await self.versions.insert_one(
            {
                "form_id": document["_id"],
                "organization_id": organization_id,
                "version": updated["version"],
                "action": "updated",
                "schema": updated,
                "created_by_user_id": user["_id"],
                "created_at": datetime.now(UTC),
            }
        )
        return self._serialize_form(updated)

    async def publish_form(self, user: dict, form_id: str) -> dict:
        organization_id = self._organization_id_for_user(user)
        self._require_manage_access(user)
        document = await self.forms.find_one({"_id": ObjectId(form_id), "organization_id": organization_id})
        if document is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

        now = datetime.now(UTC)
        next_version = document["version"] + 1 if document["status"] == "published" else 1
        await self.forms.update_one(
            {"_id": document["_id"]},
            {"$set": {"status": "published", "published_at": now, "updated_at": now, "updated_by_user_id": user["_id"], "version": next_version}},
        )
        updated = await self.forms.find_one({"_id": document["_id"]})
        await self.versions.insert_one(
            {
                "form_id": document["_id"],
                "organization_id": organization_id,
                "version": updated["version"],
                "action": "published",
                "schema": updated,
                "created_by_user_id": user["_id"],
                "created_at": now,
            }
        )
        return self._serialize_form(updated)

    def _organization_id_for_user(self, user: dict) -> ObjectId:
        organization_id = user.get("organization_id")
        if organization_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization access required")
        return organization_id

    @staticmethod
    def _require_manage_access(user: dict) -> None:
        if user.get("role") not in {"owner", "admin"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners and admins can manage forms")

    async def _resolve_slug(self, raw_slug: str, organization_id: ObjectId, form_id: str | None = None) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", raw_slug.lower()).strip("-")
        if not slug:
            slug = f"form-{secrets.token_hex(4)}"
        candidate = slug
        suffix = 1
        while True:
            query = {"organization_id": organization_id, "slug": candidate}
            if form_id:
                query["_id"] = {"$ne": ObjectId(form_id)}
            if await self.forms.find_one(query) is None:
                return candidate
            candidate = f"{slug}-{suffix}"
            suffix += 1

    @staticmethod
    def _serialize_form(document: dict | None) -> dict:
        if document is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
        return {
            "id": str(document["_id"]),
            "organization_id": str(document["organization_id"]),
            "title": document["title"],
            "description": document.get("description"),
            "slug": document["slug"],
            "status": document["status"],
            "version": document["version"],
            "fields": document.get("fields", []),
            "created_at": document["created_at"].isoformat(),
            "updated_at": document["updated_at"].isoformat(),
            "published_at": document.get("published_at").isoformat() if document.get("published_at") else None,
        }