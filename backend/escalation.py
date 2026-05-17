from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Goal, CheckIn, EscalationLog, GoalStatus, UserRole
from datetime import datetime, timedelta

# Escalation Rules

# Rule 1: Employee has not submitted goals within 7 days of having draft goals
# Rule 2: Manager has not approved goals within 3 days of submission
# Rule 3: Employee has not logged check-in for approved goals this quarter

def check_escalations():
    print(f"[Escalation] Running checks at {datetime.now()}")
    db: Session = SessionLocal()

    try:
        now = datetime.utcnow()

        # Rule 1: Unsubmitted draft goals older than 7 days
        old_drafts = db.query(Goal).filter(
            Goal.status == GoalStatus.draft,
            Goal.created_at <= now - timedelta(days=7)
        ).all()

        for goal in old_drafts:
            # check if already escalated
            existing = db.query(EscalationLog).filter(
                EscalationLog.user_id == goal.employee_id,
                EscalationLog.reason.like(f"%Goal ID {goal.id}%unsubmitted%"),
                EscalationLog.resolved == False
            ).first()

            if not existing:
                log = EscalationLog(
                    user_id = goal.employee_id,
                    reason  = f"Goal ID {goal.id} '{goal.title}' is unsubmitted for more than 7 days"
                )
                db.add(log)
                print(f"[Escalation] Rule 1 triggered for user {goal.employee_id}")

        # Rule 2: Submitted goals not approved within 3 days
        pending_approvals = db.query(Goal).filter(
            Goal.status    == GoalStatus.submitted,
            Goal.updated_at != None,
            Goal.updated_at <= now - timedelta(days=3)
        ).all()

        for goal in pending_approvals:
            employee  = db.query(User).filter(User.id == goal.employee_id).first()
            if not employee or not employee.manager_id:
                continue

            existing = db.query(EscalationLog).filter(
                EscalationLog.user_id == employee.manager_id,
                EscalationLog.reason.like(f"%Goal ID {goal.id}%unapproved%"),
                EscalationLog.resolved == False
            ).first()

            if not existing:
                log = EscalationLog(
                    user_id = employee.manager_id,
                    reason  = f"Goal ID {goal.id} '{goal.title}' submitted by employee #{goal.employee_id} is unapproved for more than 3 days"
                )
                db.add(log)
                print(f"[Escalation] Rule 2 triggered for manager {employee.manager_id}")

        # Rule 3: Approved goals with no check-in this quarter 
        current_month = now.month
        if   current_month in [7, 8, 9]:   current_quarter = "Q1"
        elif current_month in [10, 11, 12]: current_quarter = "Q2"
        elif current_month in [1, 2, 3]:   current_quarter = "Q3"
        else:                               current_quarter = "Q4"

        approved_goals = db.query(Goal).filter(
            Goal.status == GoalStatus.approved
        ).all()

        for goal in approved_goals:
            has_checkin = db.query(CheckIn).filter(
                CheckIn.goal_id == goal.id,
                CheckIn.quarter == current_quarter
            ).first()

            if not has_checkin:
                existing = db.query(EscalationLog).filter(
                    EscalationLog.user_id == goal.employee_id,
                    EscalationLog.reason.like(f"%Goal ID {goal.id}%{current_quarter}%"),
                    EscalationLog.resolved == False
                ).first()

                if not existing:
                    log = EscalationLog(
                        user_id = goal.employee_id,
                        reason  = f"Goal ID {goal.id} '{goal.title}' has no check-in for {current_quarter}"
                    )
                    db.add(log)
                    print(f"[Escalation] Rule 3 triggered for user {goal.employee_id}")

        db.commit()
        print("[Escalation] Checks complete")

    except Exception as e:
        print(f"[Escalation] Error: {e}")
        db.rollback()
    finally:
        db.close()

# Scheduler

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        check_escalations,
        trigger  = 'interval',
        hours    = 24,          # runs every 24 hours
        id       = 'escalation_check',
        replace_existing = True
    )
    scheduler.start()
    print("[Escalation] Scheduler started — runs every 24 hours")
    return scheduler