from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from app.core import security
from app.core.config import settings
from app.core.database import get_database
from app.models.user import User, UserCreate, UserInDB
from bson import ObjectId

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
    # We explicitly create a string ID here to try and prevent ObjectId issues
    user_db = UserInDB(
        _id=str(ObjectId()),
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password)
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
            {"sub": user["email"]}, 
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