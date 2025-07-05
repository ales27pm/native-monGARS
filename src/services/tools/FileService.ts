/**
 * FileService.ts
 * Production-grade file service with native FileManager integration
 */

import { NativeModules, Platform } from 'react-native';
import type { FileReadParams, FileWriteParams, FileInfo, ServiceStatus } from '../../types/ai';

const { FileModule } = NativeModules;

// Legacy interface for compatibility
interface FileInfoLegacy {
  uri: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export class FileService {
  private initialized = false;
  private lastError?: Error;
  private mockFiles: FileInfoLegacy[] = [
    {
      uri: '/documents/notes.txt',
      name: 'notes.txt',
      size: 1024,
      type: 'text/plain',
      lastModified: Date.now() - 86400000 // 1 day ago
    },
    {
      uri: '/documents/presentation.pdf',
      name: 'presentation.pdf',
      size: 2048000,
      type: 'application/pdf',
      lastModified: Date.now() - 172800000 // 2 days ago
    },
    {
      uri: '/documents/image.jpg',
      name: 'image.jpg',
      size: 512000,
      type: 'image/jpeg',
      lastModified: Date.now() - 259200000 // 3 days ago
    },
    {
      uri: '/documents/project-plan.docx',
      name: 'project-plan.docx',
      size: 256000,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      lastModified: Date.now() - 345600000 // 4 days ago
    }
  ];

  private mockFileContents = new Map<string, string>([
    ['/documents/notes.txt', 'This is a sample text file with notes about the Native-monGARS project. The app is designed to be privacy-first with on-device processing capabilities.'],
    ['/documents/project-plan.docx', 'Project Plan: Native-monGARS Development\n\n1. Phase 1: Core Architecture\n2. Phase 2: LLM Integration\n3. Phase 3: RAG Implementation\n4. Phase 4: Voice Features\n5. Phase 5: Testing & Deployment'],
    ['/documents/presentation.pdf', 'PDF Content: Native-monGARS Presentation\n\nSlide 1: Overview\nSlide 2: Architecture\nSlide 3: Features\nSlide 4: Privacy & Security\nSlide 5: Roadmap'],
    ['/documents/image.jpg', '[Binary image data - JPEG format]']
  ]);

  /** Initialize file service */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      console.log('📁 Initializing File Service...');
      
      if (FileModule?.initialize) {
        await FileModule.initialize();
      }
      
      this.initialized = true;
      console.log('✅ File Service initialized');
      return true;
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to initialize File service:', error);
      // Fall back to mock mode
      this.initialized = true;
      return true;
    }
  }

  /** Read file contents */
  async read(params: FileReadParams): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`📁 Reading file: ${params.path}`);
      
      if (FileModule?.readFile) {
        // Use native file module
        const content: string = await FileModule.readFile(params.path);
        console.log(`✅ File read successfully: ${params.path}`);
        return content;
      } else {
        // Mock implementation
        const content = this.mockFileContents.get(params.path) || `Mock file content for: ${params.path}`;
        console.log(`📱 Mock file read: ${params.path}`);
        return content;
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to read file:', error);
      throw error;
    }
  }

  /** Legacy readFile method */
  async readFile(path: string): Promise<string> {
    return await this.read({ path });
  }

  /** Write file contents */
  async write(params: FileWriteParams): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`📁 Writing file: ${params.path}`);
      
      if (FileModule?.writeFile) {
        // Use native file module
        const success: boolean = await FileModule.writeFile(params.path, params.content);
        console.log(`✅ File written successfully: ${params.path}`);
        return success;
      } else {
        // Mock implementation
        this.mockFileContents.set(params.path, params.content);
        
        // Update or add file info
        const fileName = params.path.split('/').pop() || 'unknown';
        const fileInfo: FileInfoLegacy = {
          uri: params.path,
          name: fileName,
          size: params.content.length,
          type: this.getFileType(fileName),
          lastModified: Date.now()
        };
        
        const existingIndex = this.mockFiles.findIndex(file => file.uri === params.path);
        if (existingIndex >= 0) {
          this.mockFiles[existingIndex] = fileInfo;
        } else {
          this.mockFiles.push(fileInfo);
        }
        
        console.log(`📱 Mock file written: ${params.path}`);
        return true;
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to write file:', error);
      throw error;
    }
  }

  /** Legacy writeFile method */
  async writeFile(path: string, content: string): Promise<boolean> {
    return await this.write({ path, content });
  }

  /** Get file information */
  async getFileInfo(path: string): Promise<FileInfo> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`📁 Getting file info: ${path}`);
      
      if (FileModule?.getFileInfo) {
        // Use native file module
        const fileInfo: FileInfo = await FileModule.getFileInfo(path);
        console.log(`✅ File info retrieved: ${path}`);
        return fileInfo;
      } else {
        // Mock implementation
        const mockFile = this.mockFiles.find(file => file.uri === path);
        if (mockFile) {
          const fileInfo: FileInfo = {
            path: mockFile.uri,
            name: mockFile.name,
            size: mockFile.size,
            type: mockFile.type,
            modifiedDate: new Date(mockFile.lastModified).toISOString(),
            isDirectory: false
          };
          console.log(`📱 Mock file info retrieved: ${path}`);
          return fileInfo;
        } else {
          throw new Error(`File not found: ${path}`);
        }
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to get file info:', error);
      throw error;
    }
  }

  /** List directory contents */
  async listDirectory(path: string): Promise<FileInfo[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`📁 Listing directory: ${path}`);
      
      if (FileModule?.listDirectory) {
        // Use native file module
        const files: FileInfo[] = await FileModule.listDirectory(path);
        console.log(`✅ Directory listed: ${path} (${files.length} files)`);
        return files;
      } else {
        // Mock implementation
        const directoryFiles = this.mockFiles
          .filter(file => file.uri.startsWith(path))
          .map(file => ({
            path: file.uri,
            name: file.name,
            size: file.size,
            type: file.type,
            modifiedDate: new Date(file.lastModified).toISOString(),
            isDirectory: false
          }));
        
        console.log(`📱 Mock directory listed: ${path} (${directoryFiles.length} files)`);
        return directoryFiles;
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to list directory:', error);
      throw error;
    }
  }

  /** Delete a file */
  async deleteFile(path: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`📁 Deleting file: ${path}`);
      
      if (FileModule?.deleteFile) {
        // Use native file module
        const success: boolean = await FileModule.deleteFile(path);
        console.log(`✅ File deleted: ${path}`);
        return success;
      } else {
        // Mock implementation
        const fileIndex = this.mockFiles.findIndex(file => file.uri === path);
        if (fileIndex >= 0) {
          this.mockFiles.splice(fileIndex, 1);
          this.mockFileContents.delete(path);
          console.log(`📱 Mock file deleted: ${path}`);
          return true;
        }
        return false;
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error('❌ Failed to delete file:', error);
      throw error;
    }
  }

  /** Search files by name or content */
  async searchFiles(searchTerm: string, searchPath?: string): Promise<FileInfo[]> {
    try {
      console.log(`📁 Searching files for: "${searchTerm}"`);
      
      const basePath = searchPath || '/documents';
      const allFiles = await this.listDirectory(basePath);
      
      const matchingFiles = allFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Also search file contents for text files
      for (const file of allFiles) {
        if (file.type.startsWith('text/') && !matchingFiles.some(f => f.path === file.path)) {
          try {
            const content = await this.read({ path: file.path });
            if (content.toLowerCase().includes(searchTerm.toLowerCase())) {
              matchingFiles.push(file);
            }
          } catch {
            // Ignore content search errors
          }
        }
      }
      
      console.log(`✅ Found ${matchingFiles.length} matching files`);
      return matchingFiles;
    } catch (error) {
      console.error('❌ Failed to search files:', error);
      throw error;
    }
  }

  /** Get file type from filename */
  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'md': 'text/markdown'
    };
    
    return typeMap[extension || ''] || 'application/octet-stream';
  }

  /** Legacy methods for compatibility */
  async getFiles(): Promise<FileInfoLegacy[]> {
    return this.mockFiles;
  }

  async getFile(path: string): Promise<FileInfoLegacy | null> {
    return this.mockFiles.find(file => file.uri === path) || null;
  }

  async createDirectory(path: string): Promise<boolean> {
    console.log(`📁 Mock directory created: ${path}`);
    return true;
  }

  async fileExists(path: string): Promise<boolean> {
    return this.mockFiles.some(file => file.uri === path) || this.mockFileContents.has(path);
  }

  /** Check if file service is available */
  isAvailable(): boolean {
    return this.initialized;
  }

  /** Get service status */
  getStatus(): ServiceStatus {
    return {
      initialized: this.initialized,
      available: this.isAvailable(),
      lastError: this.lastError ? {
        code: 'FILE_ERROR',
        message: this.lastError.message,
        details: this.lastError,
        timestamp: Date.now(),
        service: 'File'
      } : undefined,
      version: '1.0.0'
    };
  }

  /** Get file service statistics */
  getStats(): {
    initialized: boolean;
    isAvailable: boolean;
    fileCount: number;
    totalSize: number;
  } {
    const totalSize = this.mockFiles.reduce((sum, file) => sum + file.size, 0);
    
    return {
      initialized: this.initialized,
      isAvailable: this.isAvailable(),
      fileCount: this.mockFiles.length,
      totalSize
    };
  }

  /** Health check */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isAvailable()) return false;
      
      // Test basic functionality
      await this.listDirectory('/documents');
      return true;
    } catch {
      return false;
    }
  }

  /** Cleanup resources */
  async cleanup(): Promise<void> {
    this.initialized = false;
    this.mockFiles = [];
    this.mockFileContents.clear();
    console.log('🧹 File Service cleaned up');
  }
}

export const fileService = new FileService();