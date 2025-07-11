from fastapi import APIRouter,Depends,status,Query,HTTPException,Response,Body
from app.oauth2 import get_current_user
from app.databases import get_session
from sqlmodel import Session,select
from typing import Annotated,List
from app.model import User,Chat
from app.schemas import ChatCreate,ChatRead,ChatUpdate,AddParticipantRequest


router = APIRouter(prefix="/chats",tags = ["chats"])



@router.get('/',status_code=status.HTTP_200_OK,response_model=List[ChatRead])
async def get_chats(
    db: Session = Depends(get_session),
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
    current_user: User = Depends(get_current_user)
):
    """Get all chats for the current user"""
    statement = (
        select(Chat)
        .join(Chat.participants)
        .where(User.id == current_user.id)
        .offset(offset)
        .limit(limit)
    )
    results = db.exec(statement).all()
    return results
  
@router.post('/',status_code=status.HTTP_201_CREATED,response_model=ChatRead)
async def create_chat(
    chat_data: ChatCreate, 
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new chat with specified participants"""
    # Validate that participant IDs exist
    participant_ids = set(chat_data.participant_ids)
    participant_ids.add(current_user.id)  # Always include current user
    
    # Check if all participant IDs exist
    participants = db.exec(select(User).where(User.id.in_(participant_ids))).all()
    
    if len(participants) != len(participant_ids):
        found_ids = {p.id for p in participants}
        missing_ids = participant_ids - found_ids
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Users with IDs {list(missing_ids)} not found"
        )
    
    # Create the chat
    new_chat = Chat(
        title=chat_data.title or "New Chat",
        participants=participants
    )
    
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    return new_chat

@router.get('/{id}',status_code=status.HTTP_200_OK,response_model=ChatRead)
async def get_chat(
    id: int, 
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific chat by ID"""
    chat = db.get(Chat, id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Chat not found"
        )
    
    # Check if current user is a participant
    if current_user not in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not a participant in this chat"
        )
    
    return chat

@router.put('/{id}',status_code=status.HTTP_200_OK,response_model=ChatRead)
async def update_chat(
    id: int,
    chat_data: ChatUpdate, 
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update chat details (title, etc.)"""
    chat = db.get(Chat, id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Chat not found"
        )
    
    if current_user not in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not allowed to update this chat" 
        )
    
    # Update only the fields that were provided
    update_data = chat_data.model_dump(exclude_unset=True)
    
    # Handle participant_ids separately if provided
    if 'participant_ids' in update_data:
        participant_ids = set(update_data.pop('participant_ids'))
        participant_ids.add(current_user.id)  # Always include current user
        
        participants = db.exec(select(User).where(User.id.in_(participant_ids))).all()
        if len(participants) != len(participant_ids):
            found_ids = {p.id for p in participants}
            missing_ids = participant_ids - found_ids
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Users with IDs {list(missing_ids)} not found"
            )
        chat.participants = participants
    
    # Update other fields
    for field, value in update_data.items():
        setattr(chat, field, value)
    
    db.commit()
    db.refresh(chat)
    
    return chat

@router.patch('/{id}/add',status_code=status.HTTP_200_OK,response_model=ChatRead)
async def add_participant_to_chat(
    id: int, 
    request: AddParticipantRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Add a participant to an existing chat"""
    chat = db.get(Chat, id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Chat not found"
        )
    
    if current_user not in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not allowed to add participants to this chat"
        )
    
    user_to_add = db.exec(select(User).where(User.email == request.user_email)).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    if user_to_add in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User is already a participant in this chat"
        )
    
    chat.participants.append(user_to_add)
    db.commit()
    db.refresh(chat)
    return chat

@router.patch('/{id}/remove',status_code=status.HTTP_200_OK,response_model=ChatRead)
async def remove_participant_from_chat(
    id: int, 
    request: AddParticipantRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Remove a participant from an existing chat"""
    chat = db.get(Chat, id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Chat not found"
        )
    
    if current_user not in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not allowed to remove participants from this chat"
        )
    
    user_to_remove = db.exec(select(User).where(User.email == request.user_email)).first()
    if not user_to_remove:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    if user_to_remove not in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User is not a participant in this chat"
        )
    
    chat.participants.remove(user_to_remove)
    db.commit()
    db.refresh(chat)
    
    # If only one or no participants left, delete the chat
    if len(chat.participants) <= 1:
        db.delete(chat)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return chat

@router.patch('/{id}/leave',status_code=status.HTTP_200_OK)
async def leave_chat(
    id: int, 
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Leave a chat (remove yourself as a participant)"""
    chat = db.get(Chat, id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Chat not found"
        )
    
    if current_user not in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="You are not a participant in this chat"
        )
    
    chat.participants.remove(current_user)
    db.commit()
    
    # If only one or no participants left, delete the chat
    if len(chat.participants) <= 1:
        db.delete(chat)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    
    # Return success message
    return {"message": "Successfully left the chat"}

@router.delete('/{id}',status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    id: int, 
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a chat (only if you're a participant)"""
    chat = db.get(Chat, id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Chat not found"
        )
    
    if current_user not in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not allowed to delete this chat"
        )
    
    db.delete(chat)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.get('/{id}/participants', status_code=status.HTTP_200_OK, response_model=List[dict])
async def get_chat_participants(
    id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all participants of a specific chat"""
    chat = db.get(Chat, id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Chat not found"
        )
    
    if current_user not in chat.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not a participant in this chat"
        )
    
    return [
        {
            "id": participant.id,
            "name": participant.name,
            "email": participant.email
        }
        for participant in chat.participants
    ]



