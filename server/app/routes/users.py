from fastapi import APIRouter,Depends,status,Query,HTTPException,Response
from app.databases import get_session
from sqlmodel import Session,select,or_
from typing import Annotated,List
from app.model import User
from app.schemas import UserRead,UserCreate,UserUpdate,UserReadWithAdminInfo,AdminUserUpdate
from app.utils import pwd_context
from app.oauth2 import get_current_user,get_admin_user
router = APIRouter(prefix="/users")


#----ADMIN ROUTES---

@router.get("/admin",response_model=list[UserReadWithAdminInfo],tags=["admin"])
async def get_users_as_admin(
    db: Session = Depends(get_session),
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
    current_user: User = Depends(get_admin_user)
):
    all_users = db.exec(select(User).offset(offset).limit(limit)).all()
    return all_users
  
@router.get("/admin/{id}",response_model=UserReadWithAdminInfo,tags=["admin"])
async def get_user_as_admin(id : int, db : Session = Depends(get_session),current_user : User = Depends(get_admin_user)):
  user = db.get(User,id)
  if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
  return user

@router.patch('/admin/{id}',response_model=UserReadWithAdminInfo,tags=["admin"])
async def update_user_as_admin(updateUser : AdminUserUpdate,id : int,db : Session = Depends(get_session),current_user : User = Depends(get_admin_user)):
  db_user = db.get(User,id)
  if not db_user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
  
  update_data = updateUser.model_dump(exclude_unset=True)
  db_user.sqlmodel_update(update_data)
  
  db.add(db_user)
  db.commit()
  db.refresh(db_user)
  
  return db_user


#--USER ROUTES--
@router.get("/",status_code=status.HTTP_200_OK,response_model=List[UserRead],tags=["users"])
async def get_users(db : Session = Depends(get_session),offset : int =0,limit : Annotated[int,Query(le=100)]=100):
  all_users = db.exec(select(User).where(User.is_admin == False).offset(offset).limit(limit)).all()
  return all_users

@router.post('/',status_code=status.HTTP_201_CREATED,response_model=UserRead,tags=["users"])
async def create_user(user : UserCreate,db : Session=  Depends(get_session)):
  hashed_password = pwd_context.hash(user.password)
  db_user = User(
    name=user.name,
    email=user.email,
    password=hashed_password
  )
  db.add(db_user)
  db.commit()
  db.refresh(db_user)
  return db_user


@router.get('/search',status_code=status.HTTP_200_OK,response_model=List[UserRead],tags=["users"])
async def search_users(q:str,db : Session = Depends(get_session),offset : int =0,limit : int = 100,current_user : User = Depends(get_current_user)):
  search_term = f"%{q}%"
  
  statement = (select(User).where(
    or_(User.name.ilike(search_term),User.email.ilike(search_term)),
    User.is_admin == False
  ).offset(offset).limit(limit))
  results = db.exec(statement).all()
  return results

@router.get('/{id}',status_code=status.HTTP_200_OK,response_model=UserRead,tags=["users"])
async def get_user(id : int,db : Session = Depends(get_session),current_user : User = Depends(get_current_user)):
  if id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are not allowed to access this user")
  
  user = db.exec(select(User).where(User.id == id, User.is_admin == False)).first()
  if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
  return user



@router.put('/{id}',status_code=status.HTTP_200_OK,response_model=UserRead,tags=["users"])
async def update_user(id : int,user : UserUpdate,db : Session = Depends(get_session),current_user : User = Depends(get_current_user)):
  if id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are not allowed to update this user")
  db_user = db.exec(select(User).where(User.id == id, User.is_admin == False)).first()
  if not db_user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
  
  update_user = user.model_dump(exclude_unset=True)
  if "password" in update_user:
    hashed_password = pwd_context.hash(update_user["password"])
    db_user.password=  hashed_password
    del update_user["password"]
  db_user.sqlmodel_update(update_user)
  db.add(db_user)
  db.commit() 
  db.refresh(db_user)
  return db_user


@router.delete('/{id}',status_code=status.HTTP_204_NO_CONTENT,tags=["users"])
async def delete_user(id : int,db : Session = Depends(get_session),current_user : User = Depends(get_current_user)):
  if id != current_user.id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are not allowed to delete this user")
  db_user = db.exec(select(User).where(User.id == id, User.is_admin == False)).first()
  if not db_user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
  
  db.delete(db_user)
  db.commit()
  return Response(status_code=status.HTTP_204_NO_CONTENT)
 




