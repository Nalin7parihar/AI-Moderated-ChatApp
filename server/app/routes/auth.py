from fastapi import APIRouter,Depends,status,HTTPException
from app.databases import get_session
from app.schemas import Token
from sqlmodel import Session,select
from fastapi.security import OAuth2PasswordRequestForm
from app.oauth2 import create_access_token
from app.utils import pwd_context
from app.model import User
router = APIRouter(prefix="/auth",tags=["auth"])

@router.post("/login",status_code=status.HTTP_200_OK,response_model=Token)
async def login(form_data : OAuth2PasswordRequestForm = Depends(), db : Session = Depends(get_session)):
  statement = (select(User).where(User.email == form_data.username))
  user = db.exec(statement).first()
  
  if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
  
  if not pwd_context.verify(form_data.password,user.password):
    access_token = create_access_token(data={"id":user.id})
    
    return Token(access_token=access_token,token_type="bearer")