import Foundation
import CoreML
import NaturalLanguage
import Combine

@objc(LocalLLMModule)
class LocalLLMModule: RCTEventEmitter {
    
    // MARK: - Properties
    private var model: MLModel?
    private var tokenizer: NLTokenizer?
    private var modelMetadata: ModelMetadata?
    private var downloadTasks: [String: URLSessionDownloadTask] = [:]
    private var downloadObservers: [String: AnyCancellable] = [:]
    
    // MARK: - Model Configuration
    struct ModelMetadata {
        let id: String
        let name: String
        let version: String
        let contextLength: Int
        let vocabularySize: Int
        let modelPath: String
        let tokenizerPath: String
        let isQuantized: Bool
        let precisionBits: Int
    }
    
    struct ModelConfig {
        static let availableModels = [
            ModelMetadata(
                id: "llama-3.2-3b-instruct",
                name: "Llama 3.2 3B Instruct",
                version: "1.0.0",
                contextLength: 8192,
                vocabularySize: 128256,
                modelPath: "Llama-3.2-3B-Instruct.mlpackage",
                tokenizerPath: "tokenizer.json",
                isQuantized: true,
                precisionBits: 4
            )
        ]
    }
    
    // MARK: - Lifecycle
    override init() {
        super.init()
        setupModule()
    }
    
    private func setupModule() {
        // Initialize tokenizer
        tokenizer = NLTokenizer(unit: .word)
        
        // Create models directory
        createModelDirectoryIfNeeded()
        
        // Load any existing models
        loadExistingModels()
    }
    
    // MARK: - Event Emitter
    override func supportedEvents() -> [String]! {
        return [
            "ModelDownloadProgress",
            "ModelDownloadComplete",
            "ModelDownloadError",
            "ModelLoadComplete",
            "ModelLoadError",
            "InferenceComplete",
            "InferenceError"
        ]
    }
    
    // MARK: - React Native Methods
    
    @objc(downloadModel:resolver:rejecter:)
    func downloadModel(
        _ modelId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let modelMetadata = ModelConfig.availableModels.first(where: { $0.id == modelId }) else {
            reject("MODEL_NOT_FOUND", "Model with ID \(modelId) not found", nil)
            return
        }
        
        // Check if model already exists
        if isModelDownloaded(modelId: modelId) {
            reject("MODEL_ALREADY_EXISTS", "Model \(modelId) is already downloaded", nil)
            return
        }
        
        // Start download
        startModelDownload(modelMetadata: modelMetadata) { [weak self] success, error in
            if success {
                resolve(["success": true, "modelId": modelId])
            } else {
                reject("DOWNLOAD_FAILED", error?.localizedDescription ?? "Unknown download error", error)
            }
        }
    }
    
    @objc(loadModel:resolver:rejecter:)
    func loadModel(
        _ modelId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let modelMetadata = ModelConfig.availableModels.first(where: { $0.id == modelId }) else {
            reject("MODEL_NOT_FOUND", "Model with ID \(modelId) not found", nil)
            return
        }
        
        guard isModelDownloaded(modelId: modelId) else {
            reject("MODEL_NOT_DOWNLOADED", "Model \(modelId) is not downloaded", nil)
            return
        }
        
        loadModelFromDisk(modelMetadata: modelMetadata) { [weak self] success, error in
            if success {
                self?.modelMetadata = modelMetadata
                resolve(["success": true, "modelId": modelId])
                self?.sendEvent(withName: "ModelLoadComplete", body: ["modelId": modelId])
            } else {
                reject("LOAD_FAILED", error?.localizedDescription ?? "Unknown load error", error)
                self?.sendEvent(withName: "ModelLoadError", body: [
                    "modelId": modelId,
                    "error": error?.localizedDescription ?? "Unknown error"
                ])
            }
        }
    }
    
