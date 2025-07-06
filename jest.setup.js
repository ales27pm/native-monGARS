import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo modules
jest.mock('expo-av', () => ({
  Audio: {
    RecordingStatus: {},
    RecordingState: {},
    setAudioModeAsync: jest.fn(),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    Recording: jest.fn(() => ({
      prepareToRecordAsync: jest.fn(),
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn(),
      getStatusAsync: jest.fn(() => Promise.resolve({ isDoneRecording: true })),
    })),
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
  moveAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
}));

// Mock the development LLM service
jest.mock('./src/api/dev-llm-service', () => ({
  nativeLLMService: {
    getAvailableModels: jest.fn(() => Promise.resolve([
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
    ])),
    downloadModel: jest.fn(() => Promise.resolve()),
    loadModel: jest.fn(() => Promise.resolve()),
    deleteModel: jest.fn(() => Promise.resolve()),
    generateText: jest.fn(() => Promise.resolve({
      text: 'Mock AI response',
      tokenCount: 5,
      processingTime: 0.5
    })),
    on: jest.fn(() => () => {}),
    getCurrentModel: jest.fn(() => Promise.resolve(null)),
    getModelStats: jest.fn(() => Promise.resolve({
      availableModels: 1,
      downloadedModels: 0,
      activeModel: null
    })),
    destroy: jest.fn(),
    generateTextStream: jest.fn()
  }
}));

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
      LocalLLMModule: {
        downloadModel: jest.fn(),
        loadModel: jest.fn(),
        deleteModel: jest.fn(),
        getAvailableModels: jest.fn(),
        generateText: jest.fn(),
      }
    },
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      Version: '17.0',
    },
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Global test timeout
jest.setTimeout(10000);

// Console suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  jest.clearAllMocks();
});