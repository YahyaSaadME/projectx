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


@router.post("/{organization_id}/invite", response_model=InviteResponse)
async def create_org_invite(organization_id: str, payload: CreateInviteRequest, user: dict = Depends(get_current_user), service: OrganizationService = Depends(get_organization_service)):
    return await service.create_invite_for_organization(user, payload, organization_id)


@router.get("/{organization_id}", response_model=OrganizationResponse)
async def get_organization(organization_id: str, user: dict = Depends(get_current_user), service: OrganizationService = Depends(get_organization_service)):
    return await service.get_organization(user, organization_id)


@router.get("/{organization_id}/members")
async def list_members(organization_id: str, user: dict = Depends(get_current_user), service: OrganizationService = Depends(get_organization_service)):
    return await service.list_members(user, organization_id)


@router.get("/invitations/{invite_token}", response_model=InvitePreviewResponse)
async def preview_invite(invite_token: str, service: OrganizationService = Depends(get_organization_service)):
    return await service.preview_invite(invite_token)


@router.post("/invitations/{invite_token}/accept")
async def accept_invite(invite_token: str, user: dict = Depends(get_current_user), service: OrganizationService = Depends(get_organization_service)):
    return await service.accept_invite(user, invite_token)