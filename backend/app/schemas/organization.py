from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    domain: str | None = Field(default=None, max_length=120)
    timezone: str | None = Field(default=None, max_length=64)


class OrganizationRead(BaseModel):
    id: str
    name: str
    domain: str | None = None
    timezone: str | None = None
    owner_user_id: str