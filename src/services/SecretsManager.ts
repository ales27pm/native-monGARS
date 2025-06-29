import * as Keychain from 'react-native-keychain';
import * as Crypto from 'expo-crypto';
import { AuditService } from './AuditService';

// Tier 1: Build-time, non-sensitive configuration
export const AppConfig = {
  API_BASE_URL: process.env.EXPO_PUBLIC_VIBECODE_API_URL || 'https://api.vibecode.com',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'production',
  DEBUG_MODE: __DEV__,
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
};

// Tier 2: On-device, user-specific secrets
export interface UserCredentials {
  userId: string;
  authToken?: string;
  refreshToken?: string;
  biometricKey?: string;
  userApiKeys?: {
    openai?: string;
    anthropic?: string;
    custom?: Record<string, string>;
  };
}

// Tier 3: Application secrets (handled via backend proxy)
export interface BackendProxyRequest {
  provider: 'openai' | 'anthropic' | 'grok';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  userId?: string;
  sessionId?: string;
}

export interface BackendProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  rateLimit?: {
    remaining: number;
    resetTime: number;
  };
}

class SecretsManager {
  private static instance: SecretsManager;
  private keyPrefix = 'mongars_';
  private sessionToken: string | null = null;
  private sessionExpiry: number | null = null;

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  private constructor() {}

  // Tier 2: Secure on-device storage
  async storeUserCredentials(credentials: UserCredentials): Promise<boolean> {
    try {
      const credentialsJson = JSON.stringify(credentials);
      
      // Encrypt the credentials before storing
      const encryptedData = await this.encryptData(credentialsJson);
      
      await Keychain.setInternetCredentials(
        `${this.keyPrefix}user_credentials`,
        credentials.userId,
        encryptedData
      );

      AuditService.getInstance().log('settings_change', 'User credentials stored securely');
      return true;
    } catch (error) {
      console.error('Failed to store user credentials:', error);
      AuditService.getInstance().log('auth_failed', `Failed to store credentials: ${error}`);
      return false;
    }
  }

  async getUserCredentials(): Promise<UserCredentials | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.keyPrefix}user_credentials`);
      
      if (!credentials || credentials === false) {
        return null;
      }

      // Decrypt the credentials
      const decryptedData = await this.decryptData(credentials.password);
      const userCredentials = JSON.parse(decryptedData) as UserCredentials;

      AuditService.getInstance().log('auth_success', 'User credentials retrieved');
      return userCredentials;
    } catch (error) {
      console.error('Failed to retrieve user credentials:', error);
      AuditService.getInstance().log('auth_failed', `Failed to retrieve credentials: ${error}`);
      return null;
    }
  }

  async clearUserCredentials(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(`${this.keyPrefix}user_credentials`);
      AuditService.getInstance().log('settings_change', 'User credentials cleared');
    } catch (error) {
      console.error('Failed to clear user credentials:', error);
    }
  }

  // Tier 3: Backend proxy for application secrets
  async callSecureAPI(request: BackendProxyRequest): Promise<BackendProxyResponse> {
    try {
      // Ensure we have a valid session token
      await this.ensureValidSession();

      const proxyUrl = `${AppConfig.API_BASE_URL}/proxy/${request.provider}`;
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`,
          'X-Session-Id': await this.getSessionId(),
          ...request.headers,
        },
        body: JSON.stringify({
          endpoint: request.endpoint,
          method: request.method,
          data: request.body,
          userId: request.userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      AuditService.getInstance().log('memory_write', `Secure API call to ${request.provider} via proxy`);
      
      return {
        success: true,
        data: data.response,
        rateLimit: data.rateLimit,
      };

    } catch (error) {
      console.error('Secure API call failed:', error);
      AuditService.getInstance().log('auth_failed', `Proxy API call failed: ${error}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Session management for backend proxy
  private async ensureValidSession(): Promise<void> {
    const now = Date.now();
    
    // Check if we have a valid session token
    if (this.sessionToken && this.sessionExpiry && now < this.sessionExpiry) {
      return;
    }

    // Request a new session token
    try {
      const userCredentials = await this.getUserCredentials();
      const deviceId = await this.getDeviceId();
      
      const response = await fetch(`${AppConfig.API_BASE_URL}/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          userId: userCredentials?.userId,
          authToken: userCredentials?.authToken,
          timestamp: now,
        }),
      });

      if (!response.ok) {
        throw new Error(`Session creation failed: ${response.status}`);
      }

      const sessionData = await response.json();
      this.sessionToken = sessionData.sessionToken;
      this.sessionExpiry = now + (sessionData.expiresIn * 1000); // Convert to ms

      AuditService.getInstance().log('auth_success', 'New session token obtained');
      
    } catch (error) {
      console.error('Failed to obtain session token:', error);
      throw new Error('Unable to establish secure session');
    }
  }

  private async getSessionId(): Promise<string> {
    const deviceId = await this.getDeviceId();
    const timestamp = Date.now();
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${deviceId}_${timestamp}`,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

  private async getDeviceId(): Promise<string> {
    try {
      // Try to get stored device ID
      const stored = await Keychain.getInternetCredentials(`${this.keyPrefix}device_id`);
      
      if (stored && stored !== false) {
        return stored.password;
      }

      // Generate new device ID
      const deviceId = await Crypto.randomUUID();
      await Keychain.setInternetCredentials(
        `${this.keyPrefix}device_id`,
        'device',
        deviceId
      );

      return deviceId;
    } catch (error) {
      console.error('Failed to get/generate device ID:', error);
      // Fallback to a deterministic ID based on timestamp
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Date.now().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    }
  }

  // Encryption helpers for Tier 2 storage
  private async encryptData(data: string): Promise<string> {
    try {
      // In a production environment, you would use a more sophisticated encryption scheme
      // For now, we'll use a simple base64 encoding with a device-specific salt
      const deviceId = await this.getDeviceId();
      const salt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        deviceId,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      // Simple XOR encryption with salt (not cryptographically secure, but better than plaintext)
      const encrypted = this.xorEncrypt(data, salt);
      return Buffer.from(encrypted).toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to base64 encoding
      return Buffer.from(data).toString('base64');
    }
  }

  private async decryptData(encryptedData: string): Promise<string> {
    try {
      const decoded = Buffer.from(encryptedData, 'base64').toString();
      const deviceId = await this.getDeviceId();
      const salt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        deviceId,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      return this.xorEncrypt(decoded, salt); // XOR is symmetric
    } catch (error) {
      console.error('Decryption failed:', error);
      // Fallback to base64 decoding
      return Buffer.from(encryptedData, 'base64').toString();
    }
  }

  private xorEncrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }

  // Emergency wipe for panic mode
  async emergencyWipe(): Promise<void> {
    try {
      // Clear all keychain entries
      await Keychain.resetInternetCredentials(`${this.keyPrefix}user_credentials`);
      await Keychain.resetInternetCredentials(`${this.keyPrefix}device_id`);
      
      // Clear session
      this.sessionToken = null;
      this.sessionExpiry = null;
      
      AuditService.getInstance().log('panic_wipe', 'Emergency wipe completed - all secrets cleared');
    } catch (error) {
      console.error('Emergency wipe failed:', error);
    }
  }
}

export default SecretsManager.getInstance();