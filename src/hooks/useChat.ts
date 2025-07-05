import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import useChatStore, { Message, Conversation, AIProvider } from '../state/chatStore';
import { getAnthropicTextResponse, getOpenAITextResponse, getGrokTextResponse } from '../api/chat-service';
import { logger } from '../utils/logger';
import { localLLMService } from '../services/LocalLLMService';
import { AIMessage } from '../types/ai';

interface UseChatOptions {
  autoSave?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseChatReturn {
  // State
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentConversation: Conversation | null;
  conversations: Conversation[];
  selectedProvider: AIProvider;
  isLocalLLMInitialized: boolean;
  
  // Actions
  sendMessage: (text: string) => Promise<void>;
  createNewConversation: (title?: string) => void;
  selectConversation: (conversation: Conversation) => void;
  deleteConversation: (id: string) => void;
  clearError: () => void;
  setProvider: (provider: AIProvider) => void;
  retryLastMessage: () => Promise<void>;
  
  // Utilities
  exportConversation: (conversation: Conversation) => string;
  getConversationPreview: (conversation: Conversation) => string;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    autoSave = true,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [isLocalLLMInitialized, setIsLocalLLMInitialized] = useState(false);

  const {
    currentConversation,
    conversations,
    isLoading,
    error,
    selectedProvider,
    setCurrentConversation,
    addMessage,
    addConversation,
    deleteConversation: deleteConv,
    setLoading,
    setError,
    setSelectedProvider,
    clearError,
    getCurrentMessages,
    createNewConversation: createConv,
    generateConversationTitle,
  } = useChatStore();

  // Initialize with a default conversation if none exists
  useEffect(() => {
    if (!currentConversation && conversations.length === 0) {
      const newConversation = createConv('New Conversation');
      addConversation(newConversation);
      setCurrentConversation(newConversation);
      logger.info('useChat', 'Initialized with default conversation');
    }
  }, [currentConversation, conversations.length, createConv, addConversation, setCurrentConversation]);

  useEffect(() => {
    const initLocalLLM = async () => {
      try {
        const success = await localLLMService.initialize();
        setIsLocalLLMInitialized(success);
        if (success) {
          logger.info('useChat', 'Local LLM initialized successfully');
        } else {
          logger.warn('useChat', 'Local LLM initialization failed');
        }
      } catch (e) {
        logger.error('useChat', 'Local LLM init error', e);
        setIsLocalLLMInitialized(false);
      }
    };
    initLocalLLM();
  }, []);

  const getAIResponse = useCallback(async (history: Message[], provider: AIProvider) => {
    const startTime = Date.now();
    logger.apiRequest('useChat', 'POST', `AI/${provider}`);

    const apiMessages = history.map(msg => ({
      role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.text,
    }));

    try {
      let response;
      
      switch (provider) {
        case 'local':
          if (!isLocalLLMInitialized) throw new Error("Local LLM not initialized.");
          const localResponse = await localLLMService.chat(apiMessages as any);
          response = { content: localResponse.text, usage: localResponse.usage };
          break;
        case 'anthropic':
          response = await getAnthropicTextResponse(apiMessages);
          break;
        case 'openai':
          response = await getOpenAITextResponse(apiMessages as AIMessage[]);
          break;
        case 'grok':
          response = await getGrokTextResponse(apiMessages as AIMessage[]);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      const duration = Date.now() - startTime;
      logger.apiResponse('useChat', 'POST', `AI/${provider}`, 200, duration);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.apiResponse('useChat', 'POST', `AI/${provider}`, 500, duration);
      throw error;
    }
  }, [isLocalLLMInitialized]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    let conversation = currentConversation;
    if (!conversation) {
      conversation = createConv(generateConversationTitle(text.trim()));
      addConversation(conversation);
      setCurrentConversation(conversation);
    }
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const messageHistory = [...(conversation?.messages || []), userMessage];

    addMessage(userMessage);
    setLoading(true);
    setError(null);
    setLastFailedMessage(null);

    try {
      logger.info('useChat', 'Sending message', { provider: selectedProvider });
      
      const response = await getAIResponse(messageHistory, selectedProvider);
      
      const aiMessage: Message = {
        id: `${userMessage.id}_response`,
        text: response.content,
        isUser: false,
        timestamp: new Date(),
        metadata: {
          tokens: response.usage?.totalTokens,
          processingTime: Date.now() - userMessage.timestamp.getTime(),
          provider: selectedProvider,
        },
      };

      addMessage(aiMessage);
      setRetryCount(0);
      
      logger.info('useChat', 'Message sent successfully', {
        tokens: response.usage?.totalTokens,
        provider: selectedProvider,
      });

    } catch (error) {
      logger.error('useChat', 'Failed to send message', error);
      
      setLastFailedMessage(text);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to get AI response: ${errorMessage}`);
      
      const errorMsgObj: Message = {
        id: `${userMessage.id}_error`,
        text: "I apologize, but I'm having trouble processing your message right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
        metadata: { provider: selectedProvider },
      };

      addMessage(errorMsgObj);
      
      Alert.alert(
        'Message Failed',
        `Unable to send message using ${selectedProvider}. Would you like to try again?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => retryLastMessage() },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [isLoading, currentConversation, selectedProvider, getAIResponse, addMessage, addConversation, createConv, generateConversationTitle, setCurrentConversation, setError, setLoading]);

  const retryLastMessage = useCallback(async () => {
    if (!lastFailedMessage || retryCount >= maxRetries) {
      if (retryCount >= maxRetries) {
        Alert.alert('Max Retries Reached', 'Please try again later or switch to a different AI provider.');
      }
      return;
    }

    logger.info('useChat', 'Retrying last message', { attempt: retryCount + 1, maxRetries });
    
    setRetryCount(prev => prev + 1);
    
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
    }
    
    await sendMessage(lastFailedMessage);
  }, [lastFailedMessage, retryCount, maxRetries, retryDelay, sendMessage]);

  const createNewConversation = useCallback((title?: string) => {
    const newConversation = createConv(title);
    addConversation(newConversation);
    setCurrentConversation(newConversation);
    logger.info('useChat', 'Created new conversation', { title });
  }, [createConv, addConversation, setCurrentConversation]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    logger.info('useChat', 'Selected conversation', { id: conversation.id });
  }, [setCurrentConversation]);

  const deleteConversation = useCallback((id: string) => {
    deleteConv(id);
    logger.info('useChat', 'Deleted conversation', { id });
  }, [deleteConv]);

  const setProvider = useCallback((provider: AIProvider) => {
    setSelectedProvider(provider);
    logger.info('useChat', 'Changed AI provider', { provider });
  }, [setSelectedProvider]);

  const exportConversation = useCallback((conversation: Conversation) => {
    const exportData = {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      provider: conversation.provider,
      messages: conversation.messages.map(msg => ({
        text: msg.text,
        isUser: msg.isUser,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      })),
    };
    
    return JSON.stringify(exportData, null, 2);
  }, []);

  const getConversationPreview = useCallback((conversation: Conversation) => {
    if (conversation.messages.length === 0) {
      return 'No messages';
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const preview = lastMessage.text.substring(0, 50);
    return preview.length < lastMessage.text.length ? `${preview}...` : preview;
  }, []);

  return {
    // State
    messages: getCurrentMessages(),
    isLoading,
    error,
    currentConversation,
    conversations,
    selectedProvider,
    isLocalLLMInitialized,
    
    // Actions
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    clearError,
    setProvider,
    retryLastMessage,
    
    // Utilities
    exportConversation,
    getConversationPreview,
  };
}

export default useChat;