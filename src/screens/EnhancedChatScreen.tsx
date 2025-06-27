import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInRight, SlideInDown } from 'react-native-reanimated';
import { useAssistantStore } from '../state/assistantStore';
import { aiOrchestrator } from '../api/ai-orchestrator';
import { enhancedReasoningEngine } from '../api/enhanced-reasoning';
import { agentSystem } from '../api/agent-system';
import { memorySystem } from '../api/memory-system';
import { contextEngine } from '../api/context-engine';
import { cn } from '../utils/cn';

interface EnhancedMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  enhancedFeatures?: {
    memoryUsed: boolean;
    agentsConsulted: string[];
    chainOfThoughtId?: string;
    learningApplied: boolean;
    personalizedResponse: boolean;
    processingPath: string[];
  };
  performance?: {
    processingTime: number;
    memoryQueries: number;
    agentTasks: number;
    reasoningSteps: number;
    totalTokens: number;
  };
  followUp?: {
    suggestedQuestions: string[];
    relatedTopics: string[];
    deeperAnalysis?: string;
    agentRecommendations?: string[];
  };
}

export default function EnhancedChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { currentContext } = useAssistantStore();

  const [messages, setMessages] = useState<EnhancedMessage[]>([
    {
      id: '1',
      type: 'system',
      content: '🧠 Enhanced ARIA is now active with advanced AI capabilities:\n\n• Persistent memory system\n• Specialized AI agents\n• Chain-of-thought reasoning\n• Learning and adaptation\n• Multi-model intelligence\n\nHow can I assist you with my enhanced capabilities?',
      timestamp: new Date(),
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Advanced options
  const [useChainOfThought, setUseChainOfThought] = useState(false);
  const [useAgents, setUseAgents] = useState(true);
  const [useMemory, setUseMemory] = useState(true);
  const [useLearning, setUseLearning] = useState(true);
  const [complexity, setComplexity] = useState<'simple' | 'standard' | 'complex' | 'expert'>('standard');
  const [responseStyle, setResponseStyle] = useState<'concise' | 'detailed' | 'comprehensive'>('detailed');

  const [systemStatus, setSystemStatus] = useState(aiOrchestrator.getSystemStatus());
  const [showChainOfThought, setShowChainOfThought] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(aiOrchestrator.getSystemStatus());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (text: string, requestType?: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: EnhancedMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      console.log('Enhanced Chat: Processing with options:', {
        useChainOfThought,
        useAgents,
        useMemory,
        useLearning,
        complexity,
        responseStyle
      });

      const response = await aiOrchestrator.processRequest({
        query: text,
        context: currentContext,
        options: {
          useMemory,
          useAgents,
          useChainOfThought,
          useLearning,
          complexity,
          responseStyle,
          requestType: requestType as any,
        },
      });

      const assistantMessage: EnhancedMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        enhancedFeatures: response.enhancedFeatures,
        performance: response.performance,
        followUp: response.followUp,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Enhanced chat processing error:', error);
      
      const errorMessage: EnhancedMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request with the enhanced AI features. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendQuickRequest = (type: 'analysis' | 'creative' | 'problem_solving') => {
    if (!inputText.trim()) return;
    
    let requestText = inputText;
    switch (type) {
      case 'analysis':
        requestText = `Please provide a deep analysis of: ${inputText}`;
        break;
      case 'creative':
        requestText = `Please help me create something creative based on: ${inputText}`;
        break;
      case 'problem_solving':
        requestText = `Please help me solve this problem: ${inputText}`;
        break;
    }
    
    sendMessage(requestText, type);
  };

  const viewChainOfThought = async (chainId: string) => {
    try {
      const chain = enhancedReasoningEngine.getReasoningChain(chainId);
      if (chain) {
        setShowChainOfThought(chainId);
      }
    } catch (error) {
      console.error('Chain of thought retrieval error:', error);
    }
  };

  const MessageBubble = ({ message }: { message: EnhancedMessage }) => (
    <Animated.View 
      entering={message.type === 'user' ? FadeInRight : FadeInUp}
      className={cn(
        'mb-4 mx-4',
        message.type === 'user' ? 'items-end' : 'items-start'
      )}
    >
      <View className={cn(
        'max-w-[85%] rounded-2xl px-4 py-3',
        message.type === 'user' 
          ? 'bg-blue-500' 
          : message.type === 'system'
          ? 'bg-purple-100 border border-purple-200'
          : 'bg-white border border-gray-200'
      )}>
        <Text className={cn(
          'text-base leading-6',
          message.type === 'user' 
            ? 'text-white' 
            : 'text-gray-800'
        )}>
          {message.content}
        </Text>

        {/* Enhanced Features Display */}
        {message.enhancedFeatures && (
          <View className="mt-3 pt-3 border-t border-gray-200">
            <Text className="text-xs font-medium text-gray-600 mb-2">Enhanced Features Used:</Text>
            
            <View className="flex-row flex-wrap">
              {message.enhancedFeatures.memoryUsed && (
                <View className="bg-blue-100 rounded-full px-2 py-1 mr-1 mb-1">
                  <Text className="text-blue-600 text-xs">Memory</Text>
                </View>
              )}
              {message.enhancedFeatures.agentsConsulted.length > 0 && (
                <View className="bg-green-100 rounded-full px-2 py-1 mr-1 mb-1">
                  <Text className="text-green-600 text-xs">Agents</Text>
                </View>
              )}
              {message.enhancedFeatures.chainOfThoughtId && (
                <Pressable
                  onPress={() => viewChainOfThought(message.enhancedFeatures!.chainOfThoughtId!)}
                  className="bg-purple-100 rounded-full px-2 py-1 mr-1 mb-1"
                >
                  <Text className="text-purple-600 text-xs">Chain of Thought</Text>
                </Pressable>
              )}
              {message.enhancedFeatures.learningApplied && (
                <View className="bg-yellow-100 rounded-full px-2 py-1 mr-1 mb-1">
                  <Text className="text-yellow-600 text-xs">Learning</Text>
                </View>
              )}
              {message.enhancedFeatures.personalizedResponse && (
                <View className="bg-pink-100 rounded-full px-2 py-1 mr-1 mb-1">
                  <Text className="text-pink-600 text-xs">Personalized</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Performance Metrics */}
        {message.performance && (
          <View className="mt-2">
            <Text className="text-xs text-gray-500">
              ⚡ {message.performance.processingTime}ms • 
              📊 {message.performance.reasoningSteps} steps • 
              🤖 {message.performance.agentTasks} agents • 
              💾 {message.performance.memoryQueries} memories
            </Text>
          </View>
        )}

        {/* Follow-up Suggestions */}
        {message.followUp && message.followUp.suggestedQuestions.length > 0 && (
          <View className="mt-3 pt-3 border-t border-gray-200">
            <Text className="text-xs font-medium text-gray-600 mb-2">Suggested follow-ups:</Text>
            {message.followUp.suggestedQuestions.slice(0, 2).map((question, index) => (
              <Pressable
                key={index}
                onPress={() => sendMessage(question)}
                className="bg-gray-50 rounded-lg p-2 mb-1"
              >
                <Text className="text-sm text-gray-700">{question}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Related Topics */}
        {message.followUp && message.followUp.relatedTopics.length > 0 && (
          <View className="mt-2">
            <Text className="text-xs font-medium text-gray-600 mb-1">Related topics:</Text>
            <View className="flex-row flex-wrap">
              {message.followUp.relatedTopics.map((topic, index) => (
                <View key={index} className="bg-gray-100 rounded-full px-2 py-1 mr-1 mb-1">
                  <Text className="text-gray-600 text-xs">{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      
      <Text className="text-xs text-gray-500 mt-1 mx-2">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={() => navigation.goBack()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </Pressable>
            <View>
              <Text className="text-lg font-semibold text-gray-800">Enhanced ARIA</Text>
              <Text className="text-sm text-gray-600">
                {isProcessing ? 'Processing with AI...' : 'Advanced AI Assistant'}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <Pressable 
              onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="mr-3"
            >
              <Ionicons 
                name="settings" 
                size={20} 
                color={showAdvancedOptions ? '#3B82F6' : '#9CA3AF'} 
              />
            </Pressable>
            <View className={cn(
              'w-2 h-2 rounded-full',
              isProcessing ? 'bg-yellow-500' : 'bg-green-500'
            )} />
          </View>
        </View>

        {/* System Status */}
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs text-gray-500">
            💾 {systemStatus.memoryEntries} memories • 
            🤖 {systemStatus.activeAgents} agents • 
            📚 Learning {systemStatus.learningActive ? 'ON' : 'OFF'}
          </Text>
          <Text className="text-xs text-gray-500">
            Queue: {systemStatus.queuedRequests}
          </Text>
        </View>
      </View>

      {/* Advanced Options Panel */}
      {showAdvancedOptions && (
        <Animated.View entering={SlideInDown} className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-sm font-semibold text-gray-800 mb-3">AI Configuration</Text>
          
          <View className="space-y-3">
            {/* Feature Toggles */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Chain of Thought Reasoning</Text>
              <Switch
                value={useChainOfThought}
                onValueChange={setUseChainOfThought}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              />
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Use AI Agents</Text>
              <Switch
                value={useAgents}
                onValueChange={setUseAgents}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              />
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Memory Integration</Text>
              <Switch
                value={useMemory}
                onValueChange={setUseMemory}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              />
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Learning & Adaptation</Text>
              <Switch
                value={useLearning}
                onValueChange={setUseLearning}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              />
            </View>

            {/* Complexity Selection */}
            <View>
              <Text className="text-sm text-gray-600 mb-2">Complexity Level</Text>
              <View className="flex-row space-x-2">
                {(['simple', 'standard', 'complex', 'expert'] as const).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => setComplexity(level)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border',
                      complexity === level 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-200'
                    )}
                  >
                    <Text className={cn(
                      'text-center text-xs capitalize',
                      complexity === level ? 'text-white' : 'text-gray-600'
                    )}>
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="py-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {/* Processing indicator */}
          {isProcessing && (
            <Animated.View entering={FadeInUp} className="mx-4 mb-4">
              <View className="bg-white rounded-2xl px-4 py-3 border border-gray-200 max-w-[80%]">
                <View className="flex-row items-center">
                  <View className="flex-row space-x-1">
                    <View className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <View className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <View className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  </View>
                  <Text className="text-gray-600 text-sm ml-2">
                    Enhanced ARIA is processing...
                  </Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  Using: {useChainOfThought ? 'Chain-of-Thought, ' : ''}{useAgents ? 'AI Agents, ' : ''}{useMemory ? 'Memory, ' : ''}{useLearning ? 'Learning' : ''}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Input Area */}
      <View className="bg-white border-t border-gray-200 px-4 py-3">
        {/* Quick Action Buttons */}
        <View className="flex-row space-x-2 mb-3">
          <Pressable
            onPress={() => sendQuickRequest('analysis')}
            disabled={!inputText.trim() || isProcessing}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg border flex-row items-center justify-center',
              inputText.trim() && !isProcessing 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <Ionicons name="analytics" size={16} color="#7C3AED" />
            <Text className="text-purple-600 text-sm font-medium ml-1">Analyze</Text>
          </Pressable>
          
          <Pressable
            onPress={() => sendQuickRequest('creative')}
            disabled={!inputText.trim() || isProcessing}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg border flex-row items-center justify-center',
              inputText.trim() && !isProcessing 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <Ionicons name="bulb" size={16} color="#10B981" />
            <Text className="text-green-600 text-sm font-medium ml-1">Create</Text>
          </Pressable>
          
          <Pressable
            onPress={() => sendQuickRequest('problem_solving')}
            disabled={!inputText.trim() || isProcessing}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg border flex-row items-center justify-center',
              inputText.trim() && !isProcessing 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <Ionicons name="construct" size={16} color="#F59E0B" />
            <Text className="text-orange-600 text-sm font-medium ml-1">Solve</Text>
          </Pressable>
        </View>

        {/* Main Input */}
        <View className="flex-row items-end">
          <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3 max-h-32">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Enhanced ARIA anything..."
              multiline
              className="text-base text-gray-800 min-h-[24px]"
              editable={!isProcessing}
            />
          </View>
          
          {/* Send Button */}
          <Pressable
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isProcessing}
            className={cn(
              'w-12 h-12 rounded-full items-center justify-center',
              inputText.trim() && !isProcessing ? 'bg-blue-500' : 'bg-gray-300'
            )}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() && !isProcessing ? 'white' : '#9CA3AF'}
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}