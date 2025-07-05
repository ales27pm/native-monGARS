import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAnthropicChatResponse, getOpenAIChatResponse, getGrokChatResponse } from '../api/chat-service';
import { localLLMService } from '../services/LocalLLMService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

type AIProvider = 'local' | 'anthropic' | 'openai' | 'grok';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm monGARS, your privacy-first AI assistant. I can help you with questions, analysis, and tasks. What would you like to discuss?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('local');
  const [isLocalLLMInitialized, setIsLocalLLMInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize Local LLM
  useEffect(() => {
    const initializeLocalLLM = async () => {
      try {
        const success = await localLLMService.initialize({
          modelName: 'Llama-3.2-3B-Instruct',
          useRAG: true,
          useTools: true,
          systemPrompt: 'You are monGARS, a helpful AI assistant running locally on iOS. Be concise and helpful.',
        });
        
        if (success) {
          setIsLocalLLMInitialized(true);
          // Add sample documents for RAG
          await localLLMService.addDocuments([
            {
              id: 'doc1',
              text: 'monGARS is an advanced AI assistant with local LLM capabilities. It can process natural language requests and execute actions using on-device intelligence.',
              metadata: { source: 'about' }
            },
            {
              id: 'doc2',
              text: 'The app supports calendar management, contact operations, and file handling through native iOS integrations. All processing happens locally for privacy.',
              metadata: { source: 'features' }
            }
          ]);
        }
      } catch (error) {
        console.error('Local LLM initialization failed:', error);
      }
    };

    initializeLocalLLM();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      let response;
      
      switch (selectedProvider) {
        case 'local':
          if (!isLocalLLMInitialized) {
            throw new Error('Local LLM is not initialized');
          }
          const chatHistory = messages.filter(m => m.id !== '1').map(m => ({
            role: (m.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.text,
          }));
          const localResponse = await localLLMService.chat([
            ...chatHistory,
            { role: 'user' as const, content: userMessage.text }
          ]);
          response = { content: localResponse.text };
          break;
        case 'anthropic':
          response = await getAnthropicChatResponse(userMessage.text);
          break;
        case 'openai':
          response = await getOpenAIChatResponse(userMessage.text);
          break;
        case 'grok':
          response = await getGrokChatResponse(userMessage.text);
          break;
        default:
          response = await getAnthropicChatResponse(userMessage.text);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.content,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: '1',
        text: "Hello! I'm monGARS, your privacy-first AI assistant. I can help you with questions, analysis, and tasks. What would you like to discuss?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <View className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          message.isUser
            ? 'bg-blue-500 rounded-br-sm'
            : 'bg-gray-100 rounded-bl-sm'
        }`}
      >
        <Text
          className={`text-base leading-relaxed ${
            message.isUser ? 'text-white' : 'text-gray-900'
          }`}
        >
          {message.text}
        </Text>
      </View>
      <Text className="text-xs text-gray-500 mt-1 px-2">
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  const ProviderSelector = () => (
    <View className="flex-row bg-gray-100 rounded-2xl p-2 mb-4">
      {(['local', 'anthropic', 'openai', 'grok'] as AIProvider[]).map((provider) => (
        <Pressable
          key={provider}
          onPress={() => setSelectedProvider(provider)}
          className={`flex-1 px-3 py-2 rounded-xl mx-1 ${
            selectedProvider === provider ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Text
            className={`text-center text-sm font-medium capitalize ${
              selectedProvider === provider ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            {provider === 'local' ? (
              <>
                🧠 Local
                {!isLocalLLMInitialized && <Text className="text-xs text-red-500"> (Init...)</Text>}
              </>
            ) : (
              provider
            )}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
                <Ionicons name="chatbubbles" size={20} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-900">monGARS Chat</Text>
                <Text className="text-sm text-gray-500">
                  {isProcessing ? 'Thinking...' : selectedProvider === 'local' ? 'Local AI (On-Device)' : 'Privacy-First AI'}
                </Text>
              </View>
            </View>
            <Pressable onPress={clearMessages} className="p-2">
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        {/* Provider Selector */}
        <View className="px-4 pt-4">
          <ProviderSelector />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isProcessing && (
            <View className="items-start mb-4">
              <View className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <ActivityIndicator size="small" color="#6B7280" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor="#9CA3AF"
                multiline
                style={{ maxHeight: 100 }}
                className="text-base text-gray-900"
                editable={!isProcessing}
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
              />
            </View>
            <Pressable
              onPress={sendMessage}
              disabled={!inputText.trim() || isProcessing}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim() && !isProcessing
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && !isProcessing ? 'white' : '#9CA3AF'}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}