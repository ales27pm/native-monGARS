import { coreMLService } from '../core-ml-service';
import { nativeLLMService } from '../native-llm-service';

// Mock the native service
jest.mock('../native-llm-service');

describe('CoreMLService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableModels', () => {
    it('should return available models', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: false,
          isLoaded: false
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);

      const models = await coreMLService.getAvailableModels();

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('llama-3.2-3b-instruct');
      expect(models[0].name).toBe('Llama 3.2 3B Instruct');
      expect(models[0].description).toContain('Meta\'s latest Llama 3.2 model');
      expect(models[0].capabilities).toContain('chat');
      expect(models[0].capabilities).toContain('reasoning');
    });

    it('should handle native service errors gracefully', async () => {
      (nativeLLMService.getAvailableModels as jest.Mock).mockRejectedValue(new Error('Native error'));

      const models = await coreMLService.getAvailableModels();

      // Should fall back to mock models
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('llama-3.2-3b-instruct');
    });
  });

  describe('downloadModel', () => {
    it('should download a model successfully', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: false,
          isLoaded: false
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);
      (nativeLLMService.downloadModel as jest.Mock).mockResolvedValue(undefined);

      await expect(coreMLService.downloadModel('llama-3.2-3b-instruct')).resolves.not.toThrow();
      expect(nativeLLMService.downloadModel).toHaveBeenCalledWith('llama-3.2-3b-instruct');
    });

    it('should reject download of non-existent model', async () => {
      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue([]);

      await expect(coreMLService.downloadModel('non-existent-model'))
        .rejects
        .toThrow('Model non-existent-model not found');
    });

    it('should reject download of already downloaded model', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: true, // Already downloaded
          isLoaded: false
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);

      await expect(coreMLService.downloadModel('llama-3.2-3b-instruct'))
        .rejects
        .toThrow('Model llama-3.2-3b-instruct is already downloaded');
    });
  });

  describe('activateModel', () => {
    it('should activate a downloaded model', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: true,
          isLoaded: false
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);
      (nativeLLMService.loadModel as jest.Mock).mockResolvedValue(undefined);

      await expect(coreMLService.activateModel('llama-3.2-3b-instruct')).resolves.not.toThrow();
      expect(nativeLLMService.loadModel).toHaveBeenCalledWith('llama-3.2-3b-instruct');
    });

    it('should reject activation of non-downloaded model', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: false, // Not downloaded
          isLoaded: false
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);

      await expect(coreMLService.activateModel('llama-3.2-3b-instruct'))
        .rejects
        .toThrow('Model llama-3.2-3b-instruct must be downloaded first');
    });
  });

  describe('generateResponse', () => {
    it('should generate response from active model', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: true,
          isLoaded: true // Active model
        }
      ];

      const mockResponse = {
        text: 'This is a test response',
        tokenCount: 5,
        processingTime: 0.5
      };

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);
      (nativeLLMService.generateText as jest.Mock).mockResolvedValue(mockResponse);

      const response = await coreMLService.generateResponse('Hello, world!');

      expect(response).toBe('This is a test response');
      expect(nativeLLMService.generateText).toHaveBeenCalledWith('Hello, world!', {
        maxTokens: 256,
        temperature: 0.7,
        topP: 0.9
      });
    });

    it('should reject generation without active model', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: true,
          isLoaded: false // No active model
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);

      await expect(coreMLService.generateResponse('Hello, world!'))
        .rejects
        .toThrow('No active model available');
    });

    it('should fall back to mock response on native error', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: true,
          isLoaded: true
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);
      (nativeLLMService.generateText as jest.Mock).mockRejectedValue(new Error('Native error'));

      const response = await coreMLService.generateResponse('Hello, world!');

      expect(response).toContain('Llama 3.2 3B Instruct');
      expect(response).toContain('locally');
    });
  });

  describe('getStorageInfo', () => {
    it('should calculate storage usage correctly', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: true, // Downloaded model
          isLoaded: false
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);

      const storageInfo = await coreMLService.getStorageInfo();

      expect(storageInfo.totalUsed).toBe('1.8 GB');
      expect(storageInfo.available).toBe('62.2 GB');
    });
  });

  describe('deleteModel', () => {
    it('should delete a model successfully', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: true,
          isLoaded: false // Not active
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);
      (nativeLLMService.deleteModel as jest.Mock).mockResolvedValue(undefined);

      await expect(coreMLService.deleteModel('llama-3.2-3b-instruct')).resolves.not.toThrow();
      expect(nativeLLMService.deleteModel).toHaveBeenCalledWith('llama-3.2-3b-instruct');
    });

    it('should reject deletion of active model', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: true,
          isLoaded: true // Active model
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);

      await expect(coreMLService.deleteModel('llama-3.2-3b-instruct'))
        .rejects
        .toThrow('Cannot delete active model llama-3.2-3b-instruct');
    });
  });

  describe('download progress events', () => {
    it('should handle download progress events', (done) => {
      const progressCallback = jest.fn((progress) => {
        expect(progress.modelId).toBe('llama-3.2-3b-instruct');
        expect(progress.progress).toBeGreaterThanOrEqual(0);
        expect(progress.progress).toBeLessThanOrEqual(100);
        done();
      });

      const unsubscribe = coreMLService.onDownloadProgress(progressCallback);

      // Simulate progress event
      coreMLService['notifyDownloadProgress']({
        modelId: 'llama-3.2-3b-instruct',
        progress: 50,
        status: 'downloading'
      });

      unsubscribe();
    });

    it('should handle download completion events', (done) => {
      const progressCallback = jest.fn((progress) => {
        if (progress.status === 'completed') {
          expect(progress.progress).toBe(100);
          done();
        }
      });

      const unsubscribe = coreMLService.onDownloadProgress(progressCallback);

      // Simulate completion event
      coreMLService['notifyDownloadProgress']({
        modelId: 'llama-3.2-3b-instruct',
        progress: 100,
        status: 'completed'
      });

      unsubscribe();
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      (nativeLLMService.getAvailableModels as jest.Mock).mockRejectedValue(new Error('Init error'));

      // Should not throw during initialization
      const models = await coreMLService.getAvailableModels();
      expect(models).toHaveLength(1); // Falls back to mock models
    });

    it('should handle network errors during download', async () => {
      const mockModels = [
        {
          id: 'llama-3.2-3b-instruct',
          name: 'Llama 3.2 3B Instruct',
          version: '1.0.0',
          contextLength: 8192,
          vocabularySize: 128256,
          isQuantized: true,
          precisionBits: 4,
          isDownloaded: false,
          isLoaded: false
        }
      ];

      (nativeLLMService.getAvailableModels as jest.Mock).mockResolvedValue(mockModels);
      (nativeLLMService.downloadModel as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Should fall back to mock download
      await expect(coreMLService.downloadModel('llama-3.2-3b-instruct')).resolves.not.toThrow();
    });
  });
});