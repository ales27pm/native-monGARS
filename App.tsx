import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppState } from "react-native";
import { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import CacheService from "./src/services/monGARS/CacheService";

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
  useEffect(() => {
    // Set up cache management on app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Optimize cache when app becomes active
        CacheService.ensureCacheSize().catch((error) => {
          console.warn('Cache optimization failed:', error);
        });
      }
    });

    // Initial cache optimization
    CacheService.ensureCacheSize().catch((error) => {
      console.warn('Initial cache optimization failed:', error);
    });

    return () => subscription?.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
