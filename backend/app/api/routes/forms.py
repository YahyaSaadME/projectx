from fastapi import APIRouter, Depends, status

from backend.app.api.dependencies import get_current_user, get_form_service
from backend.app.schemas.forms import FormCreateRequest, FormReadResponse, FormUpdateRequest
from backend.app.services.forms import FormService

router = APIRouter(prefix="/forms", tags=["forms"])


@router.post("/", response_model=FormReadResponse, status_code=status.HTTP_201_CREATED)
async def create_form(payload: FormCreateRequest, user: dict = Depends(get_current_user), service: FormService = Depends(get_form_service)):
    return await service.create_form(user, payload)


@router.get("/", response_model=list[FormReadResponse])
async def list_forms(user: dict = Depends(get_current_user), service: FormService = Depends(get_form_service)):
    return await service.list_forms(user)


@router.get("/{form_id}", response_model=FormReadResponse)
async def get_form(form_id: str, user: dict = Depends(get_current_user), service: FormService = Depends(get_form_service)):
    return await service.get_form(user, form_id)


@router.patch("/{form_id}", response_model=FormReadResponse)
async def update_form(form_id: str, payload: FormUpdateRequest, user: dict = Depends(get_current_user), service: FormService = Depends(get_form_service)):
    return await service.update_form(user, form_id, payload)


@router.post("/{form_id}/publish", response_model=FormReadResponse)
async def publish_form(form_id: str, user: dict = Depends(get_current_user), service: FormService = Depends(get_form_service)):
    return await service.publish_form(user, form_id)