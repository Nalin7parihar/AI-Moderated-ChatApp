import { useState, useEffect, useRef, useCallback } from "react";
import { Message, ViolationStatus } from "@/types";

interface UseWebSocketReturn {
  isConnected: boolean;
  error: string | null;
  onMessage: (callback: (message: Message) => void) => void;
}

const useNativeWebSocket = (chatId: number): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageCallbackRef = useRef<((message: Message) => void) | null>(null);

  const onMessage = useCallback((callback: (message: Message) => void) => {
    messageCallbackRef.current = callback;
  }, []);

  const connect = useCallback(() => {
    if (!chatId || chatId === 0) {
      setError("No chat selected");
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create WebSocket URL with token as query parameter
      const wsUrl = `ws://127.0.0.1:8000/messages/ws/${chatId}?token=${encodeURIComponent(token)}`;
      console.log("Connecting to WebSocket:", wsUrl);

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log(`WebSocket connected to chat ${chatId}`);
        setIsConnected(true);
        setError(null);
      };

      socket.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_message" && data.message && messageCallbackRef.current) {
            // Convert the message to the expected format
            const message: Message = {
              id: data.message.id,
              content: data.message.content,
              created_at: data.message.created_at,
              sender_id: data.message.sender.id,
              sender: data.message.sender,
              violation_status: ViolationStatus.APPROVED // Default status for new messages
            };
            messageCallbackRef.current(message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket disconnected from chat ${chatId}:`, event.code, event.reason);
        setIsConnected(false);

        if (event.code === 4001) {
          setError("Authentication failed");
        } else if (event.code === 4003) {
          setError("You are not a participant in this chat");
        } else if (event.code === 4004) {
          setError("Chat not found");
        } else if (event.code === 1000) {
          // Normal closure
          setError(null);
        } else {
          setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
          // Try to reconnect after 3 seconds for unexpected closures
          if (chatId && chatId !== 0) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("Attempting to reconnect...");
              connect();
            }, 3000);
          }
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setError("Failed to connect to chat");
    }
  }, [chatId]); const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, "Component unmounting");
      socketRef.current = null;
    }
    setIsConnected(false);
    setError(null);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    onMessage,
    error
  };
};

export default useNativeWebSocket;
