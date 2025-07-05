import Foundation
import Speech
import AVFoundation

@objc(VoiceProcessorModule)
class VoiceProcessorModule: NSObject {
  
  private var audioEngine = AVAudioEngine()
  private var speechRecognizer: SFSpeechRecognizer?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var audioSession = AVAudioSession.sharedInstance()
  
  private var isListeningState = false
  private var wakeWordEnabledState = false
  private var privateModeEnabledState = false
  private var realTimeTranscriptionEnabledState = false
  
  private var currentTranscription = ""
  private var partialTranscription = ""
  private var registeredCommands: [String: String] = [:]
  
  override init() {
    super.init()
    setupSpeechRecognizer()
  }
  
  // MARK: - Setup
  
  private func setupSpeechRecognizer() {
    speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    speechRecognizer?.delegate = self
  }
  
  // MARK: - Voice Recognition
  
  @objc
  func startListening(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard !isListeningState else {
      resolve(true) // Already listening
      return
    }
    
    // Request permissions
    requestPermissions { [weak self] success in
      if success {
        self?.startRecording(resolve: resolve, reject: reject)
      } else {
        reject("PERMISSION_DENIED", "Speech recognition permission denied", nil)
      }
    }
  }
  
  @objc
  func stopListening(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard isListeningState else {
      resolve(true) // Already stopped
      return
    }
    
    stopRecording()
    resolve(true)
  }
  
  @objc
  func isListening(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(self.isListeningState)
  }
  
  // MARK: - Wake Word Detection
  
  @objc
  func enableWakeWord(_ wakeWord: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.wakeWordEnabledState = true
    // In a real implementation, this would configure wake word detection
    // For now, we'll simulate it
    resolve(true)
  }
  
  @objc
  func disableWakeWord(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.wakeWordEnabledState = false
    resolve(true)
  }
  
  @objc
  func isWakeWordEnabled(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(self.wakeWordEnabledState)
  }
  
