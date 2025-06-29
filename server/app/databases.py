from sqlmodel import SQLModel,create_engine,Session
from fastapi import FastAPI
from app.config import settings

app = FastAPI()

engine = create_engine(settings.DATABASE_URL)


def create_db_and_tables():
  SQLModel.metadata.create_all(engine)
  
def get_session():
  with Session(engine) as session:
    yield session
    