from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import os

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME    = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD    = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM        = os.getenv("MAIL_FROM"),
    MAIL_PORT        = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER      = os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS    = True,
    MAIL_SSL_TLS     = False,
    USE_CREDENTIALS  = True,
)

fastmail = FastMail(conf)

# Email Templates

def goal_submitted_email(manager_email: str, employee_name: str, goal_title: str) -> MessageSchema:
    return MessageSchema(
        subject    = "📋 New Goal Submitted for Approval",
        recipients = [manager_email],
        body       = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">AtomQuest Goal Portal</h2>
            <p>Hi Manager,</p>
            <p><strong>{employee_name}</strong> has submitted a goal for your approval:</p>
            <div style="background: #f0f7ff; border-left: 4px solid #2563eb; padding: 12px; margin: 16px 0;">
                <strong>{goal_title}</strong>
            </div>
            <p>Please login to the portal to review and approve.</p>
            <a href="http://localhost:5173" 
               style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
               Review Goal
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">AtomQuest Hackathon 1.0</p>
        </body>
        </html>
        """,
        subtype = "html"
    )

def goal_approved_email(employee_email: str, goal_title: str) -> MessageSchema:
    return MessageSchema(
        subject    = "✅ Your Goal Has Been Approved",
        recipients = [employee_email],
        body       = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">AtomQuest Goal Portal</h2>
            <p>Great news! Your goal has been approved:</p>
            <div style="background: #f0fff4; border-left: 4px solid #22c55e; padding: 12px; margin: 16px 0;">
                <strong>{goal_title}</strong>
            </div>
            <p>Your goal is now locked and active. You can start logging quarterly achievements.</p>
            <a href="http://localhost:5173"
               style="background:#22c55e;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
               View My Goals
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">AtomQuest Hackathon 1.0</p>
        </body>
        </html>
        """,
        subtype = "html"
    )

def goal_rejected_email(employee_email: str, goal_title: str) -> MessageSchema:
    return MessageSchema(
        subject    = "❌ Your Goal Needs Revision",
        recipients = [employee_email],
        body       = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">AtomQuest Goal Portal</h2>
            <p>Your goal needs revision:</p>
            <div style="background: #fff0f0; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;">
                <strong>{goal_title}</strong>
            </div>
            <p>Please login to review feedback and resubmit your goal.</p>
            <a href="http://localhost:5173"
               style="background:#ef4444;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
               Revise Goal
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">AtomQuest Hackathon 1.0</p>
        </body>
        </html>
        """,
        subtype = "html"
    )

def checkin_logged_email(manager_email: str, employee_name: str, goal_title: str, quarter: str, score: float) -> MessageSchema:
    return MessageSchema(
        subject    = f"📊 {employee_name} logged Q{quarter} achievement",
        recipients = [manager_email],
        body       = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">AtomQuest Goal Portal</h2>
            <p><strong>{employee_name}</strong> has logged their {quarter} achievement:</p>
            <div style="background: #f0f7ff; border-left: 4px solid #2563eb; padding: 12px; margin: 16px 0;">
                <strong>Goal:</strong> {goal_title}<br/>
                <strong>Quarter:</strong> {quarter}<br/>
                <strong>Score:</strong> {score}%
            </div>
            <p>Please login to add your check-in comment.</p>
            <a href="http://localhost:5173"
               style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
               Add Comment
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">AtomQuest Hackathon 1.0</p>
        </body>
        </html>
        """,
        subtype = "html"
    )

# Send Helper

async def send_email(message: MessageSchema):
    try:
        await fastmail.send_message(message)
        print(f"[Email] Sent: {message.subject}")
    except Exception as e:
        print(f"[Email] Failed: {e}")