import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import useChatStore, { Message, Conversation } from '../state/chatStore';
import { getAnthropicChatResponse, getOpenAIChatResponse, getGrokChatResponse } from '../api/chat-service';
import { logger } from '../utils/logger';

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
  selectedProvider: 'anthropic' | 'openai' | 'grok';
  
  // Actions
  sendMessage: (text: string) => Promise<void>;
  createNewConversation: (title?: string) => void;
  selectConversation: (conversation: Conversation) => void;
  deleteConversation: (id: string) => void;
  clearError: () => void;
  setProvider: (provider: 'anthropic' | 'openai' | 'grok') => void;
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
      const newConversation = createConv();
      addConversation(newConversation);
      setCurrentConversation(newConversation);
      logger.info('useChat', 'Initialized with default conversation');
    }
  }, [currentConversation, conversations.length]);

  const getAIResponse = useCallback(async (text: string, provider: 'anthropic' | 'openai' | 'grok') => {
    const startTime = Date.now();
    logger.apiRequest('useChat', 'POST', `AI/${provider}`, { text });

    try {
      let response;
      
      switch (provider) {
        case 'anthropic':
          response = await getAnthropicChatResponse(text);
          break;
        case 'openai':
          response = await getOpenAIChatResponse(text);
          break;
        case 'grok':
          response = await getGrokChatResponse(text);
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
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    // Ensure we have a current conversation
    let conversation = currentConversation;
    if (!conversation) {
      conversation = createConv(generateConversationTitle(text));
      addConversation(conversation);
      setCurrentConversation(conversation);
    }

    // Add user message
    const userMessage: Message = {
      id: messageId,
      text: text.trim(),
      isUser: true,
      timestamp,
    };

    addMessage(userMessage);
    setLoading(true);
    setError(null);
    setLastFailedMessage(null);

    try {
      logger.info('useChat', 'Sending message', { text, provider: selectedProvider });
      
      const response = await getAIResponse(text, selectedProvider);
      
      // Add AI response
      const aiMessage: Message = {
        id: `${messageId}_response`,
        text: response.content,
        isUser: false,
        timestamp: new Date(),
        metadata: {
          tokens: response.usage?.totalTokens,
          processingTime: Date.now() - timestamp.getTime(),
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
      
      // Add error message to conversation
      const errorMessageObj: Message = {
        id: `${messageId}_error`,
        text: "I apologize, but I'm having trouble processing your message right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
        metadata: {
          provider: selectedProvider,
        },
      };

      addMessage(errorMessageObj);
      
      // Show alert for user feedback
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
  }, [isLoading, currentConversation, selectedProvider, getAIResponse]);

  const retryLastMessage = useCallback(async () => {
    if (!lastFailedMessage || retryCount >= maxRetries) {
      if (retryCount >= maxRetries) {
        Alert.alert('Max Retries Reached', 'Please try again later or switch to a different AI provider.');
      }
      return;
    }

    logger.info('useChat', 'Retrying last message', { attempt: retryCount + 1, maxRetries });
    
    setRetryCount(prev => prev + 1);
    
    // Add delay between retries
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

  const setProvider = useCallback((provider: 'anthropic' | 'openai' | 'grok') => {
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