'use client'
import { useState,useEffect,ReactNode,createContext,useContext } from "react"
import { Chat,ChatCreate,ChatUpdate } from "@/types"
import { User } from "@/types/user"
import axios from 'axios';
import { api } from "@/lib/api";
interface ChatContextType {
  chats : Chat[],
  fetchChats : () => Promise<void>,
  addChat : (chat : ChatCreate) => Promise<void>,
  updateChat : (chatId : number, chatData : ChatUpdate) => Promise<void>,
  deleteChat : (chatId : number) => Promise<void>,
  addParticipant : (chatId : number, userEmail : string) => Promise<void>,
  removeParticipant : (chatId : number, userEmail : string) => Promise<void>,
  leaveChat : (chatId : number) => Promise<void>,
  getChatParticipants : (chatId : number) => Promise<User[]>,
  getChat : (chatId : number) => Promise<Chat>,
  loading : boolean,
  error : string | null,
}

const ChatContext=  createContext<ChatContextType | undefined>(undefined)

export const  ChatProvider  = ({children} : {children :ReactNode}) =>{
  const [chats,setChats] = useState<Chat[]>([])
  const [loading,isLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchChats();
    }
  }, []);

  const fetchChats = async () => {
     try {
      isLoading(true);
      const data = await api.getChats();
      setChats(data);
     }catch(error) {
      setError(error instanceof Error ? error.message : "Failed to fetch chats");
    } finally {
      isLoading(false);
    }
  }

  const addChat = async (chat : ChatCreate) => {
    try {
      const newChat = await api.createChat(chat);
      setChats(prev => [...prev, newChat]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create chat");
      throw error;
    }
  }

  const updateChat = async (chatId : number, chatData : ChatUpdate) => {
    try {
      const updatedChat = await api.updateChat(chatId.toString(), chatData);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update chat");
      throw error;
    }
  }

  const deleteChat = async (chatId : number) => {
    try {
      await api.deleteChat(chatId.toString());
      setChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete chat");
      throw error;
    }
  }

  const addParticipant = async (chatId : number, userEmail : string) => {
    try {
      const updatedChat = await api.addParticipant(chatId.toString(), userEmail);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add participant");
      throw error;
    }
  }

  const removeParticipant = async (chatId : number, userEmail : string) => {
    try {
      const updatedChat = await api.removeParticipant(chatId.toString(), userEmail);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to remove participant");
      throw error;
    }
  }

  const leaveChat = async (chatId : number) => {
    try {
      await api.leaveChat(chatId.toString());
      // Remove chat from local state since user left
      setChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to leave chat");
      throw error;
    }
  }

  const getChatParticipants = async (chatId : number) : Promise<User[]> => {
    try {
      const participants = await api.getChatParticipants(chatId.toString());
      return participants;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to get chat participants");
      throw error;
    }
  }

  const getChat = async (chatId : number) : Promise<Chat> => {
    try {
      const chat = await api.getChat(chatId.toString());
      // Update local state if needed
      setChats(prev => {
        const existingIndex = prev.findIndex(c => c.id === chatId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = chat;
          return updated;
        }
        return prev;
      });
      return chat;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to get chat");
      throw error;
    }
  }

  return (
    <ChatContext.Provider value={{
      chats,
      addChat,
      updateChat,
      deleteChat,
      addParticipant,
      removeParticipant,
      leaveChat,
      getChatParticipants,
      getChat,
      fetchChats,
      loading,
      error
    }}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook to use the ChatContext
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};