import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useChat from '../hooks/useChat';
import type { Message, AIProvider } from '../state/chatStore';
import { cn } from '../utils/cn';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = React.memo<MessageBubbleProps>(({ message }) => (
  <View className={cn('mb-4 px-4', message.isUser ? 'items-end' : 'items-start')}>
    <View
      className={cn(
        'max-w-[80%] p-3 rounded-2xl',
        message.isUser
          ? 'bg-blue-500 rounded-br-sm'
          : 'bg-gray-100 rounded-bl-sm'
      )}
    >
      <Text className={cn(
        'text-base leading-relaxed',
        message.isUser ? 'text-white' : 'text-gray-900'
      )}>
        {message.text}
      </Text>
      {message.metadata?.provider && (
        <Text className={cn(
          'text-xs mt-1 opacity-70',
          message.isUser ? 'text-white' : 'text-gray-500'
        )}>
          via {message.metadata.provider}
          {message.metadata.tokens && ` • ${message.metadata.tokens} tokens`}
        </Text>
      )}
    </View>
    <Text className="text-xs text-gray-500 mt-1">
      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
  </View>
));

MessageBubble.displayName = 'MessageBubble';

interface ProviderSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  isLocalLLMReady: boolean;
}

const ProviderSelector = React.memo<ProviderSelectorProps>(({ 
  selectedProvider, 
  onProviderChange, 
  isLocalLLMReady 
}) => {
  const providers: Array<{ key: AIProvider; name: string; icon: string; available: boolean }> = [
    { key: 'local', name: 'Local LLM', icon: '🧠', available: isLocalLLMReady },
    { key: 'anthropic', name: 'Claude', icon: '🤖', available: true },
    { key: 'openai', name: 'GPT', icon: '⚡', available: true },
    { key: 'grok', name: 'Grok', icon: '🚀', available: true },
  ];

  return (
    <View className="px-4 py-2 border-b border-gray-200 bg-gray-50">
      <Text className="text-xs text-gray-600 mb-2">AI Provider</Text>
      <View className="flex-row space-x-2">
        {providers.map((provider) => (
          <Pressable
            key={provider.key}
            onPress={() => provider.available && onProviderChange(provider.key)}
            disabled={!provider.available}
            className={cn(
              'px-3 py-2 rounded-lg flex-row items-center space-x-1',
              selectedProvider === provider.key
                ? 'bg-blue-500'
                : provider.available
                ? 'bg-white border border-gray-300'
                : 'bg-gray-200',
              !provider.available && 'opacity-50'
            )}
          >
            <Text className="text-sm">{provider.icon}</Text>
            <Text className={cn(
              'text-xs font-medium',
              selectedProvider === provider.key
                ? 'text-white'
                : provider.available
                ? 'text-gray-700'
                : 'text-gray-400'
            )}>
              {provider.name}
            </Text>
            {!provider.available && (
              <Ionicons name="warning" size={12} color="#9CA3AF" />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
});

ProviderSelector.displayName = 'ProviderSelector';

export default function ChatScreen() {
  const {
    messages,
    isLoading,
    error,
    selectedProvider,
    isLocalLLMInitialized,
    sendMessage,
    setProvider,
    clearError,
    createNewConversation,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('ChatScreen mounted');
    
    // Add welcome message if no messages exist
    if (messages.length === 0) {
      // This will be handled by the store initialization
    }

    return () => {
      console.log('ChatScreen unmounted');
    };
  }, [messages.length]);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageText = inputText.trim();
    setInputText('');
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    setProvider(provider);
    setShowProviderSelector(false);
  };

  const handleNewConversation = () => {
    Alert.alert(
      'New Conversation',
      'Start a new conversation? Current conversation will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'New Chat', 
          onPress: () => createNewConversation(),
          style: 'default'
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  const renderHeader = () => (
    <View className="px-6 py-4 border-b border-gray-200 bg-white">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
            <Ionicons name="chatbubbles" size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Chat</Text>
            <Pressable onPress={() => setShowProviderSelector(!showProviderSelector)}>
              <View className="flex-row items-center">
                <Text className="text-sm text-gray-500">
                  {selectedProvider === 'local' ? '🧠 Local LLM' : 
                   selectedProvider === 'anthropic' ? '🤖 Claude' :
                   selectedProvider === 'openai' ? '⚡ GPT' : '🚀 Grok'}
                </Text>
                <Ionicons 
                  name={showProviderSelector ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6B7280" 
                  style={{ marginLeft: 4 }}
                />
              </View>
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={handleNewConversation}
          className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
        >
          <Ionicons name="add" size={20} color="#374151" />
        </Pressable>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="chatbubbles-outline" size={32} color="#3B82F6" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2">
        Start a conversation
      </Text>
      <Text className="text-gray-500 text-center mb-6">
        Ask me anything! I can help with questions, analysis, creative tasks, and more.
      </Text>
      <View className="space-y-3 w-full">
        {[
          "What's the weather like?",
          "Help me write an email",
          "Explain quantum computing",
          "Plan a weekend trip"
        ].map((suggestion, index) => (
          <Pressable
            key={index}
            onPress={() => setInputText(suggestion)}
            className="bg-gray-50 p-3 rounded-xl border border-gray-200 active:bg-gray-100"
          >
            <Text className="text-gray-700 text-center">{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        {renderHeader()}

        {/* Provider Selector */}
        {showProviderSelector && (
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={handleProviderChange}
            isLocalLLMReady={isLocalLLMInitialized}
          />
        )}

        {/* Error Banner */}
        {error && (
          <View className="bg-red-50 border-b border-red-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-red-800 text-sm flex-1">{error}</Text>
              <Pressable onPress={clearError} className="ml-2">
                <Ionicons name="close" size={20} color="#DC2626" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Messages */}
        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom: 20,
            }}
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View className="px-4 py-2">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                <ActivityIndicator size="small" color="#6B7280" />
              </View>
              <Text className="text-gray-500 text-sm">
                {selectedProvider === 'local' ? 'Local AI is thinking...' : 'AI is thinking...'}
              </Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View className="px-4 py-4 border-t border-gray-200 bg-white">
          <View className="flex-row items-end">
            <View className="flex-1 mr-3">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                multiline
                className="bg-gray-100 rounded-2xl px-4 py-3 text-base max-h-24"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                blurOnSubmit={false}
              />
            </View>
            <Pressable
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className={cn(
                'w-12 h-12 rounded-full items-center justify-center',
                inputText.trim() && !isLoading
                  ? 'bg-blue-500 active:bg-blue-600'
                  : 'bg-gray-300'
              )}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && !isLoading ? "white" : "#9CA3AF"}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}