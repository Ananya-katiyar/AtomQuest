from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models import User, Goal, AuditLog, UserRole, GoalStatus
from schemas import GoalCreate, GoalUpdate, GoalOut, AuditLogOut
from auth import get_current_user, require_role
from typing import List
from email_service import (
    send_email,
    goal_submitted_email,
    goal_approved_email,
    goal_rejected_email
)

router = APIRouter()

# Helper: Calculate Score

def calculate_score(uom_type: str, target: float, achievement: float) -> float:
    if achievement == 0:
        return 0.0
    if uom_type == "numeric" or uom_type == "percent":
        return round((achievement / target) * 100, 2)       # higher is better
    elif uom_type == "zero":
        return 100.0 if achievement == 0 else 0.0            # zero = success
    elif uom_type == "timeline":
        return round((target / achievement) * 100, 2)        # lower is better
    return 0.0

# Helper: Validate Weightage

def validate_weightage(db: Session, employee_id: int, new_weightage: float, exclude_goal_id: int = None):
    query = db.query(Goal).filter(
        Goal.employee_id == employee_id,
        Goal.status != GoalStatus.rejected
    )
    if exclude_goal_id:
        query = query.filter(Goal.id != exclude_goal_id)

    existing_goals   = query.all()
    total_weightage  = sum(g.weightage for g in existing_goals) + new_weightage

    # max 8 goals per employee
    if len(existing_goals) >= 8:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = "Maximum 8 goals allowed per employee"
        )

    # min 10% per goal
    if new_weightage < 10:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = "Minimum weightage per goal is 10%"
        )

    # total must not exceed 100%
    if total_weightage > 100:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = f"Total weightage cannot exceed 100%. Current total would be {total_weightage}%"
        )

# Create Goal (Employee)

@router.post("/", response_model=GoalOut)
def create_goal(
    goal_data:    GoalCreate,
    current_user: User    = Depends(require_role(UserRole.employee)),
    db:           Session = Depends(get_db)
):
    validate_weightage(db, current_user.id, goal_data.weightage)

    new_goal = Goal(
        employee_id = current_user.id,
        thrust_area = goal_data.thrust_area,
        title       = goal_data.title,
        description = goal_data.description,
        uom_type    = goal_data.uom_type,
        target      = goal_data.target,
        weightage   = goal_data.weightage,
        status      = GoalStatus.draft
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return new_goal

# Get My Goals (Employee)

@router.get("/my", response_model=List[GoalOut])
def get_my_goals(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(Goal).filter(Goal.employee_id == current_user.id).all()

# Get Single Goal

@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(
    goal_id:      int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

# Update Goal (Employee, only if draft)

@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id:      int,
    goal_data:    GoalUpdate,
    current_user: User    = Depends(require_role(UserRole.employee)),
    db:           Session = Depends(get_db)
):
    goal = db.query(Goal).filter(
        Goal.id          == goal_id,
        Goal.employee_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # locked goals cannot be edited
    if goal.is_locked:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail      = "Goal is locked. Contact admin to unlock."
        )

    # only draft or rejected goals can be edited
    if goal.status not in [GoalStatus.draft, GoalStatus.rejected]:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail      = "Only draft or rejected goals can be edited"
        )

    if goal_data.weightage:
        validate_weightage(db, current_user.id, goal_data.weightage, exclude_goal_id=goal_id)
        goal.weightage = goal_data.weightage

    if goal_data.title:       goal.title       = goal_data.title
    if goal_data.thrust_area: goal.thrust_area = goal_data.thrust_area
    if goal_data.description: goal.description = goal_data.description
    if goal_data.target:      goal.target      = goal_data.target

    db.commit()
    db.refresh(goal)

    return goal

# Submit Goal for Approval (Employee)

@router.post("/{goal_id}/submit", response_model=GoalOut)
async def submit_goal(
    goal_id:          int,
    background_tasks: BackgroundTasks,
    current_user:     User    = Depends(require_role(UserRole.employee)),
    db:               Session = Depends(get_db)
):
    goal = db.query(Goal).filter(
        Goal.id          == goal_id,
        Goal.employee_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal.status not in [GoalStatus.draft, GoalStatus.rejected]:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = "Only draft or rejected goals can be submitted"
        )

    all_goals = db.query(Goal).filter(
        Goal.employee_id == current_user.id,
        Goal.status      != GoalStatus.rejected
    ).all()

    total = sum(g.weightage for g in all_goals)
    if total != 100:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = f"Total weightage must equal 100% before submitting. Current total: {total}%"
        )

    goal.status = GoalStatus.submitted
    db.commit()
    db.refresh(goal)

    # send email to manager
    if current_user.manager_id:
        manager = db.query(User).filter(User.id == current_user.manager_id).first()
        if manager:
            background_tasks.add_task(
                send_email,
                goal_submitted_email(manager.email, current_user.name, goal.title)
            )

    return goal

