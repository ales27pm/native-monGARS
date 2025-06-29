import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssistantMessage } from '../types/core';

interface MessageBubbleProps {
  message: AssistantMessage;
  isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming = false }) => {
  const isUser = message.isUser;
  
  return (
    <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <View className="flex-row items-end max-w-[80%]">
        {!isUser && (
          <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center mr-2 mb-1">
            <Ionicons name="shield-checkmark" size={12} color="white" />
          </View>
        )}
        
        <View
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-blue-500 rounded-br-sm'
              : 'bg-gray-100 rounded-bl-sm'
          }`}
        >
          <Text
            className={`text-base leading-5 ${
              isUser ? 'text-white' : 'text-gray-900'
            }`}
          >
            {message.content}
            {isStreaming && !message.content && (
              <Text className="text-gray-500">Réflexion...</Text>
            )}
          </Text>
          
          {isStreaming && message.content && (
            <View className="mt-1">
              <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            </View>
          )}
        </View>
        
        {isUser && (
          <View className="w-6 h-6 bg-gray-400 rounded-full items-center justify-center ml-2 mb-1">
            <Ionicons name="person" size={12} color="white" />
          </View>
        )}
      </View>
      
      <Text className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'} px-2`}>
        {message.timestamp.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );
};