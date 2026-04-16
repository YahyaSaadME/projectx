from fastapi import APIRouter, Depends

from backend.app.api.dependencies import get_auth_service, get_current_user
from backend.app.schemas.auth import AuthTokenResponse, CurrentUserResponse, GoogleOAuthCallbackResponse, GoogleOAuthStartResponse, LoginRequest, SignupStartRequest, SignupStartResponse, SignupVerifyRequest
from backend.app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup/start", response_model=SignupStartResponse)
async def signup_start(payload: SignupStartRequest, service: AuthService = Depends(get_auth_service)):
    return await service.request_signup(payload)


@router.post("/signup/verify", response_model=AuthTokenResponse)
async def signup_verify(payload: SignupVerifyRequest, service: AuthService = Depends(get_auth_service)):
    return await service.verify_signup(payload.challenge_id, payload.otp)


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return await service.login(payload)


@router.get("/google/start", response_model=GoogleOAuthStartResponse)
async def google_start(invite_token: str | None = None, service: AuthService = Depends(get_auth_service)):
    return await service.start_google_oauth(invite_token=invite_token)


@router.get("/google/callback", response_model=GoogleOAuthCallbackResponse)
async def google_callback(code: str, state: str, service: AuthService = Depends(get_auth_service)):
    return await service.handle_google_callback(code=code, state=state)


@router.get("/me", response_model=CurrentUserResponse)
async def me(user: dict = Depends(get_current_user)):
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "organization_id": str(user["organization_id"]) if user.get("organization_id") else None,
        "created_organization_id": str(user["created_organization_id"]) if user.get("created_organization_id") else None,
    }