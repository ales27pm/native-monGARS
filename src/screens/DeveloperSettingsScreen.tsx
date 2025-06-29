import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FeatureFlagService, { FeatureFlags, FeatureFlag } from '../services/FeatureFlagService';
import PerformanceMonitor from '../services/PerformanceMonitor';
import ResilientLLMService from '../services/LLMProvider';
import { AuthenticationService } from '../services/AuthenticationService';

interface DeveloperSettingsScreenProps {
  onClose: () => void;
}

export const DeveloperSettingsScreen: React.FC<DeveloperSettingsScreenProps> = ({ onClose }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    authenticateAndLoad();
  }, []);

  const authenticateAndLoad = async () => {
    const authService = AuthenticationService.getInstance();
    const result = await authService.authenticate("Accéder aux paramètres développeur");
    
    if (result.success) {
      setIsAuthenticated(true);
      loadData();
    } else {
      Alert.alert("Accès refusé", "Authentification requise pour les paramètres développeur", [
        { text: "Fermer", onPress: onClose }
      ]);
    }
  };

  const loadData = () => {
    // Load feature flags
    const allFlags = FeatureFlagService.getInstance().getAllFlags();
    setFlags(allFlags);

    // Load performance data
    const perfData = PerformanceMonitor.getInstance().getPerformanceSummary();
    setPerformanceData(perfData);
  };

  const toggleFeatureFlag = async (flagKey: FeatureFlags, enabled: boolean) => {
    await FeatureFlagService.getInstance().setFlagOverride(flagKey, enabled);
    loadData(); // Refresh
  };

  const resetAllFlags = async () => {
    Alert.alert(
      "Réinitialiser les feature flags",
      "Remettre tous les flags à leurs valeurs par défaut ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          onPress: async () => {
            await FeatureFlagService.getInstance().resetAllFlags();
            loadData();
          }
        }
      ]
    );
  };

  const enableAllFlags = async () => {
    Alert.alert(
      "Activer tous les flags",
      "Activer toutes les fonctionnalités expérimentales ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Activer tout",
          onPress: async () => {
            await FeatureFlagService.getInstance().enableAllFlags();
            loadData();
          }
        }
      ]
    );
  };

  const clearPerformanceData = () => {
    PerformanceMonitor.getInstance().clearMetrics();
    setPerformanceData(null);
    Alert.alert("Succès", "Données de performance effacées");
  };

  const switchLLMProvider = (provider: 'openai' | 'anthropic' | 'local' | 'auto') => {
    ResilientLLMService.getInstance().switchProvider(provider);
    Alert.alert("Succès", `Basculé vers le provider ${provider}`);
  };

  const formatMetric = (value: number | undefined, unit: string = '') => {
    if (value === undefined) return 'N/A';
    if (unit === 'bytes') {
      return `${(value / 1024 / 1024).toFixed(1)} MB`;
    }
    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    }
    return `${value.toFixed(2)}${unit}`;
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
            Accès développeur protégé par authentification biométrique
          </Text>
          <Pressable
            onPress={authenticateAndLoad}
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
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">⚙️ Dev Settings</Text>
        <Pressable onPress={onClose} className="p-2">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {/* LLM Provider Selection */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-4">
            🤖 LLM Provider
          </Text>
          
          <View className="px-4 space-y-2">
            {['auto', 'anthropic', 'openai', 'local'].map((provider) => (
              <Pressable
                key={provider}
                onPress={() => switchLLMProvider(provider as any)}
                className="bg-gray-100 p-3 rounded-lg"
              >
                <Text className="font-medium text-gray-900 capitalize">
                  {provider === 'auto' ? '🎯 Auto (Intelligent)' : 
                   provider === 'local' ? '🛡️ Local (Private)' :
                   provider === 'anthropic' ? '🧠 Anthropic Claude' :
                   '🚀 OpenAI GPT-4'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Feature Flags */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              🚩 Feature Flags
            </Text>
            <View className="flex-row space-x-2">
              <Pressable onPress={enableAllFlags} className="bg-green-100 px-3 py-1 rounded">
                <Text className="text-green-800 text-sm font-medium">Tout activer</Text>
              </Pressable>
              <Pressable onPress={resetAllFlags} className="bg-gray-100 px-3 py-1 rounded">
                <Text className="text-gray-800 text-sm font-medium">Reset</Text>
              </Pressable>
            </View>
          </View>
          
          {flags.map((flag) => (
            <View key={flag.key} className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="font-medium text-gray-900">{flag.key}</Text>
                <Text className="text-sm text-gray-600">{flag.description}</Text>
                {flag.rolloutPercentage !== undefined && (
                  <Text className="text-xs text-blue-600">Rollout: {flag.rolloutPercentage}%</Text>
                )}
              </View>
              <Switch
                value={flag.enabled}
                onValueChange={(value) => toggleFeatureFlag(flag.key as FeatureFlags, value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={flag.enabled ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          ))}
        </View>

        {/* Performance Metrics */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              📊 Performance
            </Text>
            <Pressable onPress={clearPerformanceData} className="bg-red-100 px-3 py-1 rounded">
              <Text className="text-red-800 text-sm font-medium">Clear</Text>
            </Pressable>
          </View>

          {performanceData ? (
            <>
              {/* Averages */}
              <View className="px-4 mb-6">
                <Text className="font-medium text-gray-900 mb-3">Moyennes</Text>
                <View className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Cold Start</Text>
                    <Text className="font-mono">{formatMetric(performanceData.averages.coldStartTime, 'ms')}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Warm Start</Text>
                    <Text className="font-mono">{formatMetric(performanceData.averages.warmStartTime, 'ms')}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Memory Usage</Text>
                    <Text className="font-mono">{formatMetric(performanceData.averages.memoryUsage, 'bytes')}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Inference Time</Text>
                    <Text className="font-mono">{formatMetric(performanceData.averages.inferenceTime, 'ms')}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Tokens/Second</Text>
                    <Text className="font-mono">{formatMetric(performanceData.averages.tokensPerSecond, '/s')}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Frame Rate</Text>
                    <Text className="font-mono">{formatMetric(performanceData.averages.frameRate, ' FPS')}</Text>
                  </View>
                </View>
              </View>

              {/* Violations */}
              {performanceData.violations.length > 0 && (
                <View className="px-4 mb-6">
                  <Text className="font-medium text-red-600 mb-3">⚠️ Violations de seuil</Text>
                  <View className="space-y-2">
                    {performanceData.violations.map((violation: any, index: number) => (
                      <View key={index} className="bg-red-50 rounded-lg p-3">
                        <Text className="font-medium text-red-800">{violation.metric}</Text>
                        <Text className="text-red-600 text-sm">
                          Valeur: {formatMetric(violation.value)} | Seuil: {formatMetric(violation.threshold)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Recommendations */}
              {performanceData.recommendations.length > 0 && (
                <View className="px-4 mb-6">
                  <Text className="font-medium text-blue-600 mb-3">💡 Recommandations</Text>
                  <View className="space-y-2">
                    {performanceData.recommendations.map((rec: string, index: number) => (
                      <View key={index} className="bg-blue-50 rounded-lg p-3">
                        <Text className="text-blue-800 text-sm">{rec}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <View className="px-4">
              <Text className="text-gray-500 text-center py-8">
                Aucune donnée de performance disponible
              </Text>
            </View>
          )}
        </View>

        {/* System Info */}
        <View className="mt-6 mb-8">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-4">
            ℹ️ System Info
          </Text>
          
          <View className="px-4">
            <View className="bg-gray-50 rounded-lg p-4 space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Environment</Text>
                <Text className="font-mono">{__DEV__ ? 'Development' : 'Production'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Mock Auth</Text>
                <Text className="font-mono">
                  {AuthenticationService.getInstance().isUsingMockAuthentication() ? 'Yes' : 'No'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Current LLM</Text>
                <Text className="font-mono">{ResilientLLMService.getInstance().getCurrentProvider().name}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};