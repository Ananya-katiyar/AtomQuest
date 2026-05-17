# AtomQuest - Goal Setting & Tracking Portal

## Problem Statement

Organizations often rely on spreadsheets, emails, and manual review cycles for employee goal management. This creates poor visibility, inconsistent tracking, delayed approvals, and difficulty during quarterly performance reviews.

The objective of this project was to build a centralized web-based Goal Setting & Tracking Portal that enables employees, managers, and administrators to efficiently manage the complete lifecycle of organizational goals — from creation and approval to quarterly achievement tracking and analytics.

## What We Built

We developed a full-stack enterprise performance management portal with secure JWT-based authentication and RBAC-enabled workflows.

The system supports:
- Goal creation and submission by employees
- Manager approval and inline goal review
- Quarterly check-ins with automatic progress score calculation
- Shared goal workflows
- Real-time analytics dashboards
- Escalation and notification modules
- Audit-ready tracking and reporting

The platform was designed with scalability, clean architecture, and role-based workflow separation in mind.

# Demo Credentials

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@atomquest.com      | admin123    |
| Manager  | manager@atomquest.com    | manager123  |
| Employee | employee@atomquest.com   | employee123 |

# Tech Stack
- Frontend: React + Tailwind CSS
- Backend: Python + FastAPI
- Database: PostgreSQL (Neon)
- Auth: JWT + RBAC

# Features
- Goal creation with weightage validation
- Manager approval workflow
- Quarterly check-ins with auto score calculation
- Analytics dashboard
- Escalation module
- Email notifications