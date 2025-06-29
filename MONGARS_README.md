# monGARS - React Native Edition

**Privacy-First AI Assistant** inspired by the original Swift implementation, built with React Native and Expo.

## ✨ Features

### 🔐 **Privacy & Security**
- **100% On-Device Processing**: All sensitive data stays on your device
- **Biometric Authentication**: Face ID/Touch ID protection (with mock fallback for demo)
- **Encrypted Local Storage**: SQLite database with security measures
- **Complete Audit Trail**: Full logging of all security events

### 🤖 **AI Capabilities**
- **Streaming Conversations**: Real-time token-by-token responses
- **Contextual Memory**: Automatic storage and retrieval of conversation context
- **French Canadian Language**: Native French interface and responses
- **Text-to-Speech**: Optional voice output for responses

### 📱 **User Experience**
- **Onboarding Flow**: Step-by-step setup with biometric configuration
- **Native iOS Design**: Following Apple's Human Interface Guidelines
- **Memory Explorer**: Browse and manage stored conversations
- **Settings Dashboard**: Complete privacy and data management controls
- **Emergency Controls**: "Panic Wipe" for complete data deletion

## 🏗️ Architecture

### **Core Services**
```
src/services/
├── AuthenticationService.ts    # Biometric auth with fallback
├── MockBiometricService.ts    # Demo authentication
├── AssistantService.ts        # AI conversation management
├── MemoryService.ts          # Local data storage
└── AuditService.ts           # Security event logging
```

### **Screens**
```
src/screens/
├── OnboardingScreen.tsx       # Welcome & setup flow
├── ChatScreen.tsx            # Main conversation interface
├── SettingsScreen.tsx        # Privacy controls & management
└── MemoryExplorerScreen.tsx  # Memory browser & search
```

### **State Management**
- **Zustand** with AsyncStorage persistence
- Separate state for app settings vs session data
- Secure storage patterns for sensitive information

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Start the development server**:
   ```bash
   bun start
   ```

3. **Open the app**:
   - iOS Simulator: Press `i`
   - Physical device: Scan QR code with Expo Go

## 🔧 Configuration

### **Environment Variables**
The app uses pre-configured API keys for AI services:
- `EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY`
- `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY`
- `EXPO_PUBLIC_VIBECODE_GROK_API_KEY`

### **Biometric Authentication**
- **Production**: Uses `expo-local-authentication` for real Face ID/Touch ID
- **Demo Mode**: Falls back to mock authentication with user prompts
- **Configuration**: Automatically detects availability and adapts

## 📊 Data Management

### **Local Storage**
- **Conversations**: Encrypted SQLite database
- **User Preferences**: AsyncStorage with Zustand persistence
- **Audit Logs**: Separate secure database for security events
- **Memory System**: Searchable conversation context storage

### **Privacy Features**
- **No Cloud Dependencies**: All processing happens locally
- **Biometric Gates**: Authentication required for sensitive operations
- **Audit Trail**: Complete logging of data access and modifications
- **Emergency Wipe**: Secure deletion of all user data

## 🛡️ Security Model

### **Authentication Flow**
1. Initial onboarding with biometric setup
2. Biometric authentication required for app access
3. Additional authentication for sensitive operations
4. Session management with automatic locking

### **Data Protection**
- Encrypted local databases
- Secure key storage
- Audit logging of all operations
- Emergency data deletion capabilities

## 🎨 UI/UX Design

### **Design Principles**
- **Apple Human Interface Guidelines**: Native iOS feel
- **Privacy-First**: Clear indicators of local processing
- **Accessibility**: Proper contrast, readable fonts, clear navigation
- **French Localization**: Complete French Canadian interface

### **Key Components**
- **MessageBubble**: Streaming conversation interface
- **DemoNotice**: Transparent demo mode indication
- **AppInfo**: Privacy and security feature highlights
- **LoadingIndicator**: Consistent loading states

## 🔄 AI Integration

### **Supported Models**
- **Anthropic Claude 3.5 Sonnet**: Primary conversation model
- **OpenAI GPT-4**: Alternative with image support
- **Grok**: Additional model option

### **Features**
- **Streaming Responses**: Token-by-token display
- **Context Management**: Automatic memory integration
- **French Prompting**: Native French conversation prompts
- **Error Handling**: Graceful fallbacks and user feedback

## 📈 Future Enhancements

### **Planned Features**
- **Voice Input**: Speech-to-text integration
- **Plugin System**: Extensible skill architecture
- **Advanced Memory**: Semantic search and categorization
- **Export Options**: Secure data export capabilities

### **Platform Expansion**
- **Android Support**: Full cross-platform compatibility
- **Web Version**: Browser-based interface
- **Desktop Apps**: Native desktop applications

## 🤝 Contributing

This implementation serves as a complete React Native equivalent to the original Swift monGARS codebase, maintaining all core privacy and security principles while adapting to the React Native ecosystem.

---

**monGARS React Native** - Your private AI assistant that never leaves your device.