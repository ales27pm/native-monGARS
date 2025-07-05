import { useCallback, useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import useChatStore, { Message, Conversation, AIProvider } from '../state/chatStore';
import { getAnthropicTextResponse, getOpenAITextResponse, getGrokTextResponse } from '../api/chat-service';
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
  
  // Streaming state
  const currentStreamSession = useRef<string | null>(null);
  const tokenSubscription = useRef<(() => void) | null>(null);
  const completeSubscription = useRef<(() => void) | null>(null);

  const {
    currentConversation,
    conversations,
    isLoading,
    error,
    selectedProvider,
    setCurrentConversation,
    addMessage,
    updateLastMessage,
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
      console.log('Initialized with default conversation');
    }
  }, [currentConversation, conversations.length, createConv, addConversation, setCurrentConversation]);

  // Initialize Local LLM
  useEffect(() => {
    const initLocalLLM = async () => {
      try {
        const success = await localLLMService.initialize();
        setIsLocalLLMInitialized(success);
        if (success) {
          console.log('✅ Local LLM initialized in useChat');
        } else {
          console.warn('⚠️ Local LLM initialization failed');
        }
      } catch (e) {
        console.error('❌ Local LLM init error', e);
        setIsLocalLLMInitialized(false);
      }
    };
    
    initLocalLLM();

    // Cleanup subscriptions on unmount
    return () => {
      if (tokenSubscription.current) {
        tokenSubscription.current();
      }
      if (completeSubscription.current) {
        completeSubscription.current();
      }
    };
  }, []);

  const getAIResponse = useCallback(async (history: Message[], provider: AIProvider) => {
    const apiMessages = history.map(msg => ({
      role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.text,
    }));

    switch (provider) {
      case 'anthropic':
        return getAnthropicTextResponse(apiMessages);
      case 'openai':
        return getOpenAITextResponse(apiMessages as AIMessage[]);
      case 'grok':
        return getGrokTextResponse(apiMessages as AIMessage[]);
      default:
        throw new Error(`Unsupported cloud provider: ${provider}`);
    }
  }, []);

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
    addMessage(userMessage);

    setLoading(true);
    setError(null);
    setLastFailedMessage(null);

    try {
      if (selectedProvider === 'local') {
        if (!isLocalLLMInitialized) {
          throw new Error("Local LLM not ready. Please try again or switch to a cloud provider.");
        }

        // Create assistant message for streaming
        const assistantMessage: Message = {
          id: `${userMessage.id}_response`,
          text: "",
          isUser: false,
          timestamp: new Date(),
          metadata: { provider: 'local' },
        };
        addMessage(assistantMessage);

        // Build conversation prompt
        const conversationHistory = [...(conversation.messages || []), userMessage];
        const prompt = conversationHistory
          .map(m => `${m.isUser ? 'Human' : 'Assistant'}: ${m.text}`)
          .join('\n') + '\nAssistant:';
        
        // Set up streaming listeners
        let streamedText = '';
        
        // Clean up previous subscriptions
        if (tokenSubscription.current) {
          tokenSubscription.current();
        }
        if (completeSubscription.current) {
          completeSubscription.current();
        }

        // Token listener
        tokenSubscription.current = localLLMService.onToken((event) => {
          if (event.sessionId === currentStreamSession.current) {
            streamedText += event.token;
            updateLastMessage({ text: streamedText });
          }
        });

        // Completion listener
        completeSubscription.current = localLLMService.onComplete((event) => {
          if (event.sessionId === currentStreamSession.current) {
            console.log('🏁 Stream completed:', event.reason);
            updateLastMessage({ 
              text: streamedText,
              metadata: { 
                provider: 'local',
                tokens: event.totalTokens 
              }
            });
            currentStreamSession.current = null;
            setLoading(false);
          }
        });

        // Start streaming
        const sessionId = await localLLMService.chatStream(prompt);
        currentStreamSession.current = sessionId;
        
      } else {
        // Cloud provider
        const conversationHistory = [...(conversation.messages || []), userMessage];
        const response = await getAIResponse(conversationHistory, selectedProvider);
        
        const aiMessage: Message = {
          id: `${userMessage.id}_response`,
          text: response.content,
          isUser: false,
          timestamp: new Date(),
          metadata: { 
            provider: selectedProvider, 
            tokens: response.usage?.totalTokens 
          },
        };
        addMessage(aiMessage);
        setLoading(false);
      }
      
      setRetryCount(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to get AI response: ${errorMessage}`);
      setLastFailedMessage(text);
      setLoading(false);
      
      Alert.alert(
        'Message Failed', 
        `Unable to send message. Would you like to retry?`, 
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => retryLastMessage() },
        ]
      );
    }
  }, [
    isLoading, 
    currentConversation, 
    selectedProvider, 
    getAIResponse, 
    isLocalLLMInitialized,
    addMessage, 
    createConv, 
    generateConversationTitle, 
    setCurrentConversation, 
    setError, 
    setLoading, 
    updateLastMessage
  ]);

  const retryLastMessage = useCallback(async () => {
    if (!lastFailedMessage || retryCount >= maxRetries) {
      if (retryCount >= maxRetries) {
        Alert.alert('Max Retries Reached', 'Please try again later or switch to a different AI provider.');
      }
      return;
    }

    console.log('Retrying last message, attempt:', retryCount + 1);
    
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
    console.log('Created new conversation:', title);
  }, [createConv, addConversation, setCurrentConversation]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    console.log('Selected conversation:', conversation.id);
  }, [setCurrentConversation]);

  const deleteConversation = useCallback((id: string) => {
    deleteConv(id);
    console.log('Deleted conversation:', id);
  }, [deleteConv]);

  const setProvider = useCallback((provider: AIProvider) => {
    setSelectedProvider(provider);
    console.log('Changed AI provider:', provider);
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