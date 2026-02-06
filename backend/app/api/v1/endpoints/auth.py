# from datetime import timedelta, datetime
# from typing import Any
# from fastapi import APIRouter, Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
# from app.core import security
# from app.core.config import settings
# from app.core.database import get_database
# from app.models.user import User, UserCreate, UserInDB
# from bson import ObjectId
# from typing import Any, List

# router = APIRouter()

# # 1. REGISTER
# @router.post("/register", response_model=User)
# async def register(user_in: UserCreate):
#     db = get_database()
    
#     # Check if user exists
#     user = await db["users"].find_one({"email": user_in.email})
#     if user:
#         raise HTTPException(
#             status_code=400,
#             detail="The user with this username already exists in the system.",
#         )
    
#     # Create User
#     user_db = UserInDB(
#         _id=str(ObjectId()),
#         email=user_in.email,
#         full_name=user_in.full_name,
#         hashed_password=security.get_password_hash(user_in.password),
#         role=user_in.role,  # <--- FIX: Use the role from user_in
#         created_at=datetime.utcnow()
#     )
    
#     await db["users"].insert_one(user_db.dict(by_alias=True))
#     return user_db

# # 2. LOGIN
# @router.post("/login")
# async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
#     db = get_database()
#     user = await db["users"].find_one({"email": form_data.username})
    
#     # Validate User & Password
#     if not user or not security.verify_password(form_data.password, user["hashed_password"]):
#         raise HTTPException(status_code=400, detail="Incorrect email or password")
    
#     # Generate Token
#     access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
#     return {
#     "access_token": security.create_access_token(
#         {"sub": user["email"], "role": user.get("role", "employee")}, 
#         expires_delta=access_token_expires
#     ),
#     "token_type": "bearer",
# }

# # 3. GET CURRENT USER (Dependency)
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     try:
#         payload = security.jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
#         email: str = payload.get("sub")
#         if email is None:
#             raise credentials_exception
#     except Exception:
#         raise credentials_exception
        
#     db = get_database()
#     user = await db["users"].find_one({"email": email})
#     if user is None:
#         raise credentials_exception
        
#     # --- THE FIX IS HERE ---
#     # MongoDB might return _id as an ObjectId. We MUST convert it to string.
#     user["_id"] = str(user["_id"])
    
#     return User(**user)

# def check_role(required_role: str):
#     async def role_checker(current_user: User = Depends(get_current_user)):
#         # HR can do anything, Managers can't do HR tasks
#         if current_user.role == "hr":
#             return current_user
#         if current_user.role != required_role:
#             raise HTTPException(status_code=403, detail="Not enough permissions")
#         return current_user
#     return role_checker

# @router.get("/users/list", response_model=List[User])
# async def list_users():
#     db = get_database()
#     # Fetch all users
#     users_cursor = db["users"].find({})
#     users = await users_cursor.to_list(length=100)
    
#     for user in users:
#         user["_id"] = str(user["_id"])
#         # If a user was created before we fixed the role bug, 
#         # ensure they have a default role so the frontend doesn't skip them
#         if "role" not in user:
#             user["role"] = "employee"
            
#     return users

from datetime import timedelta, datetime
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from google.oauth2 import id_token
from google.auth.transport import requests
from app.core import security
from app.core.config import settings
from app.core.database import get_database
from app.models.user import User, UserInDB
from bson import ObjectId
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
import os


router = APIRouter()

# Replace YOUR_GOOGLE_CLIENT_ID with the one from Google Cloud Console
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/google-login")

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
        
    user["_id"] = str(user["_id"])
    return User(**user)

@router.post("/google-login")
async def google_login(payload: dict = Body(...)):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is missing")

    try:
        # 1. Verify Google Token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo['email']
        full_name = idinfo.get('name')
        picture = idinfo.get('picture')
        
        db = get_database()
        user_data = await db["users"].find_one({"email": email})
        
        is_new_user = False
        
        if not user_data:
            # 2. Create User if they don't exist (Role is initially None)
            is_new_user = True
            user_db = {
                "_id": str(ObjectId()),
                "email": email,
                "full_name": full_name,
                "picture": picture,
                "role": None, # Force role selection on frontend
                "created_at": datetime.utcnow()
            }
            await db["users"].insert_one(user_db)
            user_data = user_db
        else:
            # If user exists but has no role (abandoned onboarding)
            if not user_data.get("role"):
                is_new_user = True

        # 3. Issue NovaScan JWT
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            {"sub": email, "role": user_data.get("role", "pending")}, 
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "is_new_user": is_new_user,
            "role": user_data.get("role")
        }

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

@router.put("/update-role")
async def update_role(
    payload: dict = Body(...), 
    current_user: User = Depends(get_current_user)
):
    role = payload.get("role")
    if role not in ["hr", "manager", "employee"]:
        raise HTTPException(status_code=400, detail="Invalid role selection")
    
    db = get_database()
    
    # 1. Update the role in the database
    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": {"role": role}}
    )
    
    # 2. Re-issue the JWT token with the NEW role
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_token = security.create_access_token(
        {"sub": current_user.email, "role": role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": new_token, "status": "role_updated"}

@router.get("/users/list", response_model=List[User])
async def list_users():
    db = get_database()
    users_cursor = db["users"].find({})
    users = await users_cursor.to_list(length=100)
    
    for user in users:
        user["_id"] = str(user["_id"])
        # Ensure role exists for frontend filtering
        if "role" not in user or user["role"] is None:
            user["role"] = "pending"
            
    return users

def check_role(required_role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        # HR is the superuser; they bypass all specific role checks
        if current_user.role == "hr":
            return current_user
        
        # If the user isn't HR and doesn't match the specific required role, block them
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Not enough permissions"
            )
        return current_user
    return role_checker