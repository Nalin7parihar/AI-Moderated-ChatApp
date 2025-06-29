from fastapi import APIRouter,Depends,status,Query
from app.databases import get_session
from sqlmodel import Session,select
from typing import Optional,Annotated
from app.model import User
router = APIRouter(prefix="/users",tags=["users"])

@router.get("/",status_code=status.HTTP_200_OK)
async def get_users(db : Session = Depends(get_session),offset : int =0,limit : Annotated[int,Query(le=100)]=100):
  all_users = db.exec(select(User).offset(offset).limit(limit)).all()
  return all_users