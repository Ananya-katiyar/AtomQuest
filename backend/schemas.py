from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, UoMType, GoalStatus, ProgressStatus

# User Schemas

class UserCreate(BaseModel):
    name:       str
    email:      EmailStr
    password:   str
    role:       UserRole = UserRole.employee
    manager_id: Optional[int] = None

class UserOut(BaseModel):
    id:         int
    name:       str
    email:      EmailStr
    role:       UserRole
    manager_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type:   str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role:    Optional[str] = None

# Goal Schemas

class GoalCreate(BaseModel):
    thrust_area: str
    title:       str
    description: Optional[str] = None
    uom_type:    UoMType
    target:      float
    weightage:   float

class GoalUpdate(BaseModel):
    thrust_area: Optional[str]   = None
    title:       Optional[str]   = None
    description: Optional[str]   = None
    target:      Optional[float] = None
    weightage:   Optional[float] = None

class GoalOut(BaseModel):
    id:          int
    employee_id: int
    thrust_area: str
    title:       str
    description: Optional[str]
    uom_type:    UoMType
    target:      float
    weightage:   float
    status:      GoalStatus
    is_locked:   bool
    is_shared:   bool
    created_at:  datetime

    class Config:
        from_attributes = True

# CheckIn Schemas

class CheckInCreate(BaseModel):
    goal_id:         int 
    quarter:         str              # "Q1", "Q2", "Q3", "Q4"
    achievement:     float
    progress_status: ProgressStatus

class CheckInManagerComment(BaseModel):
    manager_comment: str

class CheckInOut(BaseModel):
    id:              int
    goal_id:         int
    quarter:         str
    achievement:     Optional[float]
    progress_status: ProgressStatus
    score:           Optional[float]
    manager_comment: Optional[str]
    created_at:      datetime

    class Config:
        from_attributes = True

# AuditLog Schemas

class AuditLogOut(BaseModel):
    id:         int
    goal_id:    int
    changed_by: int
    change:     str
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    manager_id: Optional[int] = None
    name:       Optional[str] = None

class EscalationLogOut(BaseModel):
    id:         int
    user_id:    int
    reason:     str
    resolved:   bool
    created_at: datetime

    class Config:
        from_attributes = True