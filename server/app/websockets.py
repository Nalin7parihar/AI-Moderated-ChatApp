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
      try:
        self.active_connections[chat_id].remove(websocket)
        # Remove empty chat rooms
        if not self.active_connections[chat_id]:
          del self.active_connections[chat_id]
      except ValueError:
        # WebSocket not in list (already disconnected)
        pass
      
  async def broadcast(self, message : str,chat_id : int):
    if chat_id in self.active_connections:
      # Create a copy of connections to avoid modification during iteration
      connections = self.active_connections[chat_id].copy()
      for connection in connections:
        try:
          await connection.send_text(message)
        except Exception as e:
          print(f"Error broadcasting to connection: {e}")
          # Remove failed connection
          self.disconnect(connection, chat_id)
        

manager = WebSocketManager()
    