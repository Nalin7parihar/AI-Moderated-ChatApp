from fastapi import APIRouter, Depends, HTTPException,status, Query, Response,WebSocket,WebSocketDisconnect
from typing import List,Annotated
from sqlmodel import Session,select
from app.databases import get_session
from app.model import User, Message,Chat
from app.schemas import MessageCreate,MessageRead,MessageUpdate
from app.oauth2 import get_current_user
from app.websockets import manager




router = APIRouter(prefix='/messages',tags=['messages'])



@router.websocket('/ws/{chat_id}')
async def websocket_endpoint(websocket : WebSocket, chat_id : int):
  
  await manager.connect(websocket,chat_id)
  try:
    
    while True:
      await websocket.receive_text()
  except WebSocketDisconnect:
    manager.disconnect(websocket,chat_id)
    
    
    

@router.get('/{chat_id}',status_code=status.HTTP_200_OK,response_model=List[MessageRead])
async def get_messages(chat_id : int,db : Session = Depends(get_session),offset : int=0, limit : Annotated[int,Query(le=100)]=100,current_user : User = Depends(get_current_user)):
    db_chat = db.get(Chat,chat_id)
    if not db_chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if current_user not in db_chat.participants:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this chat")
    statement = select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.desc()).offset(offset).limit(limit)
    results = db.exec(statement).all()  
    return results
  
@router.post('/{chat_id}',status_code=status.HTTP_201_CREATED,response_model=MessageRead)
async def create_message(chat_id : int, message : MessageCreate, db : Session = Depends(get_session),current_user : User = Depends(get_current_user)):
  db_chat = db.get(Chat,chat_id)
  if not db_chat:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
  
  if current_user not in db_chat.participants:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this chat")
  
  db_message = Message.model_validate(message,update={"chat_id": chat_id, "sender_id": current_user.id})
  
  db.add(db_message)
  db.commit()
  db.refresh(db_message)
  
  
  await manager.broadcast(f"New message from {current_user.name} : {db_message.content}",chat_id)
  return db_message

@router.patch('/{message_id}',response_model=MessageRead)
async def update_message(message_id : int, message_update:MessageUpdate,db : Session = Depends(get_session),current_user : User = Depends(get_current_user)):
    db_message = db.get(Message,message_id)
    if not db_message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    if db_message.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to update this message")
    
    update_data = message_update.model_dump(exclude_unset=True)
    db_message.sqlmodel_update(update_data)
    
    db.commit()
    db.refresh(db_message)
    
    return db_message
  
@router.delete('/{message_id}',status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(message_id : int, db : Session = Depends(get_session),current_user : User = Depends(get_current_user)):
    db_message = db.get(Message,message_id)
    if not db_message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    if db_message.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to delete this message")
    
    db.delete(db_message)
    db.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)  