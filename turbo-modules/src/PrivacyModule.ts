import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface PrivacyModuleSpec extends TurboModule {
  // Data Encryption
  encryptData(data: string, key?: string): Promise<string>;
  decryptData(encryptedData: string, key?: string): Promise<string>;
  generateEncryptionKey(): Promise<string>;
  
  // Secure Storage
  secureStore(key: string, value: string): Promise<boolean>;
  secureRetrieve(key: string): Promise<string | null>;
  secureDelete(key: string): Promise<boolean>;
  secureListKeys(): Promise<string[]>;
  secureClear(): Promise<boolean>;
  
  // Privacy Scanning
  scanForPII(text: string): Promise<{
    foundPII: boolean;
    types: string[];
    locations: Array<{
      type: string;
      start: number;
      end: number;
      value: string;
    }>;
  }>;
  
  // Data Sanitization
  sanitizeText(text: string, options?: {
    removePII?: boolean;
    anonymize?: boolean;
    redactSensitive?: boolean;
  }): Promise<string>;
  
  // Privacy Compliance
  checkGDPRCompliance(data: string): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  
  checkCCPACompliance(data: string): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  
  // Biometric Security
  isBiometricAvailable(): Promise<boolean>;
  authenticateWithBiometric(): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // Device Security
  isDeviceSecure(): Promise<{
    isSecure: boolean;
    hasScreenLock: boolean;
    isJailbroken: boolean;
    hasEncryption: boolean;
  }>;
  
  // Network Privacy
  enableVPNMode(): Promise<boolean>;
  disableVPNMode(): Promise<boolean>;
  isVPNActive(): Promise<boolean>;
  
  // Data Audit
  getPrivacyReport(): Promise<{
    dataStored: number;
    encryptedItems: number;
    lastAudit: number;
    securityScore: number;
    recommendations: string[];
  }>;
  
  // Permissions
  checkPermissions(): Promise<{
    camera: boolean;
    microphone: boolean;
    storage: boolean;
    location: boolean;
    contacts: boolean;
  }>;
  
  requestPermission(permission: string): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<PrivacyModuleSpec>('PrivacyModule');