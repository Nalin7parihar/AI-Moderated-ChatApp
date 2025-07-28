from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends,HTTPException,status,WebSocket,WebSocketException
from jose import jwt,JWTError
from datetime import datetime,timezone,timedelta
from sqlmodel import Session
from app.databases import get_session
from app.model import User
from app.schemas import TokenData
from app.config import settings

oauth2_scheme =OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def create_access_token(data :dict):
  to_encode = data.copy()
  expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  to_encode.update({"exp" : expire})
  
  encoded_jwt = jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
  return encoded_jwt

def verify_token(token : str,credentials_exception):
  try:
    payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
    user_id = payload.get("id")
    if user_id is None:
      if credentials_exception:
        raise credentials_exception
      else:
        raise Exception("Invalid token: no user ID")
    token_data = TokenData(id=user_id)
  except JWTError:
    if credentials_exception:
      raise credentials_exception
    else:
      raise Exception("JWT decode error")
  
  return token_data

def get_current_user(token : str = Depends(oauth2_scheme), db : Session = Depends(get_session)):
  credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"})
  
  token_data = verify_token(token,credentials_exception)
  user = db.get(User,token_data.id)
  if user is None:
    raise credentials_exception
  return user


def get_admin_user(current_user : User = Depends(get_current_user)):
  
  if not current_user.is_admin:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Admin permissions required"
    )
  return current_user   

async def get_current_user_websocket(websocket: WebSocket, db: Session):
  try:
    # Get token from query parameters
    token = websocket.query_params.get("token")
    if not token:
      await websocket.close(code=4001, reason="Missing authentication token")
      return None
    
    # Validate token
    try:
      token_data = verify_token(token, None)
      user = db.get(User, token_data.id)
      if user is None:
        await websocket.close(code=4001, reason="User not found")
        return None
      return user
    except Exception as auth_error:
      print(f"WebSocket authentication error: {auth_error}")
      await websocket.close(code=4001, reason="Invalid authentication token")
      return None
      
  except Exception as e:
    print(f"WebSocket authentication exception: {e}")
    try:
      await websocket.close(code=4001, reason="Authentication failed")
    except:
      pass  # Connection might already be closed
    return None


