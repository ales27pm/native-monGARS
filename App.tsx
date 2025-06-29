import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import AssistantScreen from "./src/screens/AssistantScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import PrivacyDashboardScreen from "./src/screens/PrivacyDashboardScreen";
import ProactiveAgentScreen from "./src/screens/ProactiveAgentScreen";
import VoicePipelineTestScreen from "./src/screens/VoicePipelineTestScreen";\nimport TurboModuleTestScreen from "./src/screens/TurboModuleTestScreen";
import { backgroundTaskService } from "./src/services/BackgroundTaskService";

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

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize proactive agent on app startup (optional - can be done manually)
    const initializeProactiveAgent = async () => {
      try {
        console.log('App: Initializing proactive agent...');
        // Note: We don't auto-initialize to respect user choice
        // Users can manually initialize through the ProactiveAgent screen
      } catch (error) {
        console.warn('App: Failed to initialize proactive agent:', error);
      }
    };

    initializeProactiveAgent();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Assistant"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen 
            name="Assistant" 
            component={AssistantScreen} 
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerTransparent: true,
              headerTintColor: "#374151",
            }}
          />
          <Stack.Screen 
            name="PrivacyDashboard" 
            component={PrivacyDashboardScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerTransparent: true,
              headerTintColor: "#374151",
            }}
          />
          <Stack.Screen 
            name="ProactiveAgent" 
            component={ProactiveAgentScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerTransparent: true,
              headerTintColor: "#374151",
            }}
          />
          <Stack.Screen 
            name="VoicePipelineTest" 
            component={VoicePipelineTestScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerTransparent: true,
              headerTintColor: "#374151",
            }}
          />
          <Stack.Screen 
            name="TurboModuleTest" 
            component={TurboModuleTestScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerTransparent: true,
              headerTintColor: "#374151",
            }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
