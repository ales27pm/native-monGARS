import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MemoryService } from '../services/MemoryService';
import { AuthenticationService } from '../services/AuthenticationService';
import { MemoryEntry } from '../types/core';

interface MemoryExplorerScreenProps {
  onClose: () => void;
}

export const MemoryExplorerScreen: React.FC<MemoryExplorerScreenProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const memoryService = MemoryService.getInstance();
  const authService = AuthenticationService.getInstance();

  useEffect(() => {
    authenticateAndLoad();
  }, []);

  const authenticateAndLoad = async () => {
    const result = await authService.authenticate("Accéder aux mémoires privées");
    if (result.success) {
      setIsAuthenticated(true);
      await loadMemories();
    } else {
      Alert.alert("Authentification requise", "Vous devez vous authentifier pour accéder aux mémoires", [
        { text: "Réessayer", onPress: authenticateAndLoad },
        { text: "Fermer", onPress: onClose }
      ]);
    }
  };

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const result = await memoryService.getMemories(searchQuery || undefined, 100);
      setMemories(result);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadMemories();
  };

  const handleDeleteMemory = (memory: MemoryEntry) => {
    Alert.alert(
      "Supprimer cette mémoire",
      "Cette action est irréversible",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const authResult = await authService.authenticate("Confirmer la suppression");
            if (authResult.success) {
              const success = await memoryService.deleteMemory(memory.id);
              if (success) {
                setMemories(prev => prev.filter(m => m.id !== memory.id));
                setSelectedMemory(null);
              }
            }
          }
        }
      ]
    );
  };

  const formatMetadata = (metadata: Record<string, any>) => {
    return Object.entries(metadata)
      .filter(([key, value]) => key !== 'timestamp' && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(' • ');
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
            Authentifiez-vous pour accéder à vos mémoires privées
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
        <Text className="text-xl font-bold text-gray-900">Mémoires privées</Text>
        <Pressable onPress={onClose} className="p-2">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      {/* Search */}
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher dans les mémoires..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-base text-gray-900"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); loadMemories(); }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-1 flex-row">
        {/* Memory List */}
        <View className="flex-1 border-r border-gray-200">
          <ScrollView className="flex-1">
            {isLoading ? (
              <View className="p-4">
                <Text className="text-gray-500 text-center">Chargement...</Text>
              </View>
            ) : memories.length === 0 ? (
              <View className="p-4">
                <Text className="text-gray-500 text-center">
                  {searchQuery ? "Aucune mémoire trouvée" : "Aucune mémoire stockée"}
                </Text>
              </View>
            ) : (
              memories.map((memory) => (
                <Pressable
                  key={memory.id}
                  onPress={() => setSelectedMemory(memory)}
                  className={`p-4 border-b border-gray-100 ${
                    selectedMemory?.id === memory.id ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <Text className="text-sm font-medium text-gray-900 mb-1" numberOfLines={2}>
                    {memory.content}
                  </Text>
                  
                  {Object.keys(memory.metadata).length > 0 && (
                    <Text className="text-xs text-gray-500 mb-1">
                      {formatMetadata(memory.metadata)}
                    </Text>
                  )}
                  
                  <Text className="text-xs text-gray-400">
                    {memory.createdAt.toLocaleDateString('fr-FR')} à {memory.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

        {/* Memory Detail */}
        <View className="flex-1">
          {selectedMemory ? (
            <ScrollView className="flex-1 p-4">
              <View className="flex-row justify-between items-start mb-4">
                <Text className="text-lg font-bold text-gray-900 flex-1">
                  Détails de la mémoire
                </Text>
                <Pressable
                  onPress={() => handleDeleteMemory(selectedMemory)}
                  className="p-2 bg-red-100 rounded-lg"
                >
                  <Ionicons name="trash" size={16} color="#EF4444" />
                </Pressable>
              </View>

              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <Text className="text-base text-gray-900 leading-6">
                  {selectedMemory.content}
                </Text>
              </View>

              <View className="space-y-3">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">ID</Text>
                  <Text className="text-sm text-gray-600">{selectedMemory.id}</Text>
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Date de création</Text>
                  <Text className="text-sm text-gray-600">
                    {selectedMemory.createdAt.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} à {selectedMemory.createdAt.toLocaleTimeString('fr-FR')}
                  </Text>
                </View>

                {Object.keys(selectedMemory.metadata).length > 0 && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Métadonnées</Text>
                    <View className="bg-gray-50 rounded-lg p-3">
                      {Object.entries(selectedMemory.metadata).map(([key, value]) => (
                        <View key={key} className="flex-row justify-between py-1">
                          <Text className="text-xs text-gray-600 font-medium">{key}:</Text>
                          <Text className="text-xs text-gray-700">{String(value)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="document-text" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">
                Sélectionnez une mémoire pour voir les détails
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};