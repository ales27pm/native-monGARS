import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SimpleNavigator } from "./src/navigation/SimpleNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { logger } from "./src/utils/logger";
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
  const { checkAllServices, setInitialized } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      logger.info('App', 'monGARS app starting...');
      
      // Initialize TurboModules on startup
      const success = await initializeTurboModules();
      if (success) {
        logger.info('TurboModules', '✅ TurboModules initialized successfully');
      } else {
        logger.warn('TurboModules', '⚠️ TurboModules initialization failed - running in compatibility mode');
      }

      // Check service availability
      await checkAllServices();

      // Mark app as initialized
      setInitialized(true);
      logger.info('App', '✅ monGARS app initialized successfully');
    };

    initializeApp().catch(error => {
      logger.error('App', 'Unhandled initialization error', error);
    });
    
    return () => {
      logger.info('App', 'monGARS app stopped');
    };
  }, [checkAllServices, setInitialized]);

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
