from datetime import timedelta, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from app.core import security
from app.core.config import settings
from app.core.database import get_database
from app.models.user import User, UserCreate, UserInDB
from bson import ObjectId
from typing import Any, List

router = APIRouter()

# 1. REGISTER
@router.post("/register", response_model=User)
async def register(user_in: UserCreate):
    db = get_database()
    
    # Check if user exists
    user = await db["users"].find_one({"email": user_in.email})
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    # Create User
    user_db = UserInDB(
        _id=str(ObjectId()),
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=security.get_password_hash(user_in.password),
        role=user_in.role,  # <--- FIX: Use the role from user_in
        created_at=datetime.utcnow()
    )
    
    await db["users"].insert_one(user_db.dict(by_alias=True))
    return user_db

# 2. LOGIN
@router.post("/login")
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    user = await db["users"].find_one({"email": form_data.username})
    
    # Validate User & Password
    if not user or not security.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Generate Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    return {
    "access_token": security.create_access_token(
        {"sub": user["email"], "role": user.get("role", "employee")}, 
        expires_delta=access_token_expires
    ),
    "token_type": "bearer",
}

# 3. GET CURRENT USER (Dependency)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    db = get_database()
    user = await db["users"].find_one({"email": email})
    if user is None:
        raise credentials_exception
        
    # --- THE FIX IS HERE ---
    # MongoDB might return _id as an ObjectId. We MUST convert it to string.
    user["_id"] = str(user["_id"])
    
    return User(**user)

def check_role(required_role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        # HR can do anything, Managers can't do HR tasks
        if current_user.role == "hr":
            return current_user
        if current_user.role != required_role:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return role_checker

@router.get("/users/list", response_model=List[User])
async def list_users():
    db = get_database()
    # Fetch all users
    users_cursor = db["users"].find({})
    users = await users_cursor.to_list(length=100)
    
    for user in users:
        user["_id"] = str(user["_id"])
        # If a user was created before we fixed the role bug, 
        # ensure they have a default role so the frontend doesn't skip them
        if "role" not in user:
            user["role"] = "employee"
            
    return users