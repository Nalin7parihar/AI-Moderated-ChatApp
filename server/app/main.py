from fastapi import FastAPI,status
from app.routes import chats,users,messages,auth

app = FastAPI()


@app.get('/',status_code=status.HTTP_200_OK)
def read_root():
    return {"message": "Welcome to the AI CHAT application!"}

app.include_router(auth.router)
app.include_router(users.router)
#app.include_router(messages.router)
#app.include_router(chats.router)