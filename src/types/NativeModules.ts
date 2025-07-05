/**
 * Native iOS Turbo Module Specifications for monGARS
 * Advanced native functionality with Core ML, Vector Search, and iOS integrations
 */

import { TurboModule, TurboModuleRegistry } from 'react-native';

// Wake Word Detection Module
export interface WakeWordDetectionSpec extends TurboModule {
  // Core wake word functionality
  startWakeWordDetection(sensitivity: number, keywords: string[]): Promise<boolean>;
  stopWakeWordDetection(): Promise<void>;
  isListening(): Promise<boolean>;
  
  // Configuration
  setSensitivity(sensitivity: number): Promise<void>;
  setWakeWords(words: string[]): Promise<void>;
  enableNoiseReduction(enabled: boolean): Promise<void>;
  
  // Advanced features
  trainCustomWakeWord(audioSamples: string[], label: string): Promise<boolean>;
  getDetectionAccuracy(): Promise<number>;
  exportModel(): Promise<string>;
  importModel(modelPath: string): Promise<boolean>;
  
  // Events
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// Local LLM Module (Llama 3.2 3B Core ML)
export interface LocalLLMSpec extends TurboModule {
  // Model management
  loadModel(modelName: string): Promise<boolean>;
  unloadModel(): Promise<void>;
  isModelLoaded(): Promise<boolean>;
  getModelInfo(): Promise<ModelInfo>;
  
  // Stateful inference with KV-cache
  initializeState(): Promise<string>; // Returns state ID
  generateToken(stateId: string, inputTokens: number[]): Promise<GenerationResult>;
  resetState(stateId: string): Promise<void>;
  destroyState(stateId: string): Promise<void>;
  
  // Streaming generation
  generateStream(prompt: string, options?: GenerationOptions): Promise<string>; // Returns session ID
  cancelGeneration(sessionId: string): Promise<void>;
  
  // Model configuration
  setComputeUnits(units: 'cpu' | 'gpu' | 'ane' | 'all'): Promise<void>;
  setMaxSequenceLength(length: number): Promise<void>;
  setQuantizationBits(bits: 4 | 8 | 16): Promise<void>;
  
  // Events for streaming
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export interface ModelInfo {
  name: string;
  version: string;
  memoryUsage: number;
  computeUnits: string[];
  maxSequenceLength: number;
  vocabularySize: number;
}

export interface GenerationResult {
  tokenId: number;
  token: string;
  logits: number[];
  isEndOfSequence: boolean;
  processingTime: number;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  stopTokens?: string[];
  systemPrompt?: string;
}

// Local Embedding Module for RAG
export interface LocalEmbeddingSpec extends TurboModule {
  // Embedding generation
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  
  // Model configuration
  loadEmbeddingModel(modelName: string): Promise<boolean>;
  getEmbeddingDimensions(): Promise<number>;
  getMaxTokenLength(): Promise<number>;
}

// Vector Store Module for RAG
export interface VectorStoreSpec extends TurboModule {
  // Core vector operations
  initialize(dimensions: number, indexType: string): Promise<boolean>;
  addVectors(vectors: number[][], metadata: object[]): Promise<string[]>;
  search(queryVector: number[], topK: number, threshold?: number): Promise<VectorSearchResult[]>;
  
  // Advanced operations
  upsertVectors(ids: string[], vectors: number[][], metadata: object[]): Promise<void>;
  deleteVectors(ids: string[]): Promise<void>;
  updateMetadata(id: string, metadata: object): Promise<void>;
  
  // Batch operations
  batchSearch(queries: number[][], topK: number): Promise<VectorSearchResult[][]>;
  bulkInsert(data: VectorBulkData[]): Promise<string[]>;
  
  // Index management
  buildIndex(): Promise<void>;
  optimizeIndex(): Promise<void>;
  getIndexStats(): Promise<IndexStats>;
  
  // Persistence
  saveIndex(path: string): Promise<boolean>;
  loadIndex(path: string): Promise<boolean>;
  
  // Advanced features
  clusterVectors(numClusters: number): Promise<ClusterResult[]>;
  findSimilarClusters(queryVector: number[], threshold: number): Promise<string[]>;
  getDimensions(): Promise<number>;
  getVectorCount(): Promise<number>;
}

// Speech Synthesis Module
export interface SpeechSynthesisSpec extends TurboModule {
  // Core synthesis
  speak(text: string, voice?: string, rate?: number, pitch?: number): Promise<void>;
  stopSpeaking(): Promise<void>;
  pauseSpeaking(): Promise<void>;
  resumeSpeaking(): Promise<void>;
  