  @objc
  func getWakeWordStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let result: [String: Any] = [
      "enabled": self.wakeWordEnabledState,
      "word": "hey mongars",
      "sensitivity": 0.8,
      "detectionCount": 0
    ]
    resolve(result)
  }
  
  // MARK: - Audio Processing
  
  @objc
  func processAudioBuffer(_ buffer: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // In a real implementation, this would process the actual audio buffer
    // For now, we'll simulate processing
    DispatchQueue.global(qos: .userInitiated).async {
      // Simulate processing time
      Thread.sleep(forTimeInterval: 0.1)
      
      let result: [String: Any] = [
        "transcription": "Processed audio transcription",
        "confidence": 0.95,
        "duration": 3000
      ]
      
      DispatchQueue.main.async {
        resolve(result)
      }
    }
  }
  
  @objc
  func enhanceAudio(_ buffer: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Audio enhancement would be implemented here
    // For now, return the same buffer
    resolve(buffer)
  }
  
  @objc
  func reduceNoise(_ buffer: NSDictionary, level: NSInteger, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Noise reduction would be implemented here
    // For now, return the same buffer
    resolve(buffer)
  }
  
  @objc
  func normalizeVolume(_ buffer: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Volume normalization would be implemented here
    // For now, return the same buffer
    resolve(buffer)
  }
  
  // MARK: - Real-time Features
  
  @objc
  func startRealTimeTranscription(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.realTimeTranscriptionEnabledState = true
    
    // If already listening, enable real-time mode
    if isListeningState {
      // Real-time transcription is already happening if we're listening
      resolve(true)
    } else {
      // Start listening in real-time mode
      startListening(resolve, reject: reject)
    }
  }
  
  @objc
  func stopRealTimeTranscription(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.realTimeTranscriptionEnabledState = false
    resolve(true)
  }
  
  @objc
  func getRealTimeTranscription(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let result: [String: Any] = [
      "partial": self.partialTranscription,
      "final": self.currentTranscription,
      "confidence": 0.92
    ]
    resolve(result)
  }
  
  // MARK: - Voice Commands
  
  @objc
  func registerVoiceCommand(_ command: String, action: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    registeredCommands[command.lowercased()] = action
    resolve(true)
  }
  
  @objc
  func unregisterVoiceCommand(_ command: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    registeredCommands.removeValue(forKey: command.lowercased())
    resolve(true)
  }
  
  @objc
  func getRegisteredCommands(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let commands = Array(registeredCommands.keys)
    resolve(commands)
  }
  
  // MARK: - Audio Stats
  
  @objc
  func getAudioStats(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let sampleRate = audioSession.sampleRate
    let inputNumberOfChannels = audioSession.inputNumberOfChannels
    
    let result: [String: Any] = [
      "sampleRate": Int(sampleRate),
      "bitDepth": 16, // Standard bit depth
      "channels": inputNumberOfChannels,
      "averageVolume": getCurrentVolumeLevel(),
      "noiseLevel": getCurrentNoiseLevel()
    ]
    resolve(result)
  }
  
  // MARK: - Privacy Features
  
  @objc
  func enablePrivateMode(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.privateModeEnabledState = true
    // In private mode, we would disable cloud processing and use only on-device recognition
    resolve(true)
  }
  
  @objc
  func disablePrivateMode(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.privateModeEnabledState = false
    resolve(true)
  }
  
  @objc
  func isPrivateModeEnabled(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(self.privateModeEnabledState)
  }
  
  // MARK: - Private Methods
  
  private func requestPermissions(completion: @escaping (Bool) -> Void) {
    // Request speech recognition permission
    SFSpeechRecognizer.requestAuthorization { authStatus in
      DispatchQueue.main.async {
        switch authStatus {
        case .authorized:
          // Request microphone permission
          self.audioSession.requestRecordPermission { granted in
            DispatchQueue.main.async {
              completion(granted)
            }
          }
        default:
          completion(false)
        }
      }
    }
  }
  
  private func startRecording(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Cancel any existing task
    recognitionTask?.cancel()
    recognitionTask = nil
    
    // Configure audio session
    do {
      try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      reject("AUDIO_SESSION_ERROR", "Failed to configure audio session: \(error.localizedDescription)", error)
      return
    }
    
    // Create recognition request
    recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    guard let recognitionRequest = recognitionRequest else {
      reject("RECOGNITION_REQUEST_ERROR", "Failed to create recognition request", nil)
      return
    }
    
    recognitionRequest.shouldReportPartialResults = true
    
    // Configure for private mode if enabled
    if privateModeEnabledState {
      recognitionRequest.requiresOnDeviceRecognition = true
    }
    
    // Get audio input node
    let inputNode = audioEngine.inputNode
    
    // Create recognition task
    recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
      var isFinal = false
      
      if let result = result {
        self?.currentTranscription = result.bestTranscription.formattedString
        self?.partialTranscription = result.bestTranscription.formattedString
        isFinal = result.isFinal
        
        // Check for registered voice commands
        self?.checkForVoiceCommands(transcription: self?.currentTranscription ?? "")
      }
      
      if error != nil || isFinal {
        self?.audioEngine.stop()
        inputNode.removeTap(onBus: 0)
        self?.recognitionRequest = nil
        self?.recognitionTask = nil
        self?.isListeningState = false
      }
    }
    
    // Configure audio format
    let recordingFormat = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
      recognitionRequest.append(buffer)
    }
    
    // Start audio engine
    audioEngine.prepare()
    do {
      try audioEngine.start()
      isListeningState = true
      resolve(true)
    } catch {
      reject("AUDIO_ENGINE_ERROR", "Failed to start audio engine: \(error.localizedDescription)", error)
    }
  }
  
  private func stopRecording() {
    audioEngine.stop()
    recognitionRequest?.endAudio()
    
    // Clean up audio session
    do {
      try audioSession.setActive(false)
    } catch {
      print("Failed to deactivate audio session: \(error)")
    }
    
    isListeningState = false
  }
  
  private func checkForVoiceCommands(transcription: String) {
    let lowercaseTranscription = transcription.lowercased()
    
    for (command, action) in registeredCommands {
      if lowercaseTranscription.contains(command) {
        // In a real implementation, this would trigger the associated action
        print("Voice command detected: \(command) -> \(action)")
        // Could post a notification or call a delegate method
        break
      }
    }
    
    // Check for wake word if enabled
    if wakeWordEnabledState && lowercaseTranscription.contains("hey mongars") {
      print("Wake word detected!")
      // Could trigger wake word actions
    }
  }
  
  private func getCurrentVolumeLevel() -> Double {
    // In a real implementation, this would measure actual audio levels
    // For now, return a simulated value
    return Double.random(in: 0.3...0.8)
  }
  
  private func getCurrentNoiseLevel() -> Double {
    // In a real implementation, this would measure background noise
    // For now, return a simulated value
    return Double.random(in: 0.05...0.2)
  }
}

// MARK: - SFSpeechRecognizerDelegate

extension VoiceProcessorModule: SFSpeechRecognizerDelegate {
  func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
    // Handle speech recognizer availability changes
    if !available {
      print("Speech recognizer became unavailable")
      stopRecording()
    }
  }
}