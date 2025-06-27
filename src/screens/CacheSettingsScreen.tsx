import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import CacheService, { CacheStats } from '../services/monGARS/CacheService';
import { chatEngine } from '../services/monGARS/ChatEngine';

export default function CacheSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<CacheStats>({
    chunkCount: 0,
    totalSize: 0,
  });
  const [prefetchEnabled, setPrefetchEnabled] = useState(false);
  const [maxSize, setMaxSize] = useState(10 * 1024 * 1024); // 10MB default
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load cache stats
      const cacheStats = await CacheService.getStats();
      setStats(cacheStats);

      // Load prefetch setting
      const prefetchSetting = await AsyncStorage.getItem('prefetchEnabled');
      setPrefetchEnabled(prefetchSetting === 'true');

      // Load max cache size setting
      const maxSizeSetting = await AsyncStorage.getItem('cacheMaxSize');
      if (maxSizeSetting) {
        setMaxSize(parseInt(maxSizeSetting, 10));
      }
    } catch (error) {
      console.error('Error loading cache settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached conversation data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await CacheService.clearCache();
              setStats({ chunkCount: 0, totalSize: 0 });
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleOptimizeCache = async () => {
    try {
      setOptimizing(true);
      await chatEngine.optimizeCache();
      const newStats = await CacheService.getStats();
      setStats(newStats);
      Alert.alert('Success', 'Cache optimized successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize cache');
    } finally {
      setOptimizing(false);
    }
  };

  const togglePrefetch = async (value: boolean) => {
    try {
      setPrefetchEnabled(value);
      await AsyncStorage.setItem('prefetchEnabled', value.toString());
    } catch (error) {
      console.error('Error updating prefetch setting:', error);
      setPrefetchEnabled(!value); // Revert on error
    }
  };

  const updateMaxSize = async (value: number) => {
    try {
      setMaxSize(value);
      await AsyncStorage.setItem('cacheMaxSize', value.toString());
      
      // If new size is smaller than current usage, optimize immediately
      if (value < stats.totalSize) {
        setTimeout(() => handleOptimizeCache(), 500);
      }
    } catch (error) {
      console.error('Error updating max cache size:', error);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getCacheUsagePercentage = (): number => {
    if (maxSize === 0) return 0;
    return (stats.totalSize / maxSize) * 100;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading cache settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50" 
      style={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View 
        entering={FadeInUp} 
        className="bg-white p-6 border-b border-gray-200"
      >
        <View className="flex-row items-center mb-2">
          <Ionicons name="server-outline" size={24} color="#3B82F6" />
          <Text className="text-2xl font-bold text-gray-800 ml-3">
            Cache & Performance
          </Text>
        </View>
        <Text className="text-gray-600">
          Manage AI conversation caching and performance settings
        </Text>
      </Animated.View>

      {/* Cache Statistics */}
      <Animated.View 
        entering={FadeInUp.delay(100)} 
        className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm border border-gray-200"
      >
        <View className="flex-row items-center mb-4">
          <Ionicons name="analytics-outline" size={20} color="#10B981" />
          <Text className="text-lg font-semibold text-gray-800 ml-2">
            Cache Usage
          </Text>
        </View>

        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Cached Chunks</Text>
            <Text className="font-semibold text-gray-800">
              {stats.chunkCount}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Storage Used</Text>
            <Text className="font-semibold text-gray-800">
              {formatSize(stats.totalSize)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Cache Limit</Text>
            <Text className="font-semibold text-gray-800">
              {formatSize(maxSize)}
            </Text>
          </View>

          {/* Usage Progress Bar */}
          <View className="mt-2">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-sm text-gray-500">Usage</Text>
              <Text className="text-sm text-gray-500">
                {getCacheUsagePercentage().toFixed(1)}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full">
              <View 
                className={`h-2 rounded-full ${
                  getCacheUsagePercentage() > 80 ? 'bg-red-500' :
                  getCacheUsagePercentage() > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(getCacheUsagePercentage(), 100)}%` }}
              />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Cache Management */}
      <Animated.View 
        entering={FadeInUp.delay(200)} 
        className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm border border-gray-200"
      >
        <View className="flex-row items-center mb-4">
          <Ionicons name="settings-outline" size={20} color="#8B5CF6" />
          <Text className="text-lg font-semibold text-gray-800 ml-2">
            Cache Management
          </Text>
        </View>

        <View className="space-y-4">
          {/* Clear Cache Button */}
          <Pressable
            onPress={handleClearCache}
            className="bg-red-50 border border-red-200 rounded-lg p-3 active:bg-red-100"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text className="text-red-600 font-medium ml-2">
                Clear All Cache
              </Text>
            </View>
          </Pressable>

          {/* Optimize Cache Button */}
          <Pressable
            onPress={handleOptimizeCache}
            disabled={optimizing}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3 active:bg-blue-100"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons 
                name={optimizing ? "sync-outline" : "flash-outline"} 
                size={16} 
                color="#3B82F6" 
              />
              <Text className="text-blue-600 font-medium ml-2">
                {optimizing ? 'Optimizing...' : 'Optimize Cache'}
              </Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Performance Settings */}
      <Animated.View 
        entering={FadeInUp.delay(300)} 
        className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm border border-gray-200"
      >
        <View className="flex-row items-center mb-4">
          <Ionicons name="flash-outline" size={20} color="#F59E0B" />
          <Text className="text-lg font-semibold text-gray-800 ml-2">
            Performance Settings
          </Text>
        </View>

        <View className="space-y-4">
          {/* Prefetch Toggle */}
          <View>
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">
                  Smart Prefetching
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Preload conversation data when charging and on WiFi
                </Text>
              </View>
              <Switch 
                value={prefetchEnabled} 
                onValueChange={togglePrefetch}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={prefetchEnabled ? '#3B82F6' : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Cache Size Limit */}
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-800 font-medium">
                Max Cache Size
              </Text>
              <Text className="text-gray-600">
                {formatSize(maxSize)}
              </Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1 * 1024 * 1024} // 1MB
              maximumValue={100 * 1024 * 1024} // 100MB
              step={1 * 1024 * 1024} // 1MB steps
              value={maxSize}
              onValueChange={updateMaxSize}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#3B82F6"
            />
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">1MB</Text>
              <Text className="text-xs text-gray-500">100MB</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Info Section */}
      <Animated.View 
        entering={FadeInUp.delay(400)} 
        className="bg-blue-50 mx-4 mt-4 mb-6 rounded-xl p-4 border border-blue-200"
      >
        <View className="flex-row items-start">
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <View className="flex-1 ml-3">
            <Text className="text-sm text-blue-800 font-medium mb-1">
              About AI Caching
            </Text>
            <Text className="text-sm text-blue-700">
              ARIA uses intelligent caching to improve response times and reduce API usage. 
              Conversations are compressed and stored locally, with automatic optimization 
              based on usage patterns.
            </Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}