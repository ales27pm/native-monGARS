import { Alert } from 'react-native';
import { BiometricResult } from '../types/core';
import { AuditService } from './AuditService';

export class MockBiometricService {
  private static instance: MockBiometricService;
  private isUnlocked = false;

  public static getInstance(): MockBiometricService {
    if (!MockBiometricService.instance) {
      MockBiometricService.instance = new MockBiometricService();
    }
    return MockBiometricService.instance;
  }

  private constructor() {}

  async isAvailable(): Promise<boolean> {
    // In a real implementation, this would check for biometric hardware
    return true;
  }

  async authenticate(reason: string = "Déverrouiller monGARS"): Promise<BiometricResult> {
    return new Promise((resolve) => {
      Alert.alert(
        "Authentification simulée",
        `${reason}\n\nEn production, ceci utiliserait Face ID/Touch ID. Pour cette démo, choisissez votre action:`,
        [
          {
            text: "Échec",
            style: "cancel",
            onPress: () => {
              AuditService.getInstance().log('auth_failed', 'Mock authentication failed');
              resolve({ success: false, error: 'Authentification refusée' });
            }
          },
          {
            text: "Succès",
            onPress: () => {
              this.isUnlocked = true;
              AuditService.getInstance().log('auth_success', 'Mock authentication successful');
              resolve({ success: true });
            }
          }
        ]
      );
    });
  }

  async requireAuthentication(reason: string): Promise<boolean> {
    const result = await this.authenticate(reason);
    return result.success;
  }

  isUserUnlocked(): boolean {
    return this.isUnlocked;
  }

  lock(): void {
    this.isUnlocked = false;
  }
}