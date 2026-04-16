from fastapi import APIRouter, Depends

from backend.app.api.dependencies import get_current_user, get_organization_service
from backend.app.schemas.auth import CreateInviteRequest, CreateOrganizationRequest, InvitePreviewResponse, InviteResponse, OrganizationResponse
from backend.app.services.organizations import OrganizationService

router = APIRouter(prefix="/orgs", tags=["organizations"])


@router.post("/", response_model=OrganizationResponse)
async def create_organization(payload: CreateOrganizationRequest, user: dict = Depends(get_current_user), service: OrganizationService = Depends(get_organization_service)):
    return await service.create_organization(user, payload)


@router.post("/invitations", response_model=InviteResponse)
async def create_invite(payload: CreateInviteRequest, user: dict = Depends(get_current_user), service: OrganizationService = Depends(get_organization_service)):
    return await service.create_invite(user, payload)


@router.get("/invitations/{invite_token}", response_model=InvitePreviewResponse)
async def preview_invite(invite_token: str, service: OrganizationService = Depends(get_organization_service)):
    return await service.preview_invite(invite_token)


@router.post("/invitations/{invite_token}/accept")
async def accept_invite(invite_token: str, user: dict = Depends(get_current_user), service: OrganizationService = Depends(get_organization_service)):
    return await service.accept_invite(user, invite_token)