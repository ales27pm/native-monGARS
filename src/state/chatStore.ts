import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AIResponse } from "../types/ai";

export type AIProvider = 'local' | 'anthropic' | 'openai' | 'grok';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    provider?: AIProvider;
    model?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  provider: AIProvider;
}

interface ChatState {
  // Current conversation state
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  selectedProvider: AIProvider;
  
  // Actions
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  addConversation: (conversation: Conversation) => void;
  deleteConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedProvider: (provider: AIProvider) => void;
  clearError: () => void;
  
  // Computed
  getCurrentMessages: () => Message[];
  getConversationById: (id: string) => Conversation | undefined;
  
  // Utility actions
  createNewConversation: (title?: string) => Conversation;
  generateConversationTitle: (firstMessage: string) => string;
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentConversation: null,
      conversations: [],
      isLoading: false,
      error: null,
      selectedProvider: 'local',
      
      // Actions
      setCurrentConversation: (conversation) => 
        set({ currentConversation: conversation }),
      
      addMessage: (message) => {
        const { currentConversation } = get();
        if (!currentConversation) return;
        
        const updatedConversation = {
          ...currentConversation,
          messages: [...currentConversation.messages, message],
          updatedAt: new Date(),
        };
        
        set((state) => ({
          currentConversation: updatedConversation,
          conversations: state.conversations.map(conv => 
            conv.id === currentConversation.id ? updatedConversation : conv
          ),
        }));
      },
      
      addConversation: (conversation) =>
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        })),
      
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter(conv => conv.id !== id),
          currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
        })),
      
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
          ),
          currentConversation: state.currentConversation?.id === id 
            ? { ...state.currentConversation, ...updates, updatedAt: new Date() }
            : state.currentConversation,
        })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSelectedProvider: (provider) => set({ selectedProvider: provider }),
      clearError: () => set({ error: null }),
      
      // Computed
      getCurrentMessages: () => get().currentConversation?.messages || [],
      
      getConversationById: (id) => 
        get().conversations.find(conv => conv.id === id),
      
      // Utility actions
      createNewConversation: (title) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        
        return {
          id,
          title: title || 'New Conversation',
          messages: [],
          createdAt: now,
          updatedAt: now,
          provider: get().selectedProvider,
        };
      },
      
      generateConversationTitle: (firstMessage) => {
        const maxLength = 50;
        if (firstMessage.length <= maxLength) return firstMessage;
        return firstMessage.substring(0, maxLength - 3) + '...';
      },
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        selectedProvider: state.selectedProvider,
      }),
    }
  )
);

export default useChatStore;