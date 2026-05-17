from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole
from schemas import UserCreate, UserOut, UserLogin, Token
from auth import hash_password, verify_password, create_access_token, get_current_user, require_role
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

# Register

@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(get_db)):

    # check if email already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail      = "Email already registered"
        )

    # hash the password before saving
    new_user = User(
        name       = user_data.name,
        email      = user_data.email,
        password   = hash_password(user_data.password),
        role       = user_data.role,
        manager_id = user_data.manager_id if user_data.manager_id else None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# Login

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # OAuth2PasswordRequestForm uses 'username' field
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail      = "Invalid email or password"
        )

    access_token = create_access_token(data={
        "user_id": user.id,
        "role":    user.role.value
    })

    return {
        "access_token": access_token,
        "token_type":   "bearer"
    }


# Get Current User

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Get All Users (Admin only)

@router.get("/users", response_model=list[UserOut])
def get_all_users(
    current_user: User = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    return db.query(User).all()

# Get Team (Manager only)

@router.get("/team", response_model=list[UserOut])
def get_my_team(
    current_user: User = Depends(require_role(UserRole.manager, UserRole.admin)),
    db:           Session = Depends(get_db)
):
    return db.query(User).filter(User.manager_id == current_user.id).all()

# Update User Role (Admin only)

@router.put("/users/{user_id}/role", response_model=UserOut)
def update_role(
    user_id:      int,
    role:         UserRole,
    current_user: User = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail      = "User not found"
        )

    user.role = role
    db.commit()
    db.refresh(user)

    return user

from schemas import UserCreate, UserOut, UserLogin, Token, UserUpdate
# Update User (Admin only)
@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id:      int,
    user_data:    UserUpdate,
    current_user: User    = Depends(require_role(UserRole.admin)),
    db:           Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.manager_id is not None:
        user.manager_id = user_data.manager_id
    if user_data.name is not None:
        user.name = user_data.name

    db.commit()
    db.refresh(user)
    return user