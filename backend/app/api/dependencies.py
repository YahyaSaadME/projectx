from typing import Annotated

from bson import ObjectId
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.core.config import get_settings
from backend.app.core.security import decode_token
from backend.app.db.mongo import get_form_versions_collection, get_forms_collection, get_items_collection
from backend.app.db.mongo import get_invitations_collection, get_organizations_collection, get_users_collection
from backend.app.db.redis import get_redis
from backend.app.services.auth import AuthService
from backend.app.services.forms import FormService
from backend.app.services.items import ItemService
from backend.app.services.organizations import OrganizationService

bearer_scheme = HTTPBearer(auto_error=False)


def get_item_service(request: Request) -> ItemService:
    return ItemService(
        collection=get_items_collection(request),
        redis=get_redis(request),
        settings=get_settings(),
    )


def get_auth_service(request: Request) -> AuthService:
    return AuthService(db=request.app.state.mongo_db, redis=get_redis(request), settings=get_settings())


def get_organization_service(request: Request) -> OrganizationService:
    return OrganizationService(
        organizations=get_organizations_collection(request),
        invitations=get_invitations_collection(request),
        users=get_users_collection(request),
        redis=get_redis(request),
        settings=get_settings(),
    )


def get_form_service(request: Request) -> FormService:
    return FormService(forms=get_forms_collection(request), versions=get_form_versions_collection(request))


async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    settings = get_settings()
    try:
        payload = decode_token(credentials.credentials, settings)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user_id = payload.get("uid")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await get_users_collection(request).find_one({"_id": ObjectId(user_id), "is_active": True})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user