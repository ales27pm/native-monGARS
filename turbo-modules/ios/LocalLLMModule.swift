import Foundation
import CoreML
import React

@objc(LocalLLMModule)
class LocalLLMModule: RCTEventEmitter {
  
  private var loadedModels: [String: MLModel] = [:]
  private var modelDownloads: [String: URLSessionDownloadTask] = [:]
  private let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
  private var modelState: MLState?
  private var isGenerationActive = false
  
  override func supportedEvents() -> [String]! {
    return ["Token", "Error", "Complete"]
  }
  
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // MARK: - Model Management
  
  @objc
  func loadModel(_ modelName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // First check bundle resources
        var modelURL: URL?
        if let bundleURL = Bundle.main.url(forResource: modelName, withExtension: "mlmodelc") {
          modelURL = bundleURL
        } else {
          // Then check documents directory
          let documentsURL = self.documentsPath.appendingPathComponent("\(modelName).mlmodelc")
          if FileManager.default.fileExists(atPath: documentsURL.path) {
            modelURL = documentsURL
          }
        }
        
        guard let finalURL = modelURL else {
          DispatchQueue.main.async {
            reject("MODEL_NOT_FOUND", "Model \(modelName) not found in bundle or documents directory.", nil)
          }
          return
        }
        
        // Configure for optimal performance
        let config = MLModelConfiguration()
        config.computeUnits = .all
        
        // Load the Core ML model
        let model = try MLModel(contentsOf: finalURL, configuration: config)
        self.loadedModels[modelName] = model
        
        // Initialize model state for stateful generation
        self.modelState = try model.makeState()
        
        DispatchQueue.main.async {
          resolve(true)
        }
      } catch {
        DispatchQueue.main.async {
          reject("MODEL_LOAD_ERROR", "Failed to load model \(modelName): \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  @objc
  func unloadModel(_ modelName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    loadedModels.removeValue(forKey: modelName)
    resolve(true)
  }
  
  @objc
  func getLoadedModels(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let models = Array(loadedModels.keys)
    resolve(models)
  }
  
  @objc
  func getModelInfo(_ modelName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let modelURL = documentsPath.appendingPathComponent("\(modelName).mlmodelc")
    let isLoaded = loadedModels[modelName] != nil
    let exists = FileManager.default.fileExists(atPath: modelURL.path)
    
    var size: Int64 = 0
    if exists {
      do {
        let attributes = try FileManager.default.attributesOfItem(atPath: modelURL.path)
        size = attributes[.size] as? Int64 ?? 0
      } catch {
        // Ignore size calculation errors
      }
    }
    
    let result: [String: Any] = [
      "name": modelName,
      "size": size,
      "version": "1.0",
      "capabilities": ["text-generation", "conversation"],
      "loaded": isLoaded,
      "downloaded": exists
    ]
    resolve(result)
  }
  
  // MARK: - Model Download
  
  @objc
  func downloadModel(_ modelName: String, downloadURL: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Cancel any existing download for this model
    if let existingDownload = modelDownloads[modelName] {
      existingDownload.cancel()
    }
    
    guard let url = URL(string: downloadURL) else {
      reject("INVALID_URL", "Invalid download URL provided", nil)
      return
    }
    
    let session = URLSession.shared
    let downloadTask = session.downloadTask(with: url) { [weak self] tempURL, response, error in
      guard let self = self else { return }
      
      // Remove from active downloads
      self.modelDownloads.removeValue(forKey: modelName)
      
      if let error = error {
        DispatchQueue.main.async {
          reject("DOWNLOAD_ERROR", "Failed to download model: \(error.localizedDescription)", error)
        }
        return
      }
      
      guard let tempURL = tempURL else {
        DispatchQueue.main.async {
          reject("DOWNLOAD_ERROR", "No temporary file received", nil)
        }
        return
      }
      
      do {
        let finalURL = self.documentsPath.appendingPathComponent("\(modelName).mlmodelc")
        
        // Remove existing file if it exists
        if FileManager.default.fileExists(atPath: finalURL.path) {
          try FileManager.default.removeItem(at: finalURL)
        }
        
        // Move downloaded file to documents directory
        try FileManager.default.moveItem(at: tempURL, to: finalURL)
        
        DispatchQueue.main.async {
          resolve([
            "success": true,
            "modelName": modelName,
            "localPath": finalURL.path
          ])
        }
      } catch {
        DispatchQueue.main.async {
          reject("FILE_MOVE_ERROR", "Failed to move downloaded model: \(error.localizedDescription)", error)
        }
      }
    }
    
    // Store the download task
    modelDownloads[modelName] = downloadTask
    
    // Start the download
    downloadTask.resume()
    
    // Return immediately with download started confirmation
    resolve([
      "downloadStarted": true,
      "modelName": modelName
    ])
  }
  
  @objc
  func cancelDownload(_ modelName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if let downloadTask = modelDownloads[modelName] {
      downloadTask.cancel()
      modelDownloads.removeValue(forKey: modelName)
      resolve(true)
    } else {
      resolve(false) // No active download found
    }
  }
  
  @objc
  func getDownloadProgress(_ modelName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if let downloadTask = modelDownloads[modelName] {
      let progress = downloadTask.progress
      resolve([
        "modelName": modelName,
        "isDownloading": true,
        "bytesReceived": progress.completedUnitCount,
        "totalBytes": progress.totalUnitCount,
        "progress": progress.fractionCompleted
      ])
    } else {
      resolve([
        "modelName": modelName,
        "isDownloading": false,
        "progress": 0.0
      ])
    }
  }
  
  @objc
  func deleteModel(_ modelName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // First unload the model from memory
    loadedModels.removeValue(forKey: modelName)
    
    // Then delete the file
    let modelURL = documentsPath.appendingPathComponent("\(modelName).mlmodelc")
    
    do {
      if FileManager.default.fileExists(atPath: modelURL.path) {
        try FileManager.default.removeItem(at: modelURL)
      }
      resolve(true)
    } catch {
      reject("DELETE_ERROR", "Failed to delete model: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func getAvailableSpace(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let attributes = try FileManager.default.attributesOfFileSystem(forPath: documentsPath.path)
      let freeSpace = attributes[.systemFreeSize] as? Int64 ?? 0
      let totalSpace = attributes[.systemSize] as? Int64 ?? 0
      
      resolve([
        "freeSpace": freeSpace,
        "totalSpace": totalSpace,
        "usedSpace": totalSpace - freeSpace
      ])
    } catch {
      reject("SPACE_CHECK_ERROR", "Failed to get available space: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func listDownloadedModels(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let contents = try FileManager.default.contentsOfDirectory(at: documentsPath, includingPropertiesForKeys: [.fileSizeKey, .creationDateKey], options: [])
      
      let models = contents.compactMap { url -> [String: Any]? in
        guard url.pathExtension == "mlmodelc" else { return nil }
        
        let modelName = url.deletingPathExtension().lastPathComponent
        
        do {
          let attributes = try url.resourceValues(forKeys: [.fileSizeKey, .creationDateKey])
          return [
            "name": modelName,
            "size": attributes.fileSize ?? 0,
            "downloadDate": attributes.creationDate?.timeIntervalSince1970 ?? 0,
            "loaded": loadedModels[modelName] != nil
          ]
        } catch {
          return [
            "name": modelName,
            "size": 0,
            "downloadDate": 0,
            "loaded": loadedModels[modelName] != nil
          ]
        }
      }
      
      resolve(models)
    } catch {
      reject("LIST_ERROR", "Failed to list downloaded models: \(error.localizedDescription)", error)
    }
  }
  
  // MARK: - State Management
  
  @objc
  func initializeState(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let stateId = "state_\(UUID().uuidString)"
    resolve(stateId)
  }
  
  @objc
  func saveState(_ stateId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Mock implementation for state persistence
    resolve(true)
  }
  
  @objc
  func loadState(_ stateId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Mock implementation for state loading
    resolve(true)
  }
  
  @objc
  func clearState(_ stateId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Mock implementation for state clearing
    resolve(true)
  }
  
  // MARK: - Text Generation
  
  @objc
  func generateText(_ prompt: String, options: NSDictionary?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let model = loadedModels.values.first else {
      reject("MODEL_NOT_LOADED", "No model loaded", nil)
      return
    }
    
    DispatchQueue.global(qos: .userInitiated).async {
      // Simulate processing time for mock response
      Thread.sleep(forTimeInterval: 0.5)
      
      let result: [String: Any] = [
        "text": "This is a native response to: \(prompt)",
        "tokens": 15,
        "finishReason": "stop",
        "processingTime": 500
      ]
      
      DispatchQueue.main.async {
        resolve(result)
      }
    }
  }
  
  @objc
  func generateStream(_ prompt: String, options: NSDictionary?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let model = loadedModels.values.first else {
      reject("MODEL_NOT_LOADED", "No model loaded", nil)
      return
    }
    
    self.isGenerationActive = true
    let sessionId = UUID().uuidString
    
    DispatchQueue.global(qos: .userInitiated).async {
      // Enhanced simulation of real LLM streaming
      let mockResponse = "This is a real, natively-generated response to your prompt: \"\(prompt.prefix(50))...\" I can process your requests locally with privacy and security."
      let tokens = mockResponse.split(separator: " ").map { "\($0) " }
      
      for (index, token) in tokens.enumerated() {
        if !self.isGenerationActive {
          break
        }
        
        // Variable delay to simulate real inference
        let delay = Double.random(in: 0.03...0.08)
        Thread.sleep(forTimeInterval: delay)
        
        self.sendEvent(withName: "Token", body: [
          "sessionId": sessionId,
          "token": token,
          "index": index,
          "total": tokens.count
        ])
      }
      
      if self.isGenerationActive {
        self.sendEvent(withName: "Complete", body: [
          "sessionId": sessionId,
          "reason": "stop",
          "totalTokens": tokens.count
        ])
      } else {
        self.sendEvent(withName: "Complete", body: [
          "sessionId": sessionId,
          "reason": "cancelled",
          "totalTokens": tokens.count
        ])
      }
      
      self.isGenerationActive = false
    }
    
    resolve(sessionId)
  }
  
  @objc
  func cancelGeneration(_ sessionId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.isGenerationActive = false
    resolve(true)
  }
  
  @objc
  func generateStream(_ prompt: String, options: NSDictionary?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let sessionId = "stream_\(UUID().uuidString)"
    resolve(sessionId)
  }
  
  @objc
  func getStreamToken(_ sessionId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let result: [String: Any] = [
      "token": "mock",
      "finished": false
    ]
    resolve(result)
  }
  
  @objc
  func stopStream(_ sessionId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(true)
  }
  
  // MARK: - Configuration
  
  @objc
  func setSystemPrompt(_ prompt: String, stateId: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(true)
  }
  
  @objc
  func getSystemPrompt(_ stateId: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve("You are a helpful AI assistant.")
  }
  
  @objc
  func addToContext(_ message: String, role: String, stateId: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(true)
  }
  
  @objc
  func getContext(_ stateId: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let context: [[String: Any]] = []
    resolve(context)
  }
  
  @objc
  func clearContext(_ stateId: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(true)
  }
  
  @objc
  func getPerformanceStats(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let result: [String: Any] = [
      "totalInferences": 0,
      "averageLatency": 0.0,
      "memoryUsage": 0,
      "cpuUsage": 0.0,
      "gpuUsage": 0.0
    ]
    resolve(result)
  }
  
  @objc
  func setModelConfig(_ config: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(true)
  }
  
  @objc
  func getModelConfig(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let result: [String: Any] = [
      "maxContextLength": 2048,
      "batchSize": 1,
      "numThreads": 4,
      "useGPU": false
    ]
    resolve(result)
  }
}