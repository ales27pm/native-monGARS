import Foundation
import Security
import LocalAuthentication
import CryptoKit

@objc(PrivacyModule)
class PrivacyModule: NSObject {
  
  private var vpnEnabledState = false
  private let keychain = KeychainHelper()
  
  // MARK: - Data Encryption
  
  @objc
  func encryptData(_ data: String, key: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let dataToEncrypt = data.data(using: .utf8) ?? Data()
        
        let encryptionKey: SymmetricKey
        if let keyString = key {
          // Use provided key
          let keyData = keyString.data(using: .utf8) ?? Data()
          encryptionKey = SymmetricKey(data: SHA256.hash(data: keyData))
        } else {
          // Generate random key
          encryptionKey = SymmetricKey(size: .bits256)
        }
        
        let sealedBox = try AES.GCM.seal(dataToEncrypt, using: encryptionKey)
        let encryptedData = sealedBox.combined ?? Data()
        let base64Encrypted = encryptedData.base64EncodedString()
        
        DispatchQueue.main.async {
          resolve(base64Encrypted)
        }
      } catch {
        DispatchQueue.main.async {
          reject("ENCRYPTION_ERROR", "Failed to encrypt data: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  @objc
  func decryptData(_ encryptedData: String, key: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        guard let encryptedBytes = Data(base64Encoded: encryptedData) else {
          DispatchQueue.main.async {
            reject("DECRYPTION_ERROR", "Invalid base64 encoded data", nil)
          }
          return
        }
        
        let encryptionKey: SymmetricKey
        if let keyString = key {
          let keyData = keyString.data(using: .utf8) ?? Data()
          encryptionKey = SymmetricKey(data: SHA256.hash(data: keyData))
        } else {
          DispatchQueue.main.async {
            reject("DECRYPTION_ERROR", "No decryption key provided", nil)
          }
          return
        }
        
        let sealedBox = try AES.GCM.SealedBox(combined: encryptedBytes)
        let decryptedData = try AES.GCM.open(sealedBox, using: encryptionKey)
        let decryptedString = String(data: decryptedData, encoding: .utf8) ?? ""
        
        DispatchQueue.main.async {
          resolve(decryptedString)
        }
      } catch {
        DispatchQueue.main.async {
          reject("DECRYPTION_ERROR", "Failed to decrypt data: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  @objc
  func generateEncryptionKey(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let key = SymmetricKey(size: .bits256)
    let keyData = key.withUnsafeBytes { Data($0) }
    let keyString = keyData.base64EncodedString()
    resolve(keyString)
  }
  
  // MARK: - Secure Storage
  
  @objc
  func secureStore(_ key: String, value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try self.keychain.store(key: key, value: value)
        DispatchQueue.main.async {
          resolve(true)
        }
      } catch {
        DispatchQueue.main.async {
          reject("STORAGE_ERROR", "Failed to store in keychain: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  @objc
  func secureRetrieve(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let value = try self.keychain.retrieve(key: key)
        DispatchQueue.main.async {
          resolve(value)
        }
      } catch KeychainError.itemNotFound {
        DispatchQueue.main.async {
          resolve(NSNull())
        }
      } catch {
        DispatchQueue.main.async {
          reject("RETRIEVAL_ERROR", "Failed to retrieve from keychain: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  @objc
  func secureDelete(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try self.keychain.delete(key: key)
        DispatchQueue.main.async {
          resolve(true)
        }
      } catch {
        DispatchQueue.main.async {
          reject("DELETE_ERROR", "Failed to delete from keychain: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  @objc
  func secureListKeys(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let keys = try self.keychain.getAllKeys()
        DispatchQueue.main.async {
          resolve(keys)
        }
      } catch {
        DispatchQueue.main.async {
          reject("LIST_ERROR", "Failed to list keychain keys: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  @objc
  func secureClear(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try self.keychain.clearAll()
        DispatchQueue.main.async {
          resolve(true)
        }
      } catch {
        DispatchQueue.main.async {
          reject("CLEAR_ERROR", "Failed to clear keychain: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  // MARK: - Privacy Scanning
  
  @objc
  func scanForPII(_ text: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      var foundPII = false
      var types: [String] = []
      var locations: [[String: Any]] = []
      
      // Email detection
      let emailPattern = "\\b[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}\\b"
      if let emailRegex = try? NSRegularExpression(pattern: emailPattern, options: .caseInsensitive) {
        let matches = emailRegex.matches(in: text, options: [], range: NSRange(location: 0, length: text.count))
        for match in matches {
          foundPII = true
          types.append("email")
          locations.append([
            "type": "email",
            "start": match.range.location,
            "end": match.range.location + match.range.length,
            "value": String(text[Range(match.range, in: text)!])
          ])
        }
      }
      
      // Phone number detection
      let phonePatterns = [
        "\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b",
        "\\(\\d{3}\\)\\s?\\d{3}[-.]?\\d{4}",
        "\\+1[-\\s]?\\d{3}[-\\s]?\\d{3}[-\\s]?\\d{4}"
      ]
      
      for pattern in phonePatterns {
        if let phoneRegex = try? NSRegularExpression(pattern: pattern, options: []) {
          let matches = phoneRegex.matches(in: text, options: [], range: NSRange(location: 0, length: text.count))
          for match in matches {
            foundPII = true
            if !types.contains("phone") { types.append("phone") }
            locations.append([
              "type": "phone",
              "start": match.range.location,
              "end": match.range.location + match.range.length,
              "value": String(text[Range(match.range, in: text)!])
            ])
          }
        }
      }
      
      // SSN detection
      let ssnPattern = "\\b\\d{3}-\\d{2}-\\d{4}\\b"
      if let ssnRegex = try? NSRegularExpression(pattern: ssnPattern, options: []) {
        let matches = ssnRegex.matches(in: text, options: [], range: NSRange(location: 0, length: text.count))
        for match in matches {
          foundPII = true
          types.append("ssn")
          locations.append([
            "type": "ssn",
            "start": match.range.location,
            "end": match.range.location + match.range.length,
            "value": String(text[Range(match.range, in: text)!])
          ])
        }
      }
      
      let result: [String: Any] = [
        "foundPII": foundPII,
        "types": Array(Set(types)),
        "locations": locations
      ]
      
      DispatchQueue.main.async {
        resolve(result)
      }
    }
  }
  
  @objc
  func sanitizeText(_ text: String, options: NSDictionary?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      var sanitized = text
      let opts = options ?? [:]
      
      let removePII = opts["removePII"] as? Bool ?? true
      let anonymize = opts["anonymize"] as? Bool ?? false
      let redactSensitive = opts["redactSensitive"] as? Bool ?? true
      
      if removePII || redactSensitive {
        // Email sanitization
        sanitized = sanitized.replacingOccurrences(
          of: "\\b[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}\\b",
          with: anonymize ? "[EMAIL_REDACTED]" : "",
          options: .regularExpression
        )
        
        // Phone sanitization
        let phonePatterns = [
          "\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b",
          "\\(\\d{3}\\)\\s?\\d{3}[-.]?\\d{4}",
          "\\+1[-\\s]?\\d{3}[-\\s]?\\d{3}[-\\s]?\\d{4}"
        ]
        
        for pattern in phonePatterns {
          sanitized = sanitized.replacingOccurrences(
            of: pattern,
            with: anonymize ? "[PHONE_REDACTED]" : "",
            options: .regularExpression
          )
        }
        
        // SSN sanitization
        sanitized = sanitized.replacingOccurrences(
          of: "\\b\\d{3}-\\d{2}-\\d{4}\\b",
          with: anonymize ? "[SSN_REDACTED]" : "",
          options: .regularExpression
        )
        
        // Credit card sanitization
        sanitized = sanitized.replacingOccurrences(
          of: "\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b",
          with: anonymize ? "[CARD_REDACTED]" : "",
          options: .regularExpression
        )
      }
      
      // Clean up extra whitespace
      sanitized = sanitized.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
      sanitized = sanitized.trimmingCharacters(in: .whitespacesAndNewlines)
      
      DispatchQueue.main.async {
        resolve(sanitized)
      }
    }
  }
  
  // MARK: - Privacy Compliance
  
  @objc
  func checkGDPRCompliance(_ data: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      var compliant = true
      var issues: [String] = []
      var recommendations: [String] = []
      
      // Check for PII without consent indicators
      let hasPII = self.containsPII(data)
      if hasPII {
        let hasConsentKeywords = data.lowercased().contains("consent") || 
                                data.lowercased().contains("agree") ||
                                data.lowercased().contains("accept")
        
        if !hasConsentKeywords {
          compliant = false
          issues.append("PII detected without clear consent indicators")
          recommendations.append("Ensure explicit consent is obtained before processing personal data")
        }
      }
      
      let result: [String: Any] = [
        "compliant": compliant,
        "issues": issues,
        "recommendations": recommendations
      ]
      
      DispatchQueue.main.async {
        resolve(result)
      }
    }
  }
  
  @objc
  func checkCCPACompliance(_ data: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      var compliant = true
      var issues: [String] = []
      var recommendations: [String] = []
      
      // CCPA focuses on sale/sharing disclosure
      let hasPII = self.containsPII(data)
      if hasPII {
        let hasDisclosure = data.lowercased().contains("do not sell") ||
                           data.lowercased().contains("opt-out") ||
                           data.lowercased().contains("privacy rights")
        
        if !hasDisclosure {
          compliant = false
          issues.append("Personal information detected without CCPA disclosure")
          recommendations.append("Provide clear opt-out mechanisms for data sales/sharing")
        }
      }
      
      let result: [String: Any] = [
        "compliant": compliant,
        "issues": issues,
        "recommendations": recommendations
      ]
      
      DispatchQueue.main.async {
        resolve(result)
      }
    }
  }
  
  // MARK: - Biometric Security
  
  @objc
  func isBiometricAvailable(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    var error: NSError?
    let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    resolve(available)
  }
  
  @objc
  func authenticateWithBiometric(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    let reason = "Authenticate to access secure features"
    
    context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, error in
      DispatchQueue.main.async {
        if success {
          resolve(["success": true])
        } else {
          resolve([
            "success": false,
            "error": error?.localizedDescription ?? "Authentication failed"
          ])
        }
      }
    }
  }
  
  // MARK: - Device Security
  
  @objc
  func isDeviceSecure(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    var error: NSError?
    
    let hasScreenLock = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
    let isJailbroken = self.isJailbroken()
    let hasEncryption = true // iOS devices have hardware encryption
    
    let isSecure = hasScreenLock && !isJailbroken && hasEncryption
    
    let result: [String: Any] = [
      "isSecure": isSecure,
      "hasScreenLock": hasScreenLock,
      "isJailbroken": isJailbroken,
      "hasEncryption": hasEncryption
    ]
    
    resolve(result)
  }
  
  // MARK: - Network Privacy
  
  @objc
  func enableVPNMode(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Note: Actual VPN implementation would require Network Extension framework
    // This is a mock implementation for demonstration
    self.vpnEnabledState = true
    resolve(true)
  }
  
  @objc
  func disableVPNMode(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.vpnEnabledState = false
    resolve(true)
  }
  
  @objc
  func isVPNActive(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(self.vpnEnabledState)
  }
  
  // MARK: - Data Audit
  
  @objc
  func getPrivacyReport(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let keychainKeys = try self.keychain.getAllKeys()
        let dataStored = keychainKeys.count
        let encryptedItems = dataStored // All keychain items are encrypted
        
        var securityScore = 85.0 // Base score
        
        // Adjust score based on security factors
        let context = LAContext()
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) {
          securityScore += 10
        }
        
        if !self.isJailbroken() {
          securityScore += 5
        }
        
        let recommendations = self.generateSecurityRecommendations()
        
        let result: [String: Any] = [
          "dataStored": dataStored,
          "encryptedItems": encryptedItems,
          "lastAudit": Date().timeIntervalSince1970 * 1000,
          "securityScore": min(securityScore, 100.0),
          "recommendations": recommendations
        ]
        
        DispatchQueue.main.async {
          resolve(result)
        }
      } catch {
        DispatchQueue.main.async {
          reject("AUDIT_ERROR", "Failed to generate privacy report: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  // MARK: - Permissions
  
  @objc
  func checkPermissions(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Note: Actual permission checking would require specific frameworks
    // This is a simplified implementation
    let result: [String: Any] = [
      "camera": true, // Would check AVCaptureDevice authorization
      "microphone": true, // Would check AVAudioSession recordPermission
      "storage": true, // Always available on iOS
      "location": true, // Would check CLLocationManager authorization
      "contacts": true // Would check CNContactStore authorization
    ]
    resolve(result)
  }
  
  @objc
  func requestPermission(_ permission: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Mock implementation - in real app would request actual permissions
    resolve(true)
  }
  
  // MARK: - Private Helper Methods
  
  private func containsPII(_ text: String) -> Bool {
    let patterns = [
      "\\b[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}\\b", // Email
      "\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b", // Phone
      "\\b\\d{3}-\\d{2}-\\d{4}\\b" // SSN
    ]
    
    for pattern in patterns {
      if text.range(of: pattern, options: .regularExpression) != nil {
        return true
      }
    }
    
    return false
  }
  
  private func isJailbroken() -> Bool {
    // Check for common jailbreak indicators
    let jailbreakPaths = [
      "/Applications/Cydia.app",
      "/Library/MobileSubstrate/MobileSubstrate.dylib",
      "/bin/bash",
      "/usr/sbin/sshd",
      "/etc/apt",
      "/private/var/lib/apt/"
    ]
    
    for path in jailbreakPaths {
      if FileManager.default.fileExists(atPath: path) {
        return true
      }
    }
    
    // Check if we can write to system directories
    do {
      let testString = "jailbreak_test"
      try testString.write(toFile: "/private/test_jb.txt", atomically: true, encoding: .utf8)
      try FileManager.default.removeItem(atPath: "/private/test_jb.txt")
      return true
    } catch {
      // Normal behavior - should not be able to write
    }
    
    return false
  }
  
  private func generateSecurityRecommendations() -> [String] {
    var recommendations: [String] = []
    
    let context = LAContext()
    if !context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) {
      recommendations.append("Enable biometric authentication for enhanced security")
    }
    
    if isJailbroken() {
      recommendations.append("Device appears to be jailbroken - consider security implications")
    }
    
    if recommendations.isEmpty {
      recommendations.append("Your device security is optimal")
    }
    
    return recommendations
  }
}

// MARK: - Keychain Helper

enum KeychainError: Error {
  case itemNotFound
  case duplicateItem
  case invalidItemFormat
  case unexpectedStatus(OSStatus)
}

class KeychainHelper {
  private let service = "com.mongars.app"
  
  func store(key: String, value: String) throws {
    let valueData = value.data(using: .utf8)!
    
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecValueData as String: valueData,
      kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    ]
    
    let status = SecItemAdd(query as CFDictionary, nil)
    
    if status == errSecDuplicateItem {
      // Update existing item
      let updateQuery: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: key
      ]
      
      let updateAttributes: [String: Any] = [
        kSecValueData as String: valueData
      ]
      
      let updateStatus = SecItemUpdate(updateQuery as CFDictionary, updateAttributes as CFDictionary)
      guard updateStatus == errSecSuccess else {
        throw KeychainError.unexpectedStatus(updateStatus)
      }
    } else if status != errSecSuccess {
      throw KeychainError.unexpectedStatus(status)
    }
  }
  
  func retrieve(key: String) throws -> String {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne
    ]
    
    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    guard status == errSecSuccess else {
      if status == errSecItemNotFound {
        throw KeychainError.itemNotFound
      }
      throw KeychainError.unexpectedStatus(status)
    }
    
    guard let data = result as? Data,
          let string = String(data: data, encoding: .utf8) else {
      throw KeychainError.invalidItemFormat
    }
    
    return string
  }
  
  func delete(key: String) throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key
    ]
    
    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw KeychainError.unexpectedStatus(status)
    }
  }
  
  func getAllKeys() throws -> [String] {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecReturnAttributes as String: true,
      kSecMatchLimit as String: kSecMatchLimitAll
    ]
    
    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    guard status == errSecSuccess else {
      if status == errSecItemNotFound {
        return []
      }
      throw KeychainError.unexpectedStatus(status)
    }
    
    guard let items = result as? [[String: Any]] else {
      return []
    }
    
    return items.compactMap { $0[kSecAttrAccount as String] as? String }
  }
  
  func clearAll() throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service
    ]
    
    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw KeychainError.unexpectedStatus(status)
    }
  }
}