from fastapi import FastAPI,status
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chats,users,messages,auth





app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/',status_code=status.HTTP_200_OK)
def read_root():
    return {"message": "Welcome to the AI CHAT application!"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(messages.router)
app.include_router(chats.router)