import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../state/appState';
import { AuthenticationService } from '../services/AuthenticationService';
import { MemoryService } from '../services/MemoryService';
import { AuditService } from '../services/AuditService';
import { AuditEvent } from '../types/core';
import { MemoryExplorerScreen } from './MemoryExplorerScreen';
import { DeveloperSettingsScreen } from './DeveloperSettingsScreen';
import FeatureFlagService, { FeatureFlags } from '../services/FeatureFlagService';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [memoryStats, setMemoryStats] = useState({ totalMemories: 0, totalSize: 0 });
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showMemoryExplorer, setShowMemoryExplorer] = useState(false);
  const [showDeveloperSettings, setShowDeveloperSettings] = useState(false);
  
  const {
    isDarkMode,
    ttsEnabled,
    biometricEnabled,
    setDarkMode,
    setTTSEnabled,
    setBiometricEnabled,
    clearMessages,
    resetApp
  } = useAppStore();

  const authService = AuthenticationService.getInstance();
  const memoryService = MemoryService.getInstance();
  const auditService = AuditService.getInstance();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await memoryService.getMemoryStats();
      setMemoryStats(stats);
      
      const events = await auditService.getRecentEvents(20);
      setAuditEvents(events);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await authService.authenticate("Activer l'authentification biométrique");
      if (result.success) {
        setBiometricEnabled(true);
        auditService.log('settings_change', 'Biometric authentication enabled');
      } else {
        Alert.alert("Erreur", result.error || "Impossible d'activer l'authentification biométrique");
      }
    } else {
      const result = await authService.authenticate("Désactiver l'authentification biométrique");
      if (result.success) {
        setBiometricEnabled(false);
        auditService.log('settings_change', 'Biometric authentication disabled');
      }
    }
  };

  const handleClearMemories = async () => {
    const result = await authService.authenticate("Confirmer la suppression des mémoires");
    if (!result.success) return;

    Alert.alert(
      "Supprimer toutes les mémoires",
      "Cette action supprimera définitivement toutes les conversations et mémoires stockées. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await memoryService.clearAllMemories();
              clearMessages();
              loadStats();
              Alert.alert("Succès", "Toutes les mémoires ont été supprimées");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer les mémoires");
            }
          }
        }
      ]
    );
  };

  const handlePanicWipe = async () => {
    const result = await authService.authenticate("PANIC WIPE - Confirmer la suppression totale");
    if (!result.success) return;

    Alert.alert(
      "⚠️ PANIC WIPE ⚠️",
      "Cette action supprimera TOUTES les données de l'application de manière permanente et irréversible. L'application se fermera après la suppression.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "TOUT SUPPRIMER",
          style: "destructive",
          onPress: async () => {
            try {
              await memoryService.clearAllMemories();
              await auditService.clearAll();
              resetApp();
              Alert.alert("Suppression terminée", "Toutes les données ont été supprimées. L'application va se fermer.", [
                { text: "OK", onPress: () => {
                  // In a real app, you might force close or navigate to onboarding
                  console.log('App should close or reset');
                }}
              ]);
            } catch (error) {
              Alert.alert("Erreur", "Erreur lors de la suppression des données");
            }
          }
        }
      ]
    );
  };

  const SettingItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    danger?: boolean;
  }> = ({ icon, title, subtitle, rightElement, onPress, danger = false }) => (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-4 px-4 ${onPress ? 'active:bg-gray-50' : ''}`}
    >
      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
        danger ? 'bg-red-100' : 'bg-gray-100'
      }`}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={danger ? '#EF4444' : '#6B7280'} 
        />
      </View>
      
      <View className="flex-1">
        <Text className={`text-base font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
        )}
      </View>
      
      {rightElement}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">Paramètres</Text>
        <Pressable onPress={onClose} className="p-2">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {/* Privacy & Security */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-4">
            Sécurité & Confidentialité
          </Text>
          
          <SettingItem
            icon="finger-print"
            title="Authentification biométrique"
            subtitle="Face ID / Touch ID pour protéger vos données"
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={biometricEnabled ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />
          
          <SettingItem
            icon="document-text"
            title="Journal d'audit"
            subtitle={`${auditEvents.length} événements récents`}
            rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
            onPress={() => setShowAuditLog(true)}
          />
        </View>

        {/* App Settings */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-4">
            Paramètres de l'app
          </Text>
          
          <SettingItem
            icon="volume-high"
            title="Synthèse vocale"
            subtitle="Lecture audio des réponses"
            rightElement={
              <Switch
                value={ttsEnabled}
                onValueChange={(value) => {
                  setTTSEnabled(value);
                  auditService.log('settings_change', `TTS ${value ? 'enabled' : 'disabled'}`);
                }}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={ttsEnabled ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />
          
          <SettingItem
            icon="moon"
            title="Mode sombre"
            subtitle="Interface sombre (bientôt disponible)"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={(value) => {
                  setDarkMode(value);
                  auditService.log('settings_change', `Dark mode ${value ? 'enabled' : 'disabled'}`);
                }}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={isDarkMode ? '#FFFFFF' : '#9CA3AF'}
                disabled
              />
            }
          />
        </View>

        {/* Data Management */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-4">
            Gestion des données
          </Text>
          
          <SettingItem
            icon="folder"
            title="Mémoires stockées"
            subtitle={`${memoryStats.totalMemories} entrées • ${(memoryStats.totalSize / 1024).toFixed(1)} KB`}
            rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
            onPress={() => setShowMemoryExplorer(true)}
          />
          
          <SettingItem
            icon="refresh"
            title="Effacer les conversations"
            subtitle="Supprimer l'historique des messages"
            onPress={() => {
              Alert.alert(
                "Effacer les conversations",
                "Supprimer l'historique des messages actuels ?",
                [
                  { text: "Annuler", style: "cancel" },
                  { text: "Effacer", onPress: () => clearMessages() }
                ]
              );
            }}
          />
          
          <SettingItem
            icon="trash"
            title="Supprimer toutes les mémoires"
            subtitle="Suppression permanente de toutes les données"
            onPress={handleClearMemories}
            danger
          />
        </View>

        {/* Developer Tools */}
        {FeatureFlagService.getInstance().isEnabled(FeatureFlags.DEBUG_MODE) && (
          <View className="mt-6">
            <Text className="text-lg font-semibold text-purple-600 px-4 mb-4">
              Outils développeur
            </Text>
            
            <SettingItem
              icon="code-slash"
              title="Developer Settings"
              subtitle="Feature flags, performance, debugging"
              rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
              onPress={() => setShowDeveloperSettings(true)}
            />
          </View>
        )}

        {/* Emergency */}
        <View className="mt-6 mb-8">
          <Text className="text-lg font-semibold text-red-600 px-4 mb-4">
            Actions d'urgence
          </Text>
          
          <SettingItem
            icon="warning"
            title="PANIC WIPE"
            subtitle="Suppression immédiate de toutes les données"
            onPress={handlePanicWipe}
            danger
          />
        </View>
      </ScrollView>

      {/* Memory Explorer Modal */}
      {showMemoryExplorer && (
        <MemoryExplorerScreen onClose={() => setShowMemoryExplorer(false)} />
      )}

      {/* Developer Settings Modal */}
      {showDeveloperSettings && (
        <DeveloperSettingsScreen onClose={() => setShowDeveloperSettings(false)} />
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <View className="absolute inset-0 bg-white">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Journal d'audit</Text>
              <Pressable onPress={() => setShowAuditLog(false)} className="p-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            
            <ScrollView className="flex-1 px-4">
              {auditEvents.map((event) => (
                <View key={event.id} className="py-3 border-b border-gray-100">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-sm font-medium text-gray-900">
                      {event.action.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {event.timestamp.toLocaleString('fr-FR')}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-600 mt-1">
                    {event.detail}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
};