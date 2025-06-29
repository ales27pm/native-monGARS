import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricResult } from '../types/core';
import { AuditService } from './AuditService';

export class BiometricService {
  private static instance: BiometricService;
  private isUnlocked = false;

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  private constructor() {}

  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  async authenticate(reason: string = "Déverrouiller monGARS"): Promise<BiometricResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        AuditService.getInstance().log('auth_failed', 'Biometric authentication not available');
        return { success: false, error: 'Authentification biométrique non disponible' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Utiliser le code',
        disableDeviceFallback: false,
      });

      if (result.success) {
        this.isUnlocked = true;
        AuditService.getInstance().log('auth_success', 'Biometric authentication successful');
        return { success: true };
      } else {
        AuditService.getInstance().log('auth_failed', `Authentication failed: ${result.error}`);
        return { success: false, error: result.error || 'Échec de l\'authentification' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      AuditService.getInstance().log('auth_failed', `Authentication error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
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