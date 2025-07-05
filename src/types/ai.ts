/**
 * Comprehensive AI and Service Types for Native-monGARS
 * Production-grade TypeScript interfaces for all services
 */

// =============================================================================
// Legacy Types (keeping for compatibility)
// =============================================================================

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIService {
  chat(messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse>;
  complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse>;
}

// =============================================================================
// Core LLM Types
// =============================================================================

export interface LLMResponse {
  text: string;
  tokens: number;
  processingTime: number;
  source: 'local' | 'cloud';
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  useCloudFallback?: boolean;
  stopSequences?: string[];
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface StreamingLLMResponse extends LLMResponse {
  isPartial: boolean;
  isDone: boolean;
  totalTokens?: number;
}

// =============================================================================
// RAG & Vector Search Types
// =============================================================================

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  timestamp?: number;
  source?: string;
}

export interface RetrievalResult {
  id: string;
  score: number;
  content?: string;
  metadata?: Record<string, any>;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  tokens: number;
  processingTime: number;
}

export interface RAGQuery {
  query: string;
  topK?: number;
  threshold?: number;
  filters?: Record<string, any>;
}

export interface RAGResponse {
  results: RetrievalResult[];
  query: string;
  totalResults: number;
  processingTime: number;
}

// =============================================================================
// Agent & ReAct Types
// =============================================================================

export interface AgentAction {
  tool: string;
  params: Record<string, any>;
  reasoning?: string;
}

export interface AgentConfig {
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  maxSteps?: number;
  systemPrompt?: string;
}

export interface AgentStep {
  type: 'thought' | 'action' | 'observation' | 'answer';
  content: string;
  timestamp: number;
  toolUsed?: string;
  result?: any;
  error?: string;
}

export interface AgentResponse {
  answer: string;
  steps: AgentStep[];
  totalSteps: number;
  processingTime: number;
  toolsUsed: string[];
}

// =============================================================================
// Tool Services Types
// =============================================================================

export interface CalendarParams {
  title: string;
  startDate: string; // ISO 8601
  endDate?: string;
  location?: string;
  notes?: string;
  allDay?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  notes?: string;
  allDay: boolean;
  attendees?: string[];
}

export interface ContactLookupParams {
  name?: string;
  phone?: string;
  email?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
}

export interface FileReadParams {
  path: string;
  encoding?: 'utf8' | 'base64';
}

export interface FileWriteParams {
  path: string;
  content: string;
  encoding?: 'utf8' | 'base64';
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
  modifiedDate: string;
  isDirectory: boolean;
}

// =============================================================================
// Voice & Audio Types
// =============================================================================

export interface SpeechPartial {
  text: string;
  confidence: number;
  timestamp: number;
}

export interface SpeechFinal {
  text: string;
  confidence: number;
  duration: number;
  language?: string;
}

export interface VoiceConfig {
  wakeWord?: string;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxRecordingTime?: number;
  sensitivity?: number;
  timeout?: number;
}

export interface WakeWordEvent {
  detected: boolean;
  confidence: number;
  timestamp: number;
  wakeWord: string;
}

export interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

// =============================================================================
// Message & Conversation Types
// =============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    toolsUsed?: string[];
    source?: 'local' | 'cloud';
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

// =============================================================================
// Error & Status Types
// =============================================================================

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  service: string;
}

export interface ServiceStatus {
  initialized: boolean;
  available: boolean;
  lastError?: ServiceError;
  version?: string;
  modelInfo?: {
    name: string;
    version: string;
    size: string;
    quantization?: string;
  };
}

// =============================================================================
// Native Module Bridge Types
// =============================================================================

export interface NativeLLMBridge {
  initializeModel(modelName: string): Promise<void>;
  generate(prompt: string, maxTokens: number, temperature: number): Promise<void>;
  stopGeneration(): Promise<void>;
  getModelInfo(): Promise<{ name: string; version: string; size: string }>;
  isAvailable(): Promise<boolean>;
}

export interface NativeEmbeddingBridge {
  embed(text: string): Promise<number[]>;
  batchEmbed(texts: string[]): Promise<number[][]>;
  getModelInfo(): Promise<{ name: string; dimensions: number }>;
}

export interface NativeVoiceBridge {
  start(): Promise<void>;
  stop(): Promise<void>;
  setConfig(config: VoiceConfig): Promise<void>;
  isListening(): Promise<boolean>;
}

export interface NativeCalendarBridge {
  createEvent(
    title: string,
    startDate: string,
    endDate: string,
    location: string,
    notes: string
  ): Promise<string>;
  getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]>;
  deleteEvent(eventId: string): Promise<boolean>;
}

export interface NativeContactsBridge {
  lookupContact(name: string, phone: string): Promise<Contact>;
  getAllContacts(): Promise<Contact[]>;
  createContact(contact: Partial<Contact>): Promise<string>;
}

export interface NativeFileBridge {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<boolean>;
  getFileInfo(path: string): Promise<FileInfo>;
  listDirectory(path: string): Promise<FileInfo[]>;
}

// =============================================================================
// Utility Types
// =============================================================================

export interface TokenizerResult {
  tokens: number[];
  count: number;
}

export interface ModelCapabilities {
  maxContextLength: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportedLanguages: string[];
  quantization?: string;
}

// =============================================================================
// State Management Types
// =============================================================================

export interface AppState {
  conversations: Conversation[];
  currentConversationId?: string;
  settings: {
    preferredModel: string;
    temperature: number;
    maxTokens: number;
    wakeWordEnabled: boolean;
    voiceLanguage: string;
  };
  serviceStatus: {
    llm: ServiceStatus;
    rag: ServiceStatus;
    voice: ServiceStatus;
    agent: ServiceStatus;
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentResponse?: string;
  error?: string;
}

export interface VoiceState {
  isListening: boolean;
  isWakeWordActive: boolean;
  currentTranscript: string;
  partialTranscript: string;
  confidence: number;
  error?: string;
}

// =============================================================================
// Voice Pipeline Types
// =============================================================================

// VoiceConfig is already defined above

export interface VoiceResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  processingTime: number;
  timestamp: number;
}

export interface WakeWordEvent {
  detected: boolean;
  confidence: number;
  timestamp: number;
  wakeWord: string;
}

export interface TTSConfig {
  language: string;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface TTSResult {
  text: string;
  duration: number;
  success: boolean;
  language: string;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  bufferSize: number;
}

export interface VoiceProcessingMetrics {
  totalSessions: number;
  averageLatency: number;
  successRate: number;
  wakeWordAccuracy: number;
}

export type VoiceEventType = 'start' | 'result' | 'end' | 'error' | 'wakeword' | 'tts_start' | 'tts_complete';