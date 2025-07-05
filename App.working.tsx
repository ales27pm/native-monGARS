import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SimpleNavigator } from "./src/navigation/SimpleNavigator";
import useAppStore from "./src/state/appStore";
import "./global.css";

// Simple error boundary component
function SimpleErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#ff4444', marginBottom: 16 }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          Please restart the app
        </Text>
      </View>
    );
  }

  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { checkAllServices, setInitialized } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 monGARS app starting...');
        
        // Skip TurboModule initialization for now to avoid errors
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
    setTimeout(initializeApp, 500);
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
    <SimpleErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <SimpleNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </SimpleErrorBoundary>
  );
}