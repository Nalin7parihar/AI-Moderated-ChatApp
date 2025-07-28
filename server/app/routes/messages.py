from fastapi import APIRouter, Depends, HTTPException,status, Query, Response,WebSocket,WebSocketDisconnect
from typing import List,Annotated
from sqlmodel import Session,select
import json
from app.databases import get_session
from app.model import User, Message,Chat
from app.schemas import MessageCreate,MessageRead,MessageUpdate
from app.oauth2 import get_current_user, get_current_user_websocket
from app.websockets import manager




router = APIRouter(prefix='/messages',tags=['messages'])



@router.websocket('/ws/{chat_id}')
async def websocket_endpoint(websocket : WebSocket, chat_id : int):
  db = None
  try:
    # Get database session
    db = next(get_session())
    
    # Get user from WebSocket authentication
    current_user = await get_current_user_websocket(websocket, db)
    if not current_user:
      return
    
    # Check if user is participant in the chat
    db_chat = db.get(Chat, chat_id)
    if not db_chat:
      await websocket.close(code=4004, reason="Chat not found")
      return
    
    if current_user not in db_chat.participants:
      await websocket.close(code=4003, reason="You are not a participant in this chat")
      return
    
    # Connect to WebSocket
    await manager.connect(websocket, chat_id)
    print(f"User {current_user.name} connected to chat {chat_id}")
    
    while True:
      data = await websocket.receive_text()
      print(f"Received message in chat {chat_id}: {data}")
      # Echo back or handle the message as needed
      
  except WebSocketDisconnect:
    manager.disconnect(websocket, chat_id)
    print(f"User disconnected from chat {chat_id}")
  except Exception as e:
    print(f"WebSocket error: {e}")
    manager.disconnect(websocket, chat_id)
  finally:
    # Close database session
    if db:
      db.close()
    
    
    

@router.get('/{chat_id}',status_code=status.HTTP_200_OK,response_model=List[MessageRead])
async def get_messages(chat_id : int,db : Session = Depends(get_session),offset : int=0, limit : Annotated[int,Query(le=100)]=100,current_user : User = Depends(get_current_user)):
    db_chat = db.get(Chat,chat_id)
    if not db_chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if current_user not in db_chat.participants:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this chat")
    statement = select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc()).offset(offset).limit(limit)
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
  
  # Send structured message data to WebSocket clients
  message_data = {
    "type": "new_message",
    "message": {
      "id": db_message.id,
      "content": db_message.content,
      "created_at": db_message.created_at.isoformat(),
      "sender": {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
      }
    }
  }
  
  await manager.broadcast(json.dumps(message_data), chat_id)
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