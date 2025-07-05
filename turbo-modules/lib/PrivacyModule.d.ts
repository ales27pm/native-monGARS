import type { TurboModule } from 'react-native';
export interface PrivacyModuleSpec extends TurboModule {
    encryptData(data: string, key?: string): Promise<string>;
    decryptData(encryptedData: string, key?: string): Promise<string>;
    generateEncryptionKey(): Promise<string>;
    secureStore(key: string, value: string): Promise<boolean>;
    secureRetrieve(key: string): Promise<string | null>;
    secureDelete(key: string): Promise<boolean>;
    secureListKeys(): Promise<string[]>;
    secureClear(): Promise<boolean>;
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
    sanitizeText(text: string, options?: {
        removePII?: boolean;
        anonymize?: boolean;
        redactSensitive?: boolean;
    }): Promise<string>;
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
    isBiometricAvailable(): Promise<boolean>;
    authenticateWithBiometric(): Promise<{
        success: boolean;
        error?: string;
    }>;
    isDeviceSecure(): Promise<{
        isSecure: boolean;
        hasScreenLock: boolean;
        isJailbroken: boolean;
        hasEncryption: boolean;
    }>;
    enableVPNMode(): Promise<boolean>;
    disableVPNMode(): Promise<boolean>;
    isVPNActive(): Promise<boolean>;
    getPrivacyReport(): Promise<{
        dataStored: number;
        encryptedItems: number;
        lastAudit: number;
        securityScore: number;
        recommendations: string[];
    }>;
    checkPermissions(): Promise<{
        camera: boolean;
        microphone: boolean;
        storage: boolean;
        location: boolean;
        contacts: boolean;
    }>;
    requestPermission(permission: string): Promise<boolean>;
}
declare const _default: PrivacyModuleSpec;
export default _default;
