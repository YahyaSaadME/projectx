from pydantic import BaseModel, Field


class FormFieldOption(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    value: str = Field(min_length=1, max_length=120)


class FormFieldDefinition(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=120)
    type: str = Field(pattern="^(text|textarea|email|phone|number|select|multiselect|date|checkbox|radio|boolean)$")
    required: bool = False
    placeholder: str | None = Field(default=None, max_length=160)
    helper_text: str | None = Field(default=None, max_length=250)
    min_length: int | None = None
    max_length: int | None = None
    regex: str | None = Field(default=None, max_length=250)
    options: list[FormFieldOption] = Field(default_factory=list)


class FormCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    slug: str | None = Field(default=None, max_length=120)
    fields: list[FormFieldDefinition]


class FormUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    slug: str | None = Field(default=None, max_length=120)
    fields: list[FormFieldDefinition] | None = None


class FormReadResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    description: str | None = None
    slug: str
    status: str
    version: int
    fields: list[FormFieldDefinition]
    created_at: str
    updated_at: str
    published_at: str | None = None


class FormVersionReadResponse(BaseModel):
    id: str
    form_id: str
    version: int
    action: str
    created_at: str