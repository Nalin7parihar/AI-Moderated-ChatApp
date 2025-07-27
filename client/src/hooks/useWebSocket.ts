import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Message, MessageCreate, MessageUpdate } from "@/types";

interface ServerToClientMessage {
  newMessage: (message: Message) => void;
  messageUpdated: (message: Message) => void;
  messageDeleted: (messageId: number) => void;
  error: (error: { message: string }) => void;
}
interface ClientToServerMessage {
  sendMessage: (message: MessageCreate & { chat_id: number }) => void;
  updateMessage: (update: MessageUpdate & { message_id: number }) => void;
  deleteMessage: (messageId: number) => void;
}

const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket<ServerToClientMessage, ClientToServerMessage> | null>(null);

  useEffect(() => {
    // Get token from localStorage automatically
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    const socket = io(url, {
      auth: { token },
      autoConnect: true,
      reconnection: true
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    })
    socket.on("newMessage", (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on("messageUpdated", (updatedMessage) => {
      setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
    });
    socket.on("messageDeleted", (messageId) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    })
    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    }
  }, [url]);

  const sendMessage = (message: MessageCreate & { chat_id: number }) => {
    if (socketRef.current) {
      socketRef.current.emit("sendMessage", message);
    }
  };
  const updateMessage = (update: MessageUpdate & { message_id: number }) => {
    if (socketRef.current) {
      socketRef.current.emit("updateMessage", update);
    }
  };
  const deleteMessage = (messageId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("deleteMessage", messageId);
    }
  };
  return {
    isConnected,
    messages,
    sendMessage,
    updateMessage,
    deleteMessage
  };
}

export default useWebSocket;