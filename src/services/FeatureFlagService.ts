import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
  targetGroups?: string[];
}

export enum FeatureFlags {
  // Core AI Features
  LOCAL_LLM = 'local_llm',
  STREAMING_RESPONSES = 'streaming_responses',
  CONTEXT_MEMORY = 'context_memory',
  
  // Voice & Audio
  VOICE_WAKE_WORD = 'voice_wake_word',
  CONTINUOUS_LISTENING = 'continuous_listening',
  VOICE_COMMANDS = 'voice_commands',
  
  // Sensor & Vision
  SENSOR_PIPELINE = 'sensor_pipeline',
  COMPUTER_VISION = 'computer_vision',
  LOCATION_CONTEXT = 'location_context',
  
  // Automation & Proactivity
  BACKGROUND_TASKS = 'background_tasks',
  PROACTIVE_SUGGESTIONS = 'proactive_suggestions',
  CUSTOM_AUTOMATIONS = 'custom_automations',
  
  // Privacy & Security
  STRICT_LOCAL_MODE = 'strict_local_mode',
  ENHANCED_ENCRYPTION = 'enhanced_encryption',
  AUDIT_LOGGING = 'audit_logging',
  
  // UI/UX Experiments
  DARK_MODE = 'dark_mode',
  INTERACTIVE_ONBOARDING = 'interactive_onboarding',
  ADVANCED_SETTINGS = 'advanced_settings',
  
  // Development & Testing
  DEBUG_MODE = 'debug_mode',
  PERFORMANCE_MONITORING = 'performance_monitoring',
  MOCK_AUTHENTICATION = 'mock_authentication'
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<string, FeatureFlag> = new Map();
  private userId: string | null = null;
  private initialized = false;

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  private constructor() {
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      // Core AI - Enabled for production
      { key: FeatureFlags.STREAMING_RESPONSES, enabled: true, description: 'Real-time streaming AI responses' },
      { key: FeatureFlags.CONTEXT_MEMORY, enabled: true, description: 'Long-term conversation memory' },
      
      // Local LLM - Behind flag for beta testing
      { key: FeatureFlags.LOCAL_LLM, enabled: false, description: 'On-device LLM processing', rolloutPercentage: 20 },
      
      // Voice features - Beta
      { key: FeatureFlags.VOICE_COMMANDS, enabled: true, description: 'Voice input for commands' },
      { key: FeatureFlags.VOICE_WAKE_WORD, enabled: false, description: 'Wake word activation', rolloutPercentage: 10 },
      { key: FeatureFlags.CONTINUOUS_LISTENING, enabled: false, description: 'Always-on listening mode' },
      
      // Sensor pipeline - Development
      { key: FeatureFlags.SENSOR_PIPELINE, enabled: false, description: 'Real-time sensor data processing' },
      { key: FeatureFlags.COMPUTER_VISION, enabled: false, description: 'On-device vision processing' },
      { key: FeatureFlags.LOCATION_CONTEXT, enabled: false, description: 'Location-aware features' },
      
      // Automation - Beta
      { key: FeatureFlags.BACKGROUND_TASKS, enabled: false, description: 'Background processing tasks', rolloutPercentage: 15 },
      { key: FeatureFlags.PROACTIVE_SUGGESTIONS, enabled: false, description: 'Proactive AI suggestions' },
      { key: FeatureFlags.CUSTOM_AUTOMATIONS, enabled: false, description: 'User-defined automation rules' },
      
      // Privacy features - Production ready
      { key: FeatureFlags.STRICT_LOCAL_MODE, enabled: true, description: 'Strict on-device processing mode' },
      { key: FeatureFlags.ENHANCED_ENCRYPTION, enabled: true, description: 'Enhanced data encryption' },
      { key: FeatureFlags.AUDIT_LOGGING, enabled: true, description: 'Comprehensive audit logging' },
      
      // UI/UX
      { key: FeatureFlags.DARK_MODE, enabled: false, description: 'Dark theme support' },
      { key: FeatureFlags.INTERACTIVE_ONBOARDING, enabled: true, description: 'Interactive onboarding flow' },
      { key: FeatureFlags.ADVANCED_SETTINGS, enabled: true, description: 'Advanced configuration options' },
      
      // Development
      { key: FeatureFlags.DEBUG_MODE, enabled: __DEV__, description: 'Debug logging and tools' },
      { key: FeatureFlags.PERFORMANCE_MONITORING, enabled: true, description: 'Performance metrics collection' },
      { key: FeatureFlags.MOCK_AUTHENTICATION, enabled: __DEV__, description: 'Mock biometric authentication' }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }

  async initialize(userId?: string): Promise<void> {
    this.userId = userId || 'anonymous';
    
    try {
      // Load any overrides from local storage
      const storedFlags = await AsyncStorage.getItem('feature_flags_override');
      if (storedFlags) {
        const overrides = JSON.parse(storedFlags) as Record<string, boolean>;
        Object.entries(overrides).forEach(([key, enabled]) => {
          const flag = this.flags.get(key);
          if (flag) {
            this.flags.set(key, { ...flag, enabled });
          }
        });
      }

      // In a real implementation, you would fetch remote flags here
      // await this.fetchRemoteFlags();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
      this.initialized = true; // Continue with defaults
    }
  }

  isEnabled(flagKey: FeatureFlags): boolean {
    if (!this.initialized) {
      console.warn(`Feature flag ${flagKey} checked before initialization`);
      return false;
    }

    const flag = this.flags.get(flagKey);
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return false;
    }

    // Check rollout percentage if specified
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(this.userId || '');
      const userPercentile = hash % 100;
      return flag.enabled && userPercentile < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  async setFlagOverride(flagKey: FeatureFlags, enabled: boolean): Promise<void> {
    const flag = this.flags.get(flagKey);
    if (flag) {
      this.flags.set(flagKey, { ...flag, enabled });
      
      // Persist override
      try {
        const overrides = await this.getStoredOverrides();
        overrides[flagKey] = enabled;
        await AsyncStorage.setItem('feature_flags_override', JSON.stringify(overrides));
      } catch (error) {
        console.error('Failed to persist flag override:', error);
      }
    }
  }

  async clearFlagOverride(flagKey: FeatureFlags): Promise<void> {
    try {
      const overrides = await this.getStoredOverrides();
      delete overrides[flagKey];
      await AsyncStorage.setItem('feature_flags_override', JSON.stringify(overrides));
      
      // Reset to default
      this.initializeDefaultFlags();
      await this.initialize(this.userId || undefined);
    } catch (error) {
      console.error('Failed to clear flag override:', error);
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFlag(flagKey: FeatureFlags): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  private async getStoredOverrides(): Promise<Record<string, boolean>> {
    try {
      const stored = await AsyncStorage.getItem('feature_flags_override');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Development helper methods
  async enableAllFlags(): Promise<void> {
    if (!__DEV__) return;
    
    const overrides: Record<string, boolean> = {};
    this.flags.forEach((flag, key) => {
      overrides[key] = true;
    });
    
    await AsyncStorage.setItem('feature_flags_override', JSON.stringify(overrides));
    await this.initialize(this.userId || undefined);
  }

  async resetAllFlags(): Promise<void> {
    if (!__DEV__) return;
    
    await AsyncStorage.removeItem('feature_flags_override');
    this.initializeDefaultFlags();
    await this.initialize(this.userId || undefined);
  }
}

export default FeatureFlagService.getInstance();