  // Voice management
  getAvailableVoices(): Promise<Voice[]>;
  setDefaultVoice(voiceId: string): Promise<void>;
  downloadVoice(voiceId: string): Promise<boolean>;
  
  // Advanced features
  speakSSML(ssml: string): Promise<void>;
  synthesizeToFile(text: string, outputPath: string, voice?: string): Promise<string>;
  getAudioDuration(text: string, voice?: string): Promise<number>;
  
  // Real-time synthesis
  startStreamSynthesis(voice?: string): Promise<string>; // Returns stream ID
  addTextToStream(streamId: string, text: string): Promise<void>;
  endStreamSynthesis(streamId: string): Promise<void>;
  
  // Configuration
  setSpeechRate(rate: number): Promise<void>;
  setPitch(pitch: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  
  // Events
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// File Manager Module
export interface FileManagerSpec extends TurboModule {
  // Advanced file operations
  createSecureDirectory(path: string, permissions: number): Promise<boolean>;
  moveToSecureContainer(sourcePath: string, containerName: string): Promise<string>;
  encryptFile(filePath: string, key: string): Promise<string>;
  decryptFile(encryptedPath: string, key: string): Promise<string>;
  
  // Metadata operations
  setExtendedAttributes(path: string, attributes: Record<string, string>): Promise<void>;
  getExtendedAttributes(path: string): Promise<Record<string, string>>;
  addFileToSpotlight(path: string, searchableAttributes: Record<string, string>): Promise<void>;
  
  // Cloud integration
  enableiCloudSync(path: string): Promise<boolean>;
  downloadFromiCloud(path: string): Promise<void>;
  getiCloudStatus(path: string): Promise<iCloudStatus>;
  
  // Advanced search
  searchFiles(query: string, searchPath: string, includeContent: boolean): Promise<FileSearchResult[]>;
  findDuplicateFiles(directoryPath: string): Promise<DuplicateGroup[]>;
  
  // File watching
  watchDirectory(path: string, recursive: boolean): Promise<string>; // Returns watcher ID
  stopWatching(watcherId: string): Promise<void>;
  
  // Batch operations
  batchCopy(operations: FileCopyOperation[]): Promise<BatchResult[]>;
  batchDelete(paths: string[]): Promise<BatchResult[]>;
  
  // System integration
  addToPhotosLibrary(imagePath: string): Promise<string>;
  shareFile(path: string, options: ShareOptions): Promise<void>;
  openWithExternalApp(path: string, appIdentifier?: string): Promise<boolean>;
  
  // Events
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// Machine Learning Module
export interface MLProcessingSpec extends TurboModule {
  // Model management
  loadCoreMLModel(modelPath: string, modelId: string): Promise<boolean>;
  unloadModel(modelId: string): Promise<void>;
  getLoadedModels(): Promise<string[]>;
  
  // Text processing
  processText(modelId: string, text: string, options?: MLTextOptions): Promise<MLTextResult>;
  generateEmbeddings(modelId: string, texts: string[]): Promise<number[][]>;
  classifyText(modelId: string, text: string): Promise<ClassificationResult[]>;
  
  // Audio processing
  processAudio(modelId: string, audioPath: string, options?: any): Promise<any>;
  detectSpeech(audioPath: string): Promise<any>;
  identifySpeaker(audioPath: string, referenceVoices: string[]): Promise<any>;
  
  // Image processing
  processImage(modelId: string, imagePath: string, options?: any): Promise<any>;
  detectObjects(imagePath: string): Promise<any[]>;
  recognizeFaces(imagePath: string): Promise<any[]>;
  
  // Custom model training
  startTraining(config: any): Promise<string>; // Returns training session ID
  addTrainingData(sessionId: string, data: any[]): Promise<void>;
  trainModel(sessionId: string): Promise<any>;
  evaluateModel(modelId: string, testData: any[]): Promise<any>;
  
  // Performance monitoring
  getModelPerformance(modelId: string): Promise<any>;
  profileModelInference(modelId: string, inputData: any): Promise<any>;
  
  // Events
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// Calendar Integration Module
export interface CalendarIntegrationSpec extends TurboModule {
  // Advanced calendar operations
  createSmartEvent(
    title: string,
    naturalLanguageDescription: string,
    suggestedTime?: string
  ): Promise<CalendarEvent>;
  
  analyzeEventConflicts(proposedEvent: CalendarEvent): Promise<ConflictAnalysis>;
  suggestOptimalMeetingTimes(
    participants: string[],
    duration: number,
    preferences: any
  ): Promise<TimeSlot[]>;
  
  // AI-powered features
  extractEventsFromText(text: string): Promise<CalendarEvent[]>;
  generateEventSummary(eventIds: string[]): Promise<string>;
  predictEventDuration(eventDescription: string): Promise<number>;
  
  // Integration features
  syncWithExternalCalendar(calendarId: string, provider: string): Promise<boolean>;
  exportToICS(eventIds: string[]): Promise<string>;
  importFromICS(icsData: string): Promise<CalendarEvent[]>;
  
  // Smart notifications
  setIntelligentReminders(eventId: string, context: any): Promise<void>;
  analyzeAttendancePatterns(userId: string): Promise<any>;
  
  // Events
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// Supporting Types
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: object;
  vector?: number[];
}

export interface VectorBulkData {
  id?: string;
  vector: number[];
  metadata: object;
}

export interface IndexStats {
  vectorCount: number;
  dimensions: number;
  indexSize: number;
  lastUpdated: number;
  memoryUsage: number;
}

export interface ClusterResult {
  clusterId: string;
  center: number[];
  vectorIds: string[];
  inertia: number;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  quality: 'standard' | 'enhanced' | 'premium';
  isDownloaded: boolean;
  size?: number;
}

export interface iCloudStatus {
  isInCloud: boolean;
  isDownloaded: boolean;
  downloadProgress?: number;
  cloudIdentifier?: string;
}

export interface FileSearchResult {
  path: string;
  name: string;
  size: number;
  modifiedDate: string;
  contentMatches?: string[];
  relevanceScore: number;
}

export interface DuplicateGroup {
  files: string[];
  size: number;
  hash: string;
}

export interface FileCopyOperation {
  sourcePath: string;
  destinationPath: string;
  overwrite?: boolean;
}

export interface BatchResult {
  success: boolean;
  path: string;
  error?: string;
}

export interface ShareOptions {
  subject?: string;
  message?: string;
  excludedActivityTypes?: string[];
}

export interface MLTextOptions {
  maxLength?: number;
  temperature?: number;
  topK?: number;
}

export interface MLTextResult {
  text: string;
  confidence: number;
  processingTime: number;
  tokens?: number;
}

export interface ClassificationResult {
  label: string;
  confidence: number;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  location?: string;
  attendees?: string[];
  reminders?: number[];
}

export interface ConflictAnalysis {
  hasConflicts: boolean;
  conflicts: CalendarEvent[];
  suggestions: string[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  confidence: number;
  attendeeAvailability: Record<string, boolean>;
}

// ReAct Tools Module for LLM tool use  
export interface ReActToolsSpec extends TurboModule {
  // Calendar operations
  createCalendarEvent(params: object): Promise<object>;
  getCalendarEvents(params: object): Promise<object[]>;
  
  // Contact operations
  searchContacts(params: object): Promise<object[]>;
  createContact(params: object): Promise<object>;
  
  // File operations
  listFiles(params: object): Promise<object[]>;
  readFile(params: object): Promise<object>;
  writeFile(params: object): Promise<object>;
  searchFiles(params: object): Promise<object[]>;
}

// Native module getters
export const WakeWordDetection = TurboModuleRegistry.getEnforcing<WakeWordDetectionSpec>('WakeWordDetection');
export const VectorStore = TurboModuleRegistry.getEnforcing<VectorStoreSpec>('VectorStore');
export const SpeechSynthesis = TurboModuleRegistry.getEnforcing<SpeechSynthesisSpec>('SpeechSynthesis');
export const FileManager = TurboModuleRegistry.getEnforcing<FileManagerSpec>('FileManager');
export const MLProcessing = TurboModuleRegistry.getEnforcing<MLProcessingSpec>('MLProcessing');
export const CalendarIntegration = TurboModuleRegistry.getEnforcing<CalendarIntegrationSpec>('CalendarIntegration');