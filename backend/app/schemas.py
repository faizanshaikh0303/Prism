from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Songs ─────────────────────────────────────────────────────────────────────

class StemOut(BaseModel):
    id: int
    stem_type: str
    file_path: str

    model_config = {"from_attributes": True}


class SongOut(BaseModel):
    id: int
    title: str
    artist: Optional[str] = None
    status: str
    is_demo: bool
    error_message: Optional[str] = None
    created_at: datetime
    stems: List[StemOut] = []

    model_config = {"from_attributes": True}
