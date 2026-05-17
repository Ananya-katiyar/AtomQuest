from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import users, goals, checkins, escalation
from escalation import start_scheduler
import models

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title       = "AtomQuest Goal Tracking Portal",
    description = "Goal Setting & Tracking API for AtomQuest Hackathon 1.0",
    version     = "1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [
        "http://localhost:5173",
        "https://atom-quest-theta.vercel.app",
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# Routers
app.include_router(users.router,      prefix="/auth",       tags=["Auth & Users"])
app.include_router(goals.router,      prefix="/goals",      tags=["Goals"])
app.include_router(checkins.router,   prefix="/checkins",   tags=["Check-ins"])
app.include_router(escalation.router, prefix="/escalations",tags=["Escalations"])

# Start scheduler on startup
@app.on_event("startup")
def startup_event():
    start_scheduler()

@app.get("/")
def root():
    return {"message": "AtomQuest API is running ✅"}