// This file exports all types from the TurboModules
export type * from './AIProcessorModule';
export type * from './VoiceProcessorModule';
export type * from './PrivacyModule';
export type * from './LocalLLMModule';
export type * from './LocalEmbeddingModule';
export type * from './ReActToolsModule';

// Common types used across modules
export interface ModelInfo {
  name: string;
  size: number;
  version: string;
  capabilities: string[];
  loaded: boolean;
}

export interface GenerationResult {
  token: string;
  finished: boolean;
  error?: string;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stateId?: string;
}