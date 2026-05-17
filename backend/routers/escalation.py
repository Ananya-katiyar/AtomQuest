from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import EscalationLog, User, UserRole
from schemas import EscalationLogOut
from auth import require_role
from typing import List
from escalation import check_escalations

router = APIRouter()

# Get All Escalations (Admin)

@router.get("/", response_model=List[EscalationLogOut])
def get_escalations(
    current_user: User    = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    return db.query(EscalationLog).order_by(
        EscalationLog.created_at.desc()
    ).all()

# Resolve Escalation (Admin)

@router.put("/{escalation_id}/resolve", response_model=EscalationLogOut)
def resolve_escalation(
    escalation_id: int,
    current_user:  User    = Depends(require_role(UserRole.admin)),
    db:            Session = Depends(get_db)
):
    log = db.query(EscalationLog).filter(EscalationLog.id == escalation_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Escalation not found")

    log.resolved = True
    db.commit()
    db.refresh(log)
    return log

# Manually trigger escalation check (Admin)

@router.post("/trigger")
def trigger_escalation(
    current_user: User = Depends(require_role(UserRole.admin))
):
    check_escalations()
    return {"message": "Escalation check triggered successfully"}