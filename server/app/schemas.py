from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List
from enum import Enum

class ViolationStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"

# --- Base Schemas ---
class UserBase(BaseModel):
  name : str
  email : EmailStr

class ChatBase(BaseModel):
  title : str | None = "New Chat"
  
class MessageBase(BaseModel):
  content : str
  
# --- Create Schemas ---
class UserCreate(UserBase):
  password : str
  
class MessageCreate(MessageBase):
  pass

class ChatCreate(ChatBase):
  participant_ids : List[int]

# --- Update Schemas ---
class UserUpdate(BaseModel):
  name : str | None = None
  email : EmailStr | None = None
  password : str | None = None
  
class AdminUserUpdate(BaseModel):
  violation_count : int | None = None
  is_banned : bool | None = None

# --- Read Schemas ---
class UserRead(UserBase):
    id: int
    class Config:
        from_attributes = True

class UserReadWithAdminInfo(UserRead):
    violation_count : int
    is_banned : bool
    # Config is inherited from UserRead

class MessageRead(MessageBase):
    id: int
    created_at: datetime
    sender_id: int
    sender: UserRead # Nested schema
    violation_status: ViolationStatus
    class Config:
        from_attributes = True

class ChatRead(ChatBase):
    id: int
    created_at: datetime
    participants: List[UserRead] = []
    messages: List[MessageRead] = []
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
  id: int | None = None