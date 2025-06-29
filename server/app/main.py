from fastapi import FastAPI,status
from routes import chats,users,messages,auth
from app.databases import create_db_and_tables

app = FastAPI()
@app.on_event('startup')
def on_startup():
  create_db_and_tables

@app.get('/',status_code=status.HTTP_200_OK)
def read_root():
    return {"message": "Welcome to the AI CHAT application!"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(messages.router)
app.include_router(chats.router)