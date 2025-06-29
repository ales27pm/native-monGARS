import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../state/appState';
import { AuthenticationService } from '../services/AuthenticationService';
import { AuditService } from '../services/AuditService';

const onboardingSteps = [
  {
    title: "Bienvenue dans monGARS",
    description: "Votre assistant personnel privé qui fonctionne entièrement sur votre iPhone. Toutes vos données restent sur cet appareil.",
    icon: "shield-checkmark" as const
  },
  {
    title: "Confidentialité absolue",
    description: "Aucune donnée n'est envoyée dans le cloud ou à un serveur externe. Votre vie privée est notre priorité.",
    icon: "lock-closed" as const
  },
  {
    title: "Authentification biométrique",
    description: "Activez Face ID ou Touch ID pour protéger vos conversations et vos données personnelles.",
    icon: "finger-print" as const
  },
  {
    title: "Intelligence artificielle locale",
    description: "monGARS utilise l'IA pour vous aider, tout en gardant vos informations sécurisées sur votre appareil.",
    icon: "bulb" as const
  },
  {
    title: "C'est parti !",
    description: "Profitez d'une expérience d'assistant IA privée, sécurisée et puissante.",
    icon: "rocket" as const
  }
];

export const OnboardingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSettingUpBiometric, setIsSettingUpBiometric] = useState(false);
  const { setOnboardingComplete, setBiometricEnabled } = useAppStore();

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isBiometricStep = currentStep === 2;

  const handleNext = async () => {
    if (isBiometricStep) {
      await setupBiometric();
    } else if (isLastStep) {
      completeOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const setupBiometric = async () => {
    setIsSettingUpBiometric(true);
    
    try {
      const authService = AuthenticationService.getInstance();
      
      // Show demo notice if using mock authentication
      if (authService.isUsingMockAuthentication()) {
        Alert.alert(
          "Mode démo",
          "Cette version utilise une authentification simulée pour la démonstration. En production, Face ID/Touch ID serait utilisé.",
          [{ text: "Compris", onPress: () => {} }]
        );
      }
      
      const isAvailable = await authService.isAvailable();
      
      if (!isAvailable) {
        Alert.alert(
          "Authentification biométrique",
          "L'authentification biométrique n'est pas disponible ou configurée sur cet appareil. Vous pouvez l'activer plus tard dans les paramètres.",
          [
            {
              text: "Continuer",
              onPress: () => {
                setBiometricEnabled(false);
                setCurrentStep(prev => prev + 1);
              }
            }
          ]
        );
        return;
      }

      const result = await authService.authenticate("Configurer l'authentification pour monGARS");
      
      if (result.success) {
        setBiometricEnabled(true);
        AuditService.getInstance().log('consent_granted', 'Biometric authentication enabled during onboarding');
        setCurrentStep(prev => prev + 1);
      } else {
        Alert.alert(
          "Authentification échouée",
          result.error || "Impossible de configurer l'authentification biométrique",
          [
            {
              text: "Réessayer",
              onPress: () => setIsSettingUpBiometric(false)
            },
            {
              text: "Ignorer",
              style: "cancel",
              onPress: () => {
                setBiometricEnabled(false);
                setCurrentStep(prev => prev + 1);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la configuration");
    } finally {
      setIsSettingUpBiometric(false);
    }
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    AuditService.getInstance().log('settings_change', 'Onboarding completed');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        {/* Progress indicator */}
        <View className="flex-row justify-center mb-8">
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-8">
            <Ionicons 
              name={currentStepData.icon} 
              size={40} 
              color="#3B82F6" 
            />
          </View>

          <Text className="text-3xl font-bold text-center mb-4 text-gray-900">
            {currentStepData.title}
          </Text>

          <Text className="text-lg text-center text-gray-600 leading-6 px-4">
            {currentStepData.description}
          </Text>
        </View>

        {/* Navigation buttons */}
        <View className="flex-row justify-between items-center">
          <Pressable
            onPress={handlePrevious}
            className={`py-3 px-6 rounded-xl ${
              currentStep === 0 ? 'opacity-0' : 'bg-gray-100'
            }`}
            disabled={currentStep === 0}
          >
            <Text className="text-gray-700 font-medium">Retour</Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            disabled={isSettingUpBiometric}
            className={`py-3 px-8 rounded-xl ${
              isSettingUpBiometric ? 'bg-gray-400' : 'bg-blue-500'
            }`}
          >
            <Text className="text-white font-bold">
              {isSettingUpBiometric 
                ? 'Configuration...' 
                : isLastStep 
                  ? 'Commencer' 
                  : isBiometricStep 
                    ? 'Configurer' 
                    : 'Suivant'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};