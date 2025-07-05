/**
 * NativeModulesService.ts
 * Service layer for native iOS modules with proper error handling and fallbacks
 */

import { NativeModules, NativeEventEmitter } from 'react-native';
import { 
  WakeWordDetection, 
  VectorStore, 
  SpeechSynthesis, 
  FileManager as NativeFileManager,
  MLProcessing,
  CalendarIntegration 
} from '../types/NativeModules';

// Native module instances with fallbacks
const WakeWord = NativeModules.WakeWordDetection || null;
const VectorDB = NativeModules.VectorStore || null;
const Speech = NativeModules.SpeechSynthesis || null;
const NativeFiles = NativeModules.FileManager || null;
const ML = NativeModules.MLProcessing || null;
const Calendar = NativeModules.CalendarIntegration || null;

// Event emitters
const wakeWordEmitter = WakeWord ? new NativeEventEmitter(WakeWord) : null;
const speechEmitter = Speech ? new NativeEventEmitter(Speech) : null;
const fileEmitter = NativeFiles ? new NativeEventEmitter(NativeFiles) : null;

export class NativeModulesService {
  private static instance: NativeModulesService;
  
  // Module availability
  public readonly isWakeWordAvailable = !!WakeWord;
  public readonly isVectorStoreAvailable = !!VectorDB;
  public readonly isSpeechSynthesisAvailable = !!Speech;
  public readonly isFileManagerAvailable = !!NativeFiles;
  public readonly isMLProcessingAvailable = !!ML;
  public readonly isCalendarIntegrationAvailable = !!Calendar;

  static getInstance(): NativeModulesService {
    if (!NativeModulesService.instance) {
      NativeModulesService.instance = new NativeModulesService();
    }
    return NativeModulesService.instance;
  }

  // MARK: - Wake Word Detection

  async startWakeWordDetection(sensitivity: number = 0.8, keywords: string[] = ['hey mongars']): Promise<boolean> {
    if (!this.isWakeWordAvailable) {
      console.warn('Wake word detection not available on this platform');
      return false;
    }

    try {
      return await WakeWord.startWakeWordDetection(sensitivity, keywords);
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      return false;
    }
  }

  async stopWakeWordDetection(): Promise<void> {
    if (!this.isWakeWordAvailable) return;
    
    try {
      await WakeWord.stopWakeWordDetection();
    } catch (error) {
      console.error('Failed to stop wake word detection:', error);
    }
  }

  onWakeWordDetected(callback: (data: any) => void): () => void {
    if (!wakeWordEmitter) {
      return () => {}; // No-op cleanup function
    }

    const subscription = wakeWordEmitter.addListener('onWakeWordDetected', callback);
    return () => subscription.remove();
  }

  async trainCustomWakeWord(audioSamples: string[], label: string): Promise<boolean> {
    if (!this.isWakeWordAvailable) {
      throw new Error('Wake word detection not available');
    }

    try {
      return await WakeWord.trainCustomWakeWord(audioSamples, label);
    } catch (error) {
      console.error('Failed to train custom wake word:', error);
      throw error;
    }
  }

  // MARK: - Vector Store Operations

  async initializeVectorStore(dimensions: number, indexType: string = 'FLAT_L2'): Promise<boolean> {
    if (!this.isVectorStoreAvailable) {
      console.warn('Vector store not available, falling back to JavaScript implementation');
      return false;
    }

    try {
      return await VectorDB.initialize(dimensions, indexType);
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      return false;
    }
  }

  async addVectors(vectors: number[][], metadata: object[]): Promise<string[]> {
    if (!this.isVectorStoreAvailable) {
      throw new Error('Vector store not available');
    }

    try {
      return await VectorDB.addVectors(vectors, metadata);
    } catch (error) {
      console.error('Failed to add vectors:', error);
      throw error;
    }
  }

  async searchVectors(queryVector: number[], topK: number = 10, threshold?: number): Promise<any[]> {
    if (!this.isVectorStoreAvailable) {
      throw new Error('Vector store not available');
    }

    try {
      return await VectorDB.search(queryVector, topK, threshold);
    } catch (error) {
      console.error('Failed to search vectors:', error);
      throw error;
    }
  }

  async clusterVectors(numClusters: number): Promise<any[]> {
    if (!this.isVectorStoreAvailable) {
      throw new Error('Vector store not available');
    }

    try {
      return await VectorDB.clusterVectors(numClusters);
    } catch (error) {
      console.error('Failed to cluster vectors:', error);
      throw error;
    }
  }

