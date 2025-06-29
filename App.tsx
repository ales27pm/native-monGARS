import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { useAppStore } from "./src/state/appState";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import FeatureFlagService from "./src/services/FeatureFlagService";
import PerformanceMonitor from "./src/services/PerformanceMonitor";

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { hasCompletedOnboarding } = useAppStore();

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize feature flags
      await FeatureFlagService.getInstance().initialize();
      
      // Start performance monitoring
      PerformanceMonitor.getInstance().startTimer('app_initialization');
      
      // Simulate initialization time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      PerformanceMonitor.getInstance().endTimer('app_initialization', 'coldStartTime');
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize services:', error);
      setIsInitialized(true); // Continue anyway
    }
  };

  if (!isInitialized) {
    return null; // Could show a splash screen here
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        
        {!hasCompletedOnboarding ? (
          <OnboardingScreen />
        ) : showSettings ? (
          <SettingsScreen onClose={() => setShowSettings(false)} />
        ) : (
          <ChatScreen onShowSettings={() => setShowSettings(true)} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}