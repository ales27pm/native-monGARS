import { BiometricResult } from '../types/core';
import { MockBiometricService } from './MockBiometricService';

// Try to import the real biometric service, fall back to mock if not available
let RealBiometricService: any = null;
try {
  const LocalAuthentication = require('expo-local-authentication');
  RealBiometricService = LocalAuthentication;
} catch (error) {
  console.log('expo-local-authentication not available, using mock service');
}

export class AuthenticationService {
  private static instance: AuthenticationService;
  private isUnlocked = false;
  private useRealBiometric = false;

  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  private constructor() {
    this.useRealBiometric = RealBiometricService !== null;
  }

  async isAvailable(): Promise<boolean> {
    if (this.useRealBiometric) {
      try {
        const hasHardware = await RealBiometricService.hasHardwareAsync();
        const isEnrolled = await RealBiometricService.isEnrolledAsync();
        return hasHardware && isEnrolled;
      } catch (error) {
        console.log('Real biometric check failed, falling back to mock');
        this.useRealBiometric = false;
        return MockBiometricService.getInstance().isAvailable();
      }
    }
    return MockBiometricService.getInstance().isAvailable();
  }

  async authenticate(reason: string = "Déverrouiller monGARS"): Promise<BiometricResult> {
    if (this.useRealBiometric) {
      try {
        const available = await this.isAvailable();
        if (!available) {
          return { success: false, error: 'Authentification biométrique non disponible' };
        }

        const result = await RealBiometricService.authenticateAsync({
          promptMessage: reason,
          fallbackLabel: 'Utiliser le code',
          disableDeviceFallback: false,
        });

        if (result.success) {
          this.isUnlocked = true;
          return { success: true };
        } else {
          return { success: false, error: result.error || 'Échec de l\'authentification' };
        }
      } catch (error) {
        console.log('Real biometric authentication failed, falling back to mock');
        this.useRealBiometric = false;
        return MockBiometricService.getInstance().authenticate(reason);
      }
    }
    
    return MockBiometricService.getInstance().authenticate(reason);
  }

  async requireAuthentication(reason: string): Promise<boolean> {
    const result = await this.authenticate(reason);
    return result.success;
  }

  isUserUnlocked(): boolean {
    if (this.useRealBiometric) {
      return this.isUnlocked;
    }
    return MockBiometricService.getInstance().isUserUnlocked();
  }

  lock(): void {
    this.isUnlocked = false;
    if (!this.useRealBiometric) {
      MockBiometricService.getInstance().lock();
    }
  }

  isUsingMockAuthentication(): boolean {
    return !this.useRealBiometric;
  }
}