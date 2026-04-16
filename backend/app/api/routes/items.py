from fastapi import APIRouter, Depends, Response, status

from backend.app.api.dependencies import get_item_service
from backend.app.schemas.item import ItemCreate, ItemRead, ItemUpdate
from backend.app.services.items import ItemService

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=list[ItemRead])
async def list_items(service: ItemService = Depends(get_item_service)):
    return await service.list_items()


@router.get("/{item_id}", response_model=ItemRead)
async def get_item(item_id: str, service: ItemService = Depends(get_item_service)):
    return await service.get_item(item_id)


@router.post("/", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(payload: ItemCreate, service: ItemService = Depends(get_item_service)):
    return await service.create_item(payload)


@router.patch("/{item_id}", response_model=ItemRead)
async def update_item(item_id: str, payload: ItemUpdate, service: ItemService = Depends(get_item_service)):
    return await service.update_item(item_id, payload)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_item(item_id: str, service: ItemService = Depends(get_item_service)):
    await service.delete_item(item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)