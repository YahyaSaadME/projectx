from pydantic import BaseModel, EmailStr, Field


class SignupStartRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    invite_token: str | None = None


class SignupStartResponse(BaseModel):
    challenge_id: str
    expires_in_seconds: int
    message: str


class SignupVerifyRequest(BaseModel):
    challenge_id: str
    otp: str = Field(min_length=4, max_length=12)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    organization_id: str | None = None
    created_organization_id: str | None = None


class CreateOrganizationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    domain: str | None = Field(default=None, max_length=120)
    timezone: str | None = Field(default=None, max_length=64)


class OrganizationResponse(BaseModel):
    id: str
    name: str
    domain: str | None = None
    timezone: str | None = None
    owner_user_id: str


class CreateInviteRequest(BaseModel):
    email: EmailStr


class InviteResponse(BaseModel):
    id: str
    email: EmailStr
    organization_id: str
    invite_url: str
    expires_at: str


class InvitePreviewResponse(BaseModel):
    email: EmailStr
    organization_name: str
    organization_id: str
    expires_at: str
    status: str