    @objc(generateText:maxTokens:temperature:topP:resolver:rejecter:)
    func generateText(
        _ prompt: String,
        maxTokens: NSNumber,
        temperature: NSNumber,
        topP: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let model = self.model else {
            reject("MODEL_NOT_LOADED", "No model is currently loaded", nil)
            return
        }
        
        guard let modelMetadata = self.modelMetadata else {
            reject("MODEL_METADATA_MISSING", "Model metadata is missing", nil)
            return
        }
        
        // Run inference asynchronously
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                let result = try self?.performInference(
                    model: model,
                    prompt: prompt,
                    maxTokens: maxTokens.intValue,
                    temperature: temperature.floatValue,
                    topP: topP.floatValue,
                    metadata: modelMetadata
                )
                
                DispatchQueue.main.async {
                    if let result = result {
                        resolve([
                            "text": result.text,
                            "tokenCount": result.tokenCount,
                            "processingTime": result.processingTime
                        ])
                        self?.sendEvent(withName: "InferenceComplete", body: [
                            "text": result.text,
                            "tokenCount": result.tokenCount,
                            "processingTime": result.processingTime
                        ])
                    } else {
                        reject("INFERENCE_FAILED", "Inference returned no result", nil)
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    reject("INFERENCE_ERROR", error.localizedDescription, error)
                    self?.sendEvent(withName: "InferenceError", body: [
                        "error": error.localizedDescription
                    ])
                }
            }
        }
    }
    
    @objc(getAvailableModels:rejecter:)
    func getAvailableModels(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let models = ModelConfig.availableModels.map { metadata in
            return [
                "id": metadata.id,
                "name": metadata.name,
                "version": metadata.version,
                "contextLength": metadata.contextLength,
                "vocabularySize": metadata.vocabularySize,
                "isQuantized": metadata.isQuantized,
                "precisionBits": metadata.precisionBits,
                "isDownloaded": isModelDownloaded(modelId: metadata.id),
                "isLoaded": self.modelMetadata?.id == metadata.id
            ]
        }
        
        resolve(models)
    }
    
    @objc(deleteModel:resolver:rejecter:)
    func deleteModel(
        _ modelId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        // Unload model if it's currently loaded
        if modelMetadata?.id == modelId {
            model = nil
            modelMetadata = nil
        }
        
        // Delete model files
        let modelPath = getModelPath(modelId: modelId)
        
        do {
            if FileManager.default.fileExists(atPath: modelPath) {
                try FileManager.default.removeItem(atPath: modelPath)
            }
            resolve(["success": true])
        } catch {
            reject("DELETE_FAILED", error.localizedDescription, error)
        }
    }
    
    // MARK: - Private Methods
    
    private func createModelDirectoryIfNeeded() {
        let modelsDir = getModelsDirectory()
        if !FileManager.default.fileExists(atPath: modelsDir) {
            try? FileManager.default.createDirectory(atPath: modelsDir, withIntermediateDirectories: true)
        }
    }
    
    private func getModelsDirectory() -> String {
        let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
        return "\(documentsPath)/CoreMLModels"
    }
    
    private func getModelPath(modelId: String) -> String {
        return "\(getModelsDirectory())/\(modelId)"
    }
    
    private func isModelDownloaded(modelId: String) -> Bool {
        let modelPath = getModelPath(modelId: modelId)
        return FileManager.default.fileExists(atPath: modelPath)
    }
    
    private func loadExistingModels() {
        // Check for any pre-existing models and load metadata
        for metadata in ModelConfig.availableModels {
            if isModelDownloaded(modelId: metadata.id) {
                // Model exists, could auto-load the first one found
                // For now, just log its existence
                print("Found existing model: \(metadata.name)")
            }
        }
    }
    
    private func startModelDownload(
        modelMetadata: ModelMetadata,
        completion: @escaping (Bool, Error?) -> Void
    ) {
        // Construct download URL based on model metadata
        let baseURL = "https://huggingface.co/andmev/Llama-3.2-3B-Instruct-CoreML/resolve/main"
        let modelURL = URL(string: "\(baseURL)/\(modelMetadata.modelPath)")!
        
        // Create download task
        let task = URLSession.shared.downloadTask(with: modelURL) { [weak self] location, response, error in
            guard let self = self else { return }
            
            if let error = error {
                completion(false, error)
                return
            }
            
            guard let location = location else {
                completion(false, NSError(domain: "DownloadError", code: -1, userInfo: [NSLocalizedDescriptionKey: "No download location"]))
                return
            }
            
            // Move downloaded file to models directory
            let destinationPath = self.getModelPath(modelId: modelMetadata.id)
            
            do {
                // Create model directory
                try FileManager.default.createDirectory(atPath: destinationPath, withIntermediateDirectories: true)
                
                // Move the downloaded file
                let finalPath = "\(destinationPath)/\(modelMetadata.modelPath)"
                try FileManager.default.moveItem(at: location, to: URL(fileURLWithPath: finalPath))
                
                completion(true, nil)
                
                DispatchQueue.main.async {
                    self.sendEvent(withName: "ModelDownloadComplete", body: [
                        "modelId": modelMetadata.id,
                        "modelPath": finalPath
                    ])
                }
            } catch {
                completion(false, error)
            }
        }
        
        // Track download progress
        downloadObservers[modelMetadata.id] = task.progress.publisher(for: \.fractionCompleted)
            .sink { [weak self] progress in
                DispatchQueue.main.async {
                    self?.sendEvent(withName: "ModelDownloadProgress", body: [
                        "modelId": modelMetadata.id,
                        "progress": progress,
                        "status": progress < 1.0 ? "downloading" : "installing"
                    ])
                }
            }
        
        downloadTasks[modelMetadata.id] = task
        task.resume()
    }
    
    private func loadModelFromDisk(
        modelMetadata: ModelMetadata,
        completion: @escaping (Bool, Error?) -> Void
    ) {
        let modelPath = "\(getModelPath(modelId: modelMetadata.id))/\(modelMetadata.modelPath)"
        let modelURL = URL(fileURLWithPath: modelPath)
        
        do {
            // Load Core ML model
            let loadedModel = try MLModel(contentsOf: modelURL)
            self.model = loadedModel
            completion(true, nil)
        } catch {
            completion(false, error)
        }
    }
    
    private struct InferenceResult {
        let text: String
        let tokenCount: Int
        let processingTime: Double
    }
    
    private func performInference(
        model: MLModel,
        prompt: String,
        maxTokens: Int,
        temperature: Float,
        topP: Float,
        metadata: ModelMetadata
    ) throws -> InferenceResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Tokenize input
        let inputTokens = tokenizeText(prompt)
        
        // Prepare input for Core ML model
        let inputFeatures = try prepareModelInput(
            tokens: inputTokens,
            maxTokens: maxTokens,
            temperature: temperature,
            topP: topP
        )
        
        // Run inference
        let prediction = try model.prediction(from: inputFeatures)
        
        // Process output
        let outputTokens = try extractOutputTokens(from: prediction)
        let generatedText = detokenizeText(outputTokens)
        
        let processingTime = CFAbsoluteTimeGetCurrent() - startTime
        
        return InferenceResult(
            text: generatedText,
            tokenCount: outputTokens.count,
            processingTime: processingTime
        )
    }
    
    private func tokenizeText(_ text: String) -> [Int] {
        // This is a simplified tokenization - in practice, you'd use the model's specific tokenizer
        guard let tokenizer = self.tokenizer else { return [] }
        
        tokenizer.string = text
        let tokens = tokenizer.tokens(for: text.startIndex..<text.endIndex)
        
        // Convert to token IDs (simplified - real implementation would use vocabulary)
        return tokens.enumerated().map { index, _ in index }
    }
    
    private func detokenizeText(_ tokens: [Int]) -> String {
        // Simplified detokenization - real implementation would use vocabulary mapping
        return tokens.map { "token\($0)" }.joined(separator: " ")
    }
    
    private func prepareModelInput(
        tokens: [Int],
        maxTokens: Int,
        temperature: Float,
        topP: Float
    ) throws -> MLFeatureProvider {
        // Create MLDictionaryFeatureProvider with model inputs
        // This would depend on the specific model's input format
        let inputDict: [String: Any] = [
            "input_ids": tokens,
            "max_tokens": maxTokens,
            "temperature": temperature,
            "top_p": topP
        ]
        
        return try MLDictionaryFeatureProvider(dictionary: inputDict)
    }
    
    private func extractOutputTokens(from prediction: MLFeatureProvider) throws -> [Int] {
        // Extract output tokens from model prediction
        // This would depend on the specific model's output format
        if let outputArray = prediction.featureValue(for: "output_ids")?.multiArrayValue {
            var tokens: [Int] = []
            for i in 0..<outputArray.count {
                if let tokenId = outputArray[i].intValue {
                    tokens.append(tokenId)
                }
            }
            return tokens
        }
        
        return []
    }
}

// MARK: - Module Registration
@objc(LocalLLMModuleBridge)
class LocalLLMModuleBridge: NSObject {
    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
}