  async getVectorStoreStats(): Promise<any> {
    if (!this.isVectorStoreAvailable) {
      return {
        vectorCount: 0,
        dimensions: 0,
        indexSize: 0,
        memoryUsage: 0
      };
    }

    try {
      return await VectorDB.getIndexStats();
    } catch (error) {
      console.error('Failed to get vector store stats:', error);
      return null;
    }
  }

  // MARK: - Speech Synthesis

  async speak(text: string, options: {
    voice?: string;
    rate?: number;
    pitch?: number;
  } = {}): Promise<string> {
    if (!this.isSpeechSynthesisAvailable) {
      throw new Error('Speech synthesis not available');
    }

    try {
      return await Speech.speak(text, options.voice, options.rate, options.pitch);
    } catch (error) {
      console.error('Failed to speak text:', error);
      throw error;
    }
  }

  async stopSpeaking(): Promise<void> {
    if (!this.isSpeechSynthesisAvailable) return;

    try {
      await Speech.stopSpeaking();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }

  async getAvailableVoices(): Promise<any[]> {
    if (!this.isSpeechSynthesisAvailable) {
      return [];
    }

    try {
      return await Speech.getAvailableVoices();
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  async synthesizeToFile(text: string, outputPath: string, voice?: string): Promise<string> {
    if (!this.isSpeechSynthesisAvailable) {
      throw new Error('Speech synthesis not available');
    }

    try {
      return await Speech.synthesizeToFile(text, outputPath, voice);
    } catch (error) {
      console.error('Failed to synthesize to file:', error);
      throw error;
    }
  }

  onSpeechEvent(eventName: string, callback: (data: any) => void): () => void {
    if (!speechEmitter) {
      return () => {};
    }

    const subscription = speechEmitter.addListener(eventName, callback);
    return () => subscription.remove();
  }

  // MARK: - File Management

  async createSecureDirectory(path: string, permissions: number = 0o755): Promise<boolean> {
    if (!this.isFileManagerAvailable) {
      throw new Error('File manager not available');
    }

    try {
      return await NativeFiles.createSecureDirectory(path, permissions);
    } catch (error) {
      console.error('Failed to create secure directory:', error);
      throw error;
    }
  }

  async encryptFile(filePath: string, key: string): Promise<string> {
    if (!this.isFileManagerAvailable) {
      throw new Error('File manager not available');
    }

    try {
      return await NativeFiles.encryptFile(filePath, key);
    } catch (error) {
      console.error('Failed to encrypt file:', error);
      throw error;
    }
  }

  async searchFiles(query: string, searchPath: string, includeContent: boolean = false): Promise<any[]> {
    if (!this.isFileManagerAvailable) {
      throw new Error('File manager not available');
    }

    try {
      return await NativeFiles.searchFiles(query, searchPath, includeContent);
    } catch (error) {
      console.error('Failed to search files:', error);
      throw error;
    }
  }

  async findDuplicateFiles(directoryPath: string): Promise<any[]> {
    if (!this.isFileManagerAvailable) {
      throw new Error('File manager not available');
    }

    try {
      return await NativeFiles.findDuplicateFiles(directoryPath);
    } catch (error) {
      console.error('Failed to find duplicate files:', error);
      throw error;
    }
  }

  async batchCopyFiles(operations: {
    sourcePath: string;
    destinationPath: string;
    overwrite?: boolean;
  }[]): Promise<any[]> {
    if (!this.isFileManagerAvailable) {
      throw new Error('File manager not available');
    }

    try {
      return await NativeFiles.batchCopy(operations);
    } catch (error) {
      console.error('Failed to batch copy files:', error);
      throw error;
    }
  }

  async addToPhotosLibrary(imagePath: string): Promise<string> {
    if (!this.isFileManagerAvailable) {
      throw new Error('File manager not available');
    }

    try {
      return await NativeFiles.addToPhotosLibrary(imagePath);
    } catch (error) {
      console.error('Failed to add to photos library:', error);
      throw error;
    }
  }

  async shareFile(path: string, options: {
    subject?: string;
    message?: string;
    excludedActivityTypes?: string[];
  } = {}): Promise<void> {
    if (!this.isFileManagerAvailable) {
      throw new Error('File manager not available');
    }

    try {
      await NativeFiles.shareFile(path, options);
    } catch (error) {
      console.error('Failed to share file:', error);
      throw error;
    }
  }

  // MARK: - Utility Methods

  getModuleAvailability(): {
    wakeWord: boolean;
    vectorStore: boolean;
    speechSynthesis: boolean;
    fileManager: boolean;
    mlProcessing: boolean;
    calendarIntegration: boolean;
  } {
    return {
      wakeWord: this.isWakeWordAvailable,
      vectorStore: this.isVectorStoreAvailable,
      speechSynthesis: this.isSpeechSynthesisAvailable,
      fileManager: this.isFileManagerAvailable,
      mlProcessing: this.isMLProcessingAvailable,
      calendarIntegration: this.isCalendarIntegrationAvailable,
    };
  }

  async testNativeModules(): Promise<{
    wakeWord: boolean;
    vectorStore: boolean;
    speechSynthesis: boolean;
    fileManager: boolean;
  }> {
    const results = {
      wakeWord: false,
      vectorStore: false,
      speechSynthesis: false,
      fileManager: false,
    };

    // Test wake word
    if (this.isWakeWordAvailable) {
      try {
        await WakeWord.isListening();
        results.wakeWord = true;
      } catch (error) {
        console.warn('Wake word module test failed:', error);
      }
    }

    // Test vector store
    if (this.isVectorStoreAvailable) {
      try {
        await this.initializeVectorStore(128);
        results.vectorStore = true;
      } catch (error) {
        console.warn('Vector store module test failed:', error);
      }
    }

    // Test speech synthesis
    if (this.isSpeechSynthesisAvailable) {
      try {
        await this.getAvailableVoices();
        results.speechSynthesis = true;
      } catch (error) {
        console.warn('Speech synthesis module test failed:', error);
      }
    }

    // Test file manager
    if (this.isFileManagerAvailable) {
      try {
        await this.searchFiles('test', '/tmp', false);
        results.fileManager = true;
      } catch (error) {
        console.warn('File manager module test failed:', error);
      }
    }

    return results;
  }

  // MARK: - Error Handling

  private handleNativeModuleError(error: any, moduleName: string, operation: string): never {
    const errorMessage = `${moduleName} ${operation} failed: ${error.message || error}`;
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
}

// Export singleton instance
export const nativeModules = NativeModulesService.getInstance();

// Export individual module access for convenience
export const WakeWordModule = {
  start: (sensitivity?: number, keywords?: string[]) => nativeModules.startWakeWordDetection(sensitivity, keywords),
  stop: () => nativeModules.stopWakeWordDetection(),
  onDetected: (callback: (data: any) => void) => nativeModules.onWakeWordDetected(callback),
  train: (samples: string[], label: string) => nativeModules.trainCustomWakeWord(samples, label),
};

export const VectorStoreModule = {
  initialize: (dimensions: number, type?: string) => nativeModules.initializeVectorStore(dimensions, type),
  add: (vectors: number[][], metadata: object[]) => nativeModules.addVectors(vectors, metadata),
  search: (query: number[], topK?: number, threshold?: number) => nativeModules.searchVectors(query, topK, threshold),
  cluster: (numClusters: number) => nativeModules.clusterVectors(numClusters),
  stats: () => nativeModules.getVectorStoreStats(),
};

export const SpeechModule = {
  speak: (text: string, options?: any) => nativeModules.speak(text, options),
  stop: () => nativeModules.stopSpeaking(),
  voices: () => nativeModules.getAvailableVoices(),
  toFile: (text: string, path: string, voice?: string) => nativeModules.synthesizeToFile(text, path, voice),
  onEvent: (event: string, callback: (data: any) => void) => nativeModules.onSpeechEvent(event, callback),
};

export const FileModule = {
  createDir: (path: string, permissions?: number) => nativeModules.createSecureDirectory(path, permissions),
  encrypt: (path: string, key: string) => nativeModules.encryptFile(path, key),
  search: (query: string, path: string, includeContent?: boolean) => nativeModules.searchFiles(query, path, includeContent),
  findDuplicates: (path: string) => nativeModules.findDuplicateFiles(path),
  batchCopy: (operations: any[]) => nativeModules.batchCopyFiles(operations),
  addToPhotos: (path: string) => nativeModules.addToPhotosLibrary(path),
  share: (path: string, options?: any) => nativeModules.shareFile(path, options),
};