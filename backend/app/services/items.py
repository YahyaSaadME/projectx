from datetime import UTC, datetime
import json

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorCollection
from redis.asyncio import Redis

from backend.app.core.config import Settings
from backend.app.schemas.item import ItemCreate, ItemRead, ItemUpdate


def serialize_document(document: dict) -> dict:
    payload = dict(document)
    payload["id"] = str(payload.pop("_id"))

    for field in ("created_at", "updated_at"):
        value = payload.get(field)
        if isinstance(value, datetime):
            payload[field] = value.isoformat()

    return payload


class ItemService:
    def __init__(self, collection: AsyncIOMotorCollection, redis: Redis, settings: Settings):
        self.collection = collection
        self.redis = redis
        self.settings = settings

    async def _cache_set(self, key: str, payload: str) -> None:
        await self.redis.setex(key, self.settings.cache_ttl_seconds, payload)

    async def _invalidate_cache(self, item_id: str | None = None) -> None:
        await self.redis.delete("items:list")
        if item_id is not None:
            await self.redis.delete(f"items:{item_id}")

    async def list_items(self) -> list[ItemRead]:
        cached_items = await self.redis.get("items:list")
        if cached_items:
            return [ItemRead.model_validate(item) for item in json.loads(cached_items)]

        cursor = self.collection.find().sort("created_at", -1)
        documents = await cursor.to_list(length=100)
        items = [serialize_document(document) for document in documents]
        await self._cache_set("items:list", json.dumps(items))
        return [ItemRead.model_validate(item) for item in items]

    async def get_item(self, item_id: str) -> ItemRead:
        cached_item = await self.redis.get(f"items:{item_id}")
        if cached_item:
            return ItemRead.model_validate(json.loads(cached_item))

        object_id = self._to_object_id(item_id)
        document = await self.collection.find_one({"_id": object_id})
        if document is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        item = ItemRead.model_validate(serialize_document(document))
        await self._cache_set(f"items:{item_id}", item.model_dump_json())
        return item

    async def create_item(self, payload: ItemCreate) -> ItemRead:
        now = datetime.now(UTC)
        document = payload.model_dump()
        document["created_at"] = now
        document["updated_at"] = None

        result = await self.collection.insert_one(document)
        created = await self.collection.find_one({"_id": result.inserted_id})
        if created is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create item")

        await self._invalidate_cache(str(result.inserted_id))
        return ItemRead.model_validate(serialize_document(created))

    async def update_item(self, item_id: str, payload: ItemUpdate) -> ItemRead:
        object_id = self._to_object_id(item_id)
        changes = payload.model_dump(exclude_unset=True)
        if not changes:
            return await self.get_item(item_id)

        changes["updated_at"] = datetime.now(UTC)
        result = await self.collection.update_one({"_id": object_id}, {"$set": changes})
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        updated = await self.collection.find_one({"_id": object_id})
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        await self._invalidate_cache(item_id)
        return ItemRead.model_validate(serialize_document(updated))

    async def delete_item(self, item_id: str) -> None:
        object_id = self._to_object_id(item_id)
        result = await self.collection.delete_one({"_id": object_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        await self._invalidate_cache(item_id)

    @staticmethod
    def _to_object_id(item_id: str) -> ObjectId:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item id")
        return ObjectId(item_id)