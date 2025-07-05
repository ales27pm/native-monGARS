import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SimpleNavigator } from './SimpleNavigator';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={SimpleNavigator} />
    </Stack.Navigator>
  );
}

export default AppNavigator;