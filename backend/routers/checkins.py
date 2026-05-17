from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models import User, Goal, CheckIn, UserRole, GoalStatus
from schemas import CheckInCreate, CheckInManagerComment, CheckInOut
from auth import get_current_user, require_role
from typing import List
from email_service import send_email, checkin_logged_email

router = APIRouter()

# Helper: Calculate Score

def calculate_score(uom_type: str, target: float, achievement: float) -> float:
    if target == 0:
        return 0.0
    if uom_type in ["numeric", "percent"]:
        return round((achievement / target) * 100, 2)    # higher is better
    elif uom_type == "timeline":
        return round((target / achievement) * 100, 2)    # lower is better
    elif uom_type == "zero":
        return 100.0 if achievement == 0 else 0.0        # zero = success
    return 0.0

# Log Achievement (Employee)

@router.post("/", response_model=CheckInOut)
async def create_checkin(
    checkin_data:     CheckInCreate,
    background_tasks: BackgroundTasks,
    current_user:     User    = Depends(require_role(UserRole.employee)),
    db:               Session = Depends(get_db)
):
    goal = db.query(Goal).filter(
        Goal.id          == checkin_data.goal_id,
        Goal.employee_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal.status != GoalStatus.approved:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = "Only approved goals can have check-ins"
        )

    existing = db.query(CheckIn).filter(
        CheckIn.goal_id == checkin_data.goal_id,
        CheckIn.quarter == checkin_data.quarter
    ).first()

    if existing:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = f"Check-in for {checkin_data.quarter} already exists"
        )

    score = calculate_score(
        uom_type    = goal.uom_type.value,
        target      = goal.target,
        achievement = checkin_data.achievement
    )

    new_checkin = CheckIn(
        goal_id         = checkin_data.goal_id,
        quarter         = checkin_data.quarter,
        achievement     = checkin_data.achievement,
        progress_status = checkin_data.progress_status,
        score           = score
    )

    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)

    # send email to manager
    if current_user.manager_id:
        manager = db.query(User).filter(User.id == current_user.manager_id).first()
        if manager:
            background_tasks.add_task(
                send_email,
                checkin_logged_email(
                    manager.email,
                    current_user.name,
                    goal.title,
                    checkin_data.quarter,
                    score
                )
            )

    return new_checkin

# Get My Check-ins (Employee)

@router.get("/my", response_model=List[CheckInOut])
def get_my_checkins(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    # get all goals of this employee
    goal_ids = [
        g.id for g in db.query(Goal).filter(
            Goal.employee_id == current_user.id
        ).all()
    ]

    return db.query(CheckIn).filter(
        CheckIn.goal_id.in_(goal_ids)
    ).all()

# Get Check-ins for a Goal

@router.get("/goal/{goal_id}", response_model=List[CheckInOut])
def get_checkins_for_goal(
    goal_id:      int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    return db.query(CheckIn).filter(CheckIn.goal_id == goal_id).all()

# Get Team Check-ins (Manager)

@router.get("/team", response_model=List[CheckInOut])
def get_team_checkins(
    current_user: User    = Depends(require_role(UserRole.manager, UserRole.admin)),
    db:           Session = Depends(get_db)
):
    # get all employees under this manager
    team     = db.query(User).filter(User.manager_id == current_user.id).all()
    team_ids = [u.id for u in team]

    # get all goals of team members
    goal_ids = [
        g.id for g in db.query(Goal).filter(
            Goal.employee_id.in_(team_ids)
        ).all()
    ]

    return db.query(CheckIn).filter(
        CheckIn.goal_id.in_(goal_ids)
    ).all()

# Add Manager Comment (Manager)

@router.put("/{checkin_id}/comment", response_model=CheckInOut)
def add_manager_comment(
    checkin_id:   int,
    comment_data: CheckInManagerComment,
    current_user: User    = Depends(require_role(UserRole.manager, UserRole.admin)),
    db:           Session = Depends(get_db)
):
    checkin = db.query(CheckIn).filter(CheckIn.id == checkin_id).first()

    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")

    checkin.manager_comment = comment_data.manager_comment

    db.commit()
    db.refresh(checkin)

    return checkin

# Get All Check-ins (Admin)

@router.get("/admin/all", response_model=List[CheckInOut])
def get_all_checkins(
    current_user: User    = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    return db.query(CheckIn).all()

# Get Completion Report (Admin)

@router.get("/admin/report")
def get_completion_report(
    current_user: User    = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    all_goals    = db.query(Goal).filter(Goal.status == GoalStatus.approved).all()
    all_checkins = db.query(CheckIn).all()

    checkin_goal_ids = set(c.goal_id for c in all_checkins)

    report = []
    for goal in all_goals:
        report.append({
            "goal_id":     goal.id,
            "employee_id": goal.employee_id,
            "title":       goal.title,
            "target":      goal.target,
            "checkins":    [
                {
                    "quarter":         c.quarter,
                    "achievement":     c.achievement,
                    "score":           c.score,
                    "progress_status": c.progress_status.value
                }
                for c in all_checkins if c.goal_id == goal.id
            ],
            "has_checkin": goal.id in checkin_goal_ids
        })

    return {
        "total_goals":         len(all_goals),
        "goals_with_checkins": len(checkin_goal_ids),
        "completion_rate":     f"{round(len(checkin_goal_ids) / len(all_goals) * 100, 1) if all_goals else 0}%",
        "report":              report
    }