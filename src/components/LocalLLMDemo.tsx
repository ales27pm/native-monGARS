/**
 * LocalLLMDemo.tsx
 * Demo component showcasing Llama 3.2 3B Core ML integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../utils/cn';
import { localLLMService } from '../services/LocalLLMService';
import type { ChatMessage, GenerationResult } from '../services/LocalLLMService';

export default function LocalLLMDemo() {
  const insets = useSafeAreaInsets();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sample documents for RAG demo
  const sampleDocuments = [
    {
      id: 'doc1',
      text: 'MonGARS is an advanced AI assistant with local LLM capabilities. It can process natural language requests and execute actions using on-device intelligence.',
      metadata: { source: 'about' }
    },
    {
      id: 'doc2', 
      text: 'The app supports calendar management, contact operations, and file handling through native iOS integrations. All processing happens locally for privacy.',
      metadata: { source: 'features' }
    },
    {
      id: 'doc3',
      text: 'Local AI models like Llama 3.2 3B provide fast inference without internet connectivity. The app uses Core ML for optimized performance on iOS devices.',
      metadata: { source: 'technical' }
    }
  ];

  useEffect(() => {
    initializeLLM();
  }, []);

  const initializeLLM = async () => {
    try {
      setIsLoading(true);
      
      // Initialize the LLM service with RAG and tools enabled
      const success = await localLLMService.initialize({
        modelName: 'Llama-3.2-3B-Instruct',
        embeddingModel: 'all-MiniLM-L6-v2',
        useRAG: true,
        useTools: true,
        systemPrompt: 'You are MonGARS, a helpful AI assistant running locally on iOS. You have access to calendar, contacts, and file tools. Be concise and helpful.',
      });

      if (success) {
        // Add sample documents to the vector store
        await localLLMService.addDocuments(sampleDocuments);
        
        setIsInitialized(true);
        setMessages([{
          role: 'assistant',
          content: '🧠 Local LLM initialized! I can help you with questions, calendar events, contacts, and files. Everything runs locally on your device for privacy.',
        }]);
      } else {
        Alert.alert('Error', 'Failed to initialize Local LLM. Please check if models are available.');
      }
    } catch (error) {
      console.error('LLM initialization error:', error);
      Alert.alert('Error', 'Failed to initialize Local LLM service');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !isInitialized || isGenerating) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);

    try {
      const result: GenerationResult = await localLLMService.chat([...messages, userMessage], {
        maxTokens: 512,
        temperature: 0.7,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.text,
        toolCalls: result.toolCalls,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show tool calls if any
      if (result.toolCalls && result.toolCalls.length > 0) {
        const toolMessage: ChatMessage = {
          role: 'system',
          content: `🔧 Executed ${result.toolCalls.length} tool(s): ${result.toolCalls.map(t => t.function.name).join(', ')}`,
        };
        setMessages(prev => [...prev, toolMessage]);
      }

    } catch (error) {
      console.error('Generation error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error while processing your request.',
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '🧠 Chat cleared! How can I help you?',
    }]);
  };

  const getSampleQuestions = () => [
    "What is MonGARS?",
    "Tell me about local AI models",
    "Create a calendar event for tomorrow",
    "Search my contacts for John",
    "List files in Documents folder",
  ];

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600 text-center">
          Initializing Local LLM...{'\n'}Loading Llama 3.2 3B Core ML model
        </Text>
      </View>
    );
  }

  return (
    <View 
      className="flex-1 bg-gray-50"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-gray-900">Local LLM Chat</Text>
            <Text className="text-sm text-gray-500">
              {isInitialized ? '🟢 Llama 3.2 3B Ready' : '🔴 Not Initialized'}
            </Text>
          </View>
          <Pressable
            onPress={clearChat}
            className="bg-gray-100 rounded-full p-2"
            disabled={!isInitialized}
          >
            <Ionicons name="refresh" size={20} color="#666" />
          </Pressable>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView 
        className="flex-1 px-4 py-2"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            className={cn(
              "mb-3 max-w-[85%]",
              message.role === 'user' ? 'self-end' : 'self-start'
            )}
          >
            <View
              className={cn(
                "rounded-2xl px-3 py-2",
                message.role === 'user'
                  ? 'bg-blue-500'
                  : message.role === 'system'
                  ? 'bg-gray-200'
                  : 'bg-white border border-gray-200'
              )}
            >
              <Text
                className={cn(
                  "text-base",
                  message.role === 'user'
                    ? 'text-white'
                    : 'text-gray-900'
                )}
              >
                {message.content}
              </Text>
              
              {/* Show tool calls */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <View className="mt-2 pt-2 border-t border-gray-300">
                  <Text className="text-xs text-gray-600 font-medium">Tool Calls:</Text>
                  {message.toolCalls.map((tool, idx) => (
                    <Text key={idx} className="text-xs text-gray-500 mt-1">
                      • {tool.function.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
        
        {isGenerating && (
          <View className="self-start mb-3">
            <View className="bg-white border border-gray-200 rounded-2xl px-3 py-2 flex-row items-center">
              <ActivityIndicator size="small" color="#666" />
              <Text className="ml-2 text-gray-600">Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sample Questions */}
      {messages.length <= 1 && (
        <View className="px-4 py-2">
          <Text className="text-sm font-medium text-gray-600 mb-2">Try asking:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {getSampleQuestions().map((question, index) => (
                <Pressable
                  key={index}
                  onPress={() => setInputText(question)}
                  className="bg-blue-50 border border-blue-200 rounded-full px-3 py-2"
                  disabled={!isInitialized}
                >
                  <Text className="text-blue-600 text-sm">{question}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View 
        className="bg-white border-t border-gray-200 p-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row items-end space-x-2">
          <View className="flex-1 min-h-[40px] max-h-[120px] border border-gray-300 rounded-2xl px-3 py-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={isInitialized ? "Ask anything..." : "Initializing..."}
              multiline
              textAlignVertical="top"
              className="text-base text-gray-900"
              editable={isInitialized && !isGenerating}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            onPress={sendMessage}
            className={cn(
              "w-10 h-10 rounded-full items-center justify-center",
              inputText.trim() && isInitialized && !isGenerating
                ? "bg-blue-500"
                : "bg-gray-300"
            )}
            disabled={!inputText.trim() || !isInitialized || isGenerating}
          >
            <Ionicons 
              name="send" 
              size={16} 
              color={inputText.trim() && isInitialized && !isGenerating ? "white" : "#666"} 
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}