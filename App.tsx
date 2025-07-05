import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SimpleNavigator } from "./src/navigation/SimpleNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { initializeTurboModules } from "./src/services/TurboModuleRegistry";
import useAppStore from "./src/state/appStore";
import "./global.css";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { checkAllServices, setInitialized } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 monGARS app starting...');
        
        // Skip TurboModule initialization for now to avoid hanging
        // Just check services and mark as initialized
        await checkAllServices();
        setInitialized(true);
        
        console.log('✅ monGARS app initialized successfully');
      } catch (error) {
        console.error('❌ App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure everything is ready
    setTimeout(initializeApp, 1000);
  }, [checkAllServices, setInitialized]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#007AFF',
            marginBottom: 20
          }}>
            🧠 monGARS
          </Text>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ 
            fontSize: 16, 
            color: '#666',
            marginTop: 16,
            textAlign: 'center'
          }}>
            Loading AI Assistant...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <SimpleNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}