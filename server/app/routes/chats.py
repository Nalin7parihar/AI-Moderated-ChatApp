from fastapi import APIRouter,Depends,status,Query,HTTPException,Response
from app.oauth2 import get_current_user
from app.databases import get_session
from sqlmodel import Session,select
from typing import Annotated,List
from app.model import User,Chat
from app.schemas import ChatCreate,ChatRead,ChatUpdate


router = APIRouter(prefix="/chats",tags = ["chats"])



@router.get('/',status_code=status.HTTP_200_OK,response_model=List[ChatRead])
async def get_chats(db : Session = Depends(Session),offset : int=0,limit: Annotated[int,Query(le=100)]=100,current_user: User = Depends(get_current_user)):
    statement = select(Chat).where(Chat.participants.contains(current_user.id)).offset(offset).limit(limit)
    results = db.exec(statement).all()
    return results
  
@router.post('/',status_code=status.HTTP_201_CREATED,response_model=ChatRead)
async def create_chat(chat : ChatCreate, db : Session = Depends(get_session),current_User : User = Depends(get_current_user)):
  chat.participant_ids.append(current_User.id)
  db.add(chat)
  db.commit()
  db.refresh(chat)
  return chat

@router.get('/{id}',status_code=status.HTTP_200_OK,response_model=Chat)
async def get_chat(id:int, db: Session = Depends(get_session),current_user : User = Depends(get_current_user)):
  chat = db.get(Chat,id)
  if not chat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
  if current_user not in chat.participants:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are no longer a participant in this chat")
  
  return chat

@router.put('/{id}',status_code=status.HTTP_202_ACCEPTED,response_model=ChatRead)
async def update_chat(id : int,chat : ChatUpdate, db : Session = Depends(get_session),current_user : User = Depends(get_current_user)):
  to_be_updated_chat = db.get(Chat,id)
  if not to_be_updated_chat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
  if current_user not in to_be_updated_chat.participants:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to update the chat" )
  
  update_data = chat.model_dump(exclude_unset=True)
  to_be_updated_chat.sqlmodel_update(update_data)
  db.commit()
  db.refresh(to_be_updated_chat)
  
  return to_be_updated_chat

@router.delete('/{id}',status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(id : int, db : Session = Depends(get_session),current_user : User = Depends(get_current_user)):
  chat = db.get(Chat,id)
  if not chat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
  if current_user not in chat.participants:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to delete this chat")
  
  db.delete(chat)
  db.commit()
  return Response(status_code=status.HTTP_204_NO_CONTENT)
  
  
  
  