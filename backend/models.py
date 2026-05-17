from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# Enums

class UserRole(str, enum.Enum):
    employee = "employee"
    manager  = "manager"
    admin    = "admin"

class UoMType(str, enum.Enum):
    numeric  = "numeric"
    percent  = "percent"
    timeline = "timeline"
    zero     = "zero"

class GoalStatus(str, enum.Enum):
    draft     = "draft"
    submitted = "submitted"
    approved  = "approved"
    rejected  = "rejected"

class ProgressStatus(str, enum.Enum):
    not_started = "not_started"
    on_track    = "on_track"
    completed   = "completed"

# Tables

class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, index=True, nullable=False)
    password   = Column(String, nullable=False)
    role       = Column(Enum(UserRole), default=UserRole.employee)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    manager    = relationship("User", remote_side=[id], backref="team")
    goals      = relationship("Goal", back_populates="employee")


class Goal(Base):
    __tablename__ = "goals"

    id          = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    thrust_area = Column(String, nullable=False)
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    uom_type    = Column(Enum(UoMType), nullable=False)
    target      = Column(Float, nullable=False)
    weightage   = Column(Float, nullable=False)
    status      = Column(Enum(GoalStatus), default=GoalStatus.draft)
    is_locked   = Column(Boolean, default=False)
    is_shared   = Column(Boolean, default=False)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    employee    = relationship("User", back_populates="goals")
    checkins    = relationship("CheckIn", back_populates="goal")
    audit_logs  = relationship("AuditLog", back_populates="goal")


class CheckIn(Base):
    __tablename__ = "checkins"

    id              = Column(Integer, primary_key=True, index=True)
    goal_id         = Column(Integer, ForeignKey("goals.id"), nullable=False)
    quarter         = Column(String, nullable=False)  # Q1, Q2, Q3, Q4
    achievement     = Column(Float, nullable=True)
    progress_status = Column(Enum(ProgressStatus), default=ProgressStatus.not_started)
    score           = Column(Float, nullable=True)    # auto calculated
    manager_comment = Column(Text, nullable=True)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    goal            = relationship("Goal", back_populates="checkins")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id         = Column(Integer, primary_key=True, index=True)
    goal_id    = Column(Integer, ForeignKey("goals.id"), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    change     = Column(Text, nullable=False)  # what was changed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    goal       = relationship("Goal", back_populates="audit_logs")
    
class EscalationLog(Base):
    __tablename__ = "escalation_logs"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason      = Column(String, nullable=False)
    resolved    = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user        = relationship("User")