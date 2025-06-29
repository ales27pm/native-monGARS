import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { useAppStore } from "./src/state/appState";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { hasCompletedOnboarding } = useAppStore();

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