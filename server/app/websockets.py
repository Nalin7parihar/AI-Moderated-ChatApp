from fastapi import WebSocket
from typing import List, Dict


class WebSocketManager:
  def __init__(self):
    self.active_connections : Dict[int, List[WebSocket]] ={}
    
  async def connect(self, websocket : WebSocket,chat_id : int):
    """Accepts a new Websocket connections and add it to a list of active connections for the chat"""
    await websocket.accept()
    if chat_id not in self.active_connections:
      self.active_connections[chat_id] = []
    self.active_connections[chat_id].append(websocket)
    
  def disconnect(self, websocket : WebSocket,chat_id  :int):
    """Removes a Websocket connection from the list of active connections for the chat"""
    if chat_id in self.active_connections:
      self.active_connections[chat_id].remove(websocket)
      
  async def broadcast(self, message : str,chat_id : int):
    if chat_id in self.active_connections:
      for connection in self.active_connections[chat_id]:
        await connection.send_text(message)
        

manager = WebSocketManager()
    