# Get Team Goals (Manager)

@router.get("/team/all", response_model=List[GoalOut])
def get_team_goals(
    current_user: User    = Depends(require_role(UserRole.manager, UserRole.admin)),
    db:           Session = Depends(get_db)
):
    # get all employees under this manager
    team = db.query(User).filter(User.manager_id == current_user.id).all()
    team_ids = [u.id for u in team]

    return db.query(Goal).filter(Goal.employee_id.in_(team_ids)).all()

# Approve Goal (Manager)

@router.post("/{goal_id}/approve", response_model=GoalOut)
async def approve_goal(
    goal_id:          int,
    background_tasks: BackgroundTasks,
    current_user:     User    = Depends(require_role(UserRole.manager, UserRole.admin)),
    db:               Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal.status != GoalStatus.submitted:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = "Only submitted goals can be approved"
        )

    goal.status    = GoalStatus.approved
    goal.is_locked = True
    db.commit()
    db.refresh(goal)

    # send email to employee
    employee = db.query(User).filter(User.id == goal.employee_id).first()
    if employee:
        background_tasks.add_task(
            send_email,
            goal_approved_email(employee.email, goal.title)
        )

    return goal

# Reject Goal (Manager)

@router.post("/{goal_id}/reject", response_model=GoalOut)
async def reject_goal(
    goal_id:          int,
    background_tasks: BackgroundTasks,
    current_user:     User    = Depends(require_role(UserRole.manager, UserRole.admin)),
    db:               Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal.status != GoalStatus.submitted:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = "Only submitted goals can be rejected"
        )

    goal.status = GoalStatus.rejected
    db.commit()
    db.refresh(goal)

    # send email to employee
    employee = db.query(User).filter(User.id == goal.employee_id).first()
    if employee:
        background_tasks.add_task(
            send_email,
            goal_rejected_email(employee.email, goal.title)
        )

    return goal

# Unlock Goal (Admin only)

@router.post("/{goal_id}/unlock", response_model=GoalOut)
def unlock_goal(
    goal_id:      int,
    current_user: User    = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # log the unlock action
    log = AuditLog(
        goal_id    = goal.id,
        changed_by = current_user.id,
        change     = f"Goal unlocked by admin (user_id: {current_user.id})"
    )
    db.add(log)

    goal.is_locked = False
    goal.status    = GoalStatus.draft

    db.commit()
    db.refresh(goal)

    return goal

# Get Audit Logs (Admin only)

@router.get("/{goal_id}/audit", response_model=List[AuditLogOut])
def get_audit_logs(
    goal_id:      int,
    current_user: User    = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    return db.query(AuditLog).filter(AuditLog.goal_id == goal_id).all()

# Get All Goals (Admin only)

@router.get("/admin/all", response_model=List[GoalOut])
def get_all_goals(
    current_user: User    = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    return db.query(Goal).all()