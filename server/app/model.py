from sqlmodel import SQLModel,Field,Relationship
from typing import Optional,List
from datetime import datetime,timezone

class ChatParticiapant(SQLModel,table=True):
  __tablename__ = "chat_participant"
  user_id :Optional[int] = Field(default=None,primary_key=True,foreign_key="user.id")
  chat_id : Optional[int] = Field(default=None,primary_key=True,foreign_key="chat.id")
  

class User(SQLModel,table=True):
  __tablename__ = "user"
  id : Optional[int] = Field(default=None,primary_key=True)
  name : str = Field(index=True)
  email : str = Field(index=True,unique=True)
  password : str
  
  chats : List["Chat"] = Relationship(back_populates="participants",link_model=ChatParticiapant)
  
  messages : List["Message"]=  Relationship(back_populates="sender")
  

class Chat(SQLModel,table=True):
  __tablename__ = "chat"
  id : Optional[int] = Field(default=None,primary_key=True)
  title : str = Field(default="New Chat")
  created_at : datetime = Field(default=datetime.now(timezone.utc))
  
  participants : List[User] = Relationship(back_populates="chats",link_model=ChatParticiapant)
  messages : List["Message"] = Relationship(back_populates="chat")
  
class Message(SQLModel,table=True):
  __tablename__ = "message"
  id : Optional[int] = Field(default=None,primary_key=True)
  content : str
  created_at : datetime = Field(default=datetime.now())
  
  chat_id : Optional[int] = Field(default=None,foreign_key="chat.id")
  chat : Optional[Chat] = Relationship(back_populates="messages")
  
  sender_id : int = Field(foreign_key="user.id")
  sender : User = Relationship(back_populates="messages")
  