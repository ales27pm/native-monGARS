import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../state/appState';
import { AssistantService } from '../services/AssistantService';
import { BiometricService } from '../services/BiometricService';
import { AssistantMessage } from '../types/core';
import { MessageBubble } from '../components/MessageBubble';

export const ChatScreen: React.FC<{ onShowSettings: () => void }> = ({ onShowSettings }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const {
    messages,
    isGenerating,
    isAuthenticated,
    ttsEnabled,
    addMessage,
    updateLastMessage,
    setGenerating,
    setAuthenticated
  } = useAppStore();

  const assistantService = AssistantService.getInstance();
  const biometricService = BiometricService.getInstance();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    // Check authentication on mount
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    if (!isAuthenticated) {
      const result = await biometricService.authenticate("Déverrouiller monGARS pour accéder à vos conversations");
      setAuthenticated(result.success);
      
      if (!result.success) {
        Alert.alert(
          "Authentification requise",
          "Vous devez vous authentifier pour utiliser monGARS",
          [{ text: "Réessayer", onPress: checkAuthentication }]
        );
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isGenerating) return;
    
    if (!isAuthenticated) {
      await checkAuthentication();
      return;
    }

    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInputText('');
    setGenerating(true);

    // Add placeholder assistant message
    const assistantMessage: AssistantMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      isUser: false,
      timestamp: new Date()
    };
    addMessage(assistantMessage);

    try {
      await assistantService.generateResponse(
        [...messages, userMessage],
        (partial) => {
          updateLastMessage(partial);
        },
        (fullResponse) => {
          setGenerating(false);
          if (ttsEnabled) {
            assistantService.speakText(fullResponse);
          }
        }
      );
    } catch (error) {
      console.error('Error generating response:', error);
      updateLastMessage("Désolé, une erreur s'est produite. Veuillez réessayer.");
      setGenerating(false);
    }
  };

  const handleVoiceInput = () => {
    // Placeholder for voice input - would integrate with speech recognition
    setIsRecording(!isRecording);
    Alert.alert("Fonctionnalité vocale", "La reconnaissance vocale sera disponible dans une prochaine version.");
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="lock-closed" size={64} color="#6B7280" />
          <Text className="text-xl font-bold text-gray-900 mt-4 mb-2 text-center">
            Authentification requise
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Authentifiez-vous pour accéder à vos conversations privées
          </Text>
          <Pressable
            onPress={checkAuthentication}
            className="bg-blue-500 py-3 px-8 rounded-xl"
          >
            <Text className="text-white font-bold">S'authentifier</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
              <Ionicons name="shield-checkmark" size={20} color="white" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">monGARS</Text>
              <Text className="text-xs text-gray-500">Assistant privé</Text>
            </View>
          </View>
          
          <Pressable onPress={onShowSettings} className="p-2">
            <Ionicons name="settings" size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {messages.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20 px-8">
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
                <Ionicons name="shield-checkmark" size={40} color="#3B82F6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
                Bonjour !
              </Text>
              <Text className="text-lg text-gray-600 text-center mb-4">
                Je suis monGARS, votre assistant personnel privé
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-sm text-gray-500 ml-2">100% privé et sécurisé</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-sm text-gray-500 ml-2">Fonctionne entièrement sur votre appareil</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-sm text-gray-500 ml-2">Protégé par authentification biométrique</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-center mt-6">
                Tapez votre première question pour commencer
              </Text>
            </View>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={isGenerating && index === messages.length - 1 && !message.isUser}
              />
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View className="px-4 py-3 border-t border-gray-200">
          <View className="flex-row items-end space-x-3">
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Tapez votre message..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={1000}
                className="text-base text-gray-900 max-h-24"
                editable={!isGenerating}
                onSubmitEditing={handleSendMessage}
              />
            </View>
            
            <Pressable
              onPress={handleVoiceInput}
              className={`p-3 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-300'}`}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={20} 
                color={isRecording ? "white" : "#6B7280"} 
              />
            </Pressable>
            
            <Pressable
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isGenerating}
              className={`p-3 rounded-full ${
                inputText.trim() && !isGenerating ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() && !isGenerating ? "white" : "#6B7280"} 
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};