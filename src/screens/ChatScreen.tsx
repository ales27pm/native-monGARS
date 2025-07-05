import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useChat from '../hooks/useChat';
import type { Message, AIProvider } from '../state/chatStore';
import { cn } from '../utils/cn';

export default function ChatScreen() {
  const {
    messages,
    isLoading: isProcessing,
    sendMessage,
    selectedProvider,
    setProvider,
    isLocalLLMInitialized,
    createNewConversation,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const clearMessages = () => {
    Alert.alert(
      "New Chat",
      "Would you like to start a new conversation?",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start New', onPress: () => createNewConversation() }
      ]
    );
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
        {new Date(message.timestamp).toLocaleTimeString([], {
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
          onPress={() => setProvider(provider)}
          disabled={provider === 'local' && !isLocalLLMInitialized}
          className={cn(
            'flex-1 px-3 py-2 rounded-xl mx-1',
            selectedProvider === provider ? 'bg-white shadow-sm' : '',
            provider === 'local' && !isLocalLLMInitialized ? 'opacity-50' : ''
          )}
        >
          <Text
            className={`text-center text-sm font-medium capitalize ${
              selectedProvider === provider ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            {provider === 'local' ? (
              <>
                🧠 Local
                {!isLocalLLMInitialized && <Text className="text-xs text-red-500"> (Off)</Text>}
              </>
            ) : (
              provider
            )}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const initialMessage = {
    id: '1',
    text: "Hello! I'm monGARS, your privacy-first AI assistant. I can help you with questions, analysis, and tasks. What would you like to discuss?",
    isUser: false,
    timestamp: new Date(),
  };

  const displayMessages = messages.length > 0 ? messages : [initialMessage];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
              <Ionicons name="add" size={24} color="#6B7280" />
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
          {displayMessages.map(message => (
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
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
              />
            </View>
            <Pressable
              onPress={handleSendMessage}
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