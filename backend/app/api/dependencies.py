from fastapi import Request

from backend.app.core.config import get_settings
from backend.app.db.mongo import get_items_collection
from backend.app.db.redis import get_redis
from backend.app.services.items import ItemService


def get_item_service(request: Request) -> ItemService:
    return ItemService(
        collection=get_items_collection(request),
        redis=get_redis(request),
        settings=get_settings(),
    )