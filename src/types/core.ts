export interface AssistantMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface MemoryEntry {
  id: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface AuditEvent {
  id: string;
  action: AuditAction;
  detail: string;
  timestamp: Date;
}

export enum AuditAction {
  MODEL_UPGRADE = 'model_upgrade',
  PLUGIN_INSTALLED = 'plugin_installed',
  PLUGIN_EXECUTED = 'plugin_executed',
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_DENIED = 'consent_denied',
  MEMORY_WRITE = 'memory_write',
  MEMORY_DELETE = 'memory_delete',
  PANIC_WIPE = 'panic_wipe',
  SETTINGS_CHANGE = 'settings_change',
  AUTHENTICATION_SUCCESS = 'auth_success',
  AUTHENTICATION_FAILED = 'auth_failed',
  UNKNOWN = 'unknown'
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  permissions: string[];
  intents: string[];
  enabled: boolean;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
}