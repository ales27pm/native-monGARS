import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocalLLMModule } from '../services/TurboModuleRegistry';

interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
  size: string;
  downloadURL: string;
  capabilities: string[];
  recommended: boolean;
}

interface DownloadedModel {
  name: string;
  size: number;
  downloadDate: number;
  loaded: boolean;
}

interface DownloadProgress {
  modelName: string;
  isDownloading: boolean;
  bytesReceived?: number;
  totalBytes?: number;
  progress: number;
}

// Available Core ML models for download
const AVAILABLE_MODELS: ModelInfo[] = [
  {
    name: 'Llama-3.2-3B-Instruct',
    displayName: 'Llama 3.2 3B Instruct',
    description: 'Fast, efficient model for general conversations and text generation. Optimized for mobile devices.',
    size: '1.8 GB',
    downloadURL: 'https://huggingface.co/apple/Llama-3.2-3B-Instruct-4bit/resolve/main/Llama-3.2-3B-Instruct-4bit.mlpackage',
    capabilities: ['chat', 'instruction-following', 'text-generation'],
    recommended: true,
  },
  {
    name: 'Llama-3.2-1B-Instruct',
    displayName: 'Llama 3.2 1B Instruct',
    description: 'Ultra-lightweight model for basic conversations. Fastest inference on mobile.',
    size: '650 MB',
    downloadURL: 'https://huggingface.co/apple/Llama-3.2-1B-Instruct-4bit/resolve/main/Llama-3.2-1B-Instruct-4bit.mlpackage',
    capabilities: ['chat', 'instruction-following'],
    recommended: false,
  },
  {
    name: 'OpenELM-3B-Instruct',
    displayName: 'OpenELM 3B Instruct',
    description: 'Apple\'s open-source efficient language model for on-device inference.',
    size: '1.6 GB',
    downloadURL: 'https://huggingface.co/apple/OpenELM-3B-Instruct/resolve/main/OpenELM-3B-Instruct.mlpackage',
    capabilities: ['chat', 'reasoning', 'code-generation'],
    recommended: false,
  },
];

export default function ModelDownloadManager() {
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [availableSpace, setAvailableSpace] = useState<{
    freeSpace: number;
    totalSpace: number;
    usedSpace: number;
  } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<ModelInfo | null>(null);

  useEffect(() => {
    loadDownloadedModels();
    loadAvailableSpace();
    
    // Set up progress monitoring for downloads
    const progressInterval = setInterval(() => {
      monitorDownloadProgress();
    }, 1000);

    return () => clearInterval(progressInterval);
  }, []);

  const loadDownloadedModels = async () => {
    try {
      if (LocalLLMModule) {
        const models = await LocalLLMModule?.listDownloadedModels() || [];
        setDownloadedModels(models);
      }
    } catch (error) {
      console.error('Failed to load downloaded models:', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSpace = async () => {
    try {
      if (LocalLLMModule) {
        const space = await LocalLLMModule.getAvailableSpace();
        setAvailableSpace(space);
      }
    } catch (error) {
      console.error('Failed to get available space:', (error as Error).message);
    }
  };

  const monitorDownloadProgress = async () => {
    const updatedProgress = new Map();
    
    for (const model of AVAILABLE_MODELS) {
      try {
        if (LocalLLMModule) {
          const progress = await LocalLLMModule.getDownloadProgress(model.name);
          if (progress.isDownloading) {
            updatedProgress.set(model.name, progress);
          }
        }
      } catch (error) {
        // Model not being downloaded or LocalLLMModule not available
      }
    }
    
    setDownloadProgress(updatedProgress);
  };

  const downloadModel = async (model: ModelInfo) => {
    try {
      if (!LocalLLMModule) {
        Alert.alert('Error', 'Local LLM module not available');
        return;
      }

      // Check available space
      if (availableSpace) {
        const modelSizeBytes = parseFloat(model.size) * 1024 * 1024 * 1024; // Convert GB to bytes
        if (availableSpace.freeSpace < modelSizeBytes) {
          Alert.alert(
            'Insufficient Space',
            `This model requires ${model.size} but you only have ${(availableSpace.freeSpace / (1024 * 1024 * 1024)).toFixed(1)} GB available.`
          );
          return;
        }
      }

      Alert.alert(
        'Download Model',
        `Download ${model.displayName} (${model.size})?\n\nThis model will be stored locally on your device for fast, private inference.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: async () => {
              try {
                const result = await LocalLLMModule.downloadModel(model.name, model.downloadURL);
                if (result.downloadStarted) {
                  Alert.alert('Download Started', `${model.displayName} download has begun.`);
                }
              } catch (error) {
                console.error('Download failed:', error);
                Alert.alert('Download Failed', `Failed to start download: ${error.message}`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to start download');
    }
  };

  const cancelDownload = async (modelName: string) => {
    try {
      if (LocalLLMModule) {
        const cancelled = await LocalLLMModule.cancelDownload(modelName);
        if (cancelled) {
          Alert.alert('Download Cancelled', 'Model download has been cancelled.');
          setDownloadProgress(prev => {
            const updated = new Map(prev);
            updated.delete(modelName);
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Cancel download failed:', error);
    }
  };

  const deleteModel = async (modelName: string) => {
    Alert.alert(
      'Delete Model',
      'Are you sure you want to delete this model? You will need to download it again to use it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (LocalLLMModule) {
                await LocalLLMModule.deleteModel(modelName);
                await loadDownloadedModels();
                await loadAvailableSpace();
                Alert.alert('Model Deleted', 'Model has been removed from your device.');
              }
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', 'Failed to delete model');
            }
          },
        },
      ]
    );
  };

  const loadModel = async (modelName: string) => {
    try {
      if (LocalLLMModule) {
        const success = await LocalLLMModule.loadModel(modelName);
        if (success) {
          Alert.alert('Model Loaded', 'Model is now ready for inference.');
          await loadDownloadedModels();
        }
      }
    } catch (error) {
      console.error('Load model failed:', error);
      Alert.alert('Error', 'Failed to load model');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const ModelCard = ({ model, isDownloaded = false, downloadedModel }: {
    model: ModelInfo;
    isDownloaded?: boolean;
    downloadedModel?: DownloadedModel;
  }) => {
    const progress = downloadProgress.get(model.name);
    const isDownloading = !!progress?.isDownloading;

    return (
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: model.recommended ? 2 : 1,
        borderColor: model.recommended ? '#10B981' : '#E5E7EB',
      }}>
        {model.recommended && (
          <View style={{
            position: 'absolute',
            top: -8,
            left: 16,
            backgroundColor: '#10B981',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
              RECOMMENDED
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
              {model.displayName}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              {model.description}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="hardware-chip" size={16} color="#6B7280" />
              <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>
                {model.size}
              </Text>
              {isDownloaded && downloadedModel && (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 8 }} />
                  <Text style={{ fontSize: 12, color: '#10B981', marginLeft: 4 }}>
                    Downloaded
                  </Text>
                </>
              )}
            </View>
          </View>
          
          <Pressable
            onPress={() => setShowDetailsModal(model)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: '#F3F4F6',
            }}
          >
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Capabilities */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {model.capabilities.map((capability) => (
            <View
              key={capability}
              style={{
                backgroundColor: '#EFF6FF',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                marginRight: 8,
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '500' }}>
                {capability}
              </Text>
            </View>
          ))}
        </View>

        {/* Download Progress */}
        {isDownloading && progress && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Downloading...</Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {(progress.progress * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={{
              height: 4,
              backgroundColor: '#E5E7EB',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${progress.progress * 100}%`,
                backgroundColor: '#3B82F6',
              }} />
            </View>
            {progress.bytesReceived && progress.totalBytes && (
              <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>
                {formatBytes(progress.bytesReceived)} / {formatBytes(progress.totalBytes)}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {!isDownloaded && !isDownloading && (
            <Pressable
              onPress={() => downloadModel(model)}
              style={{
                flex: 1,
                backgroundColor: '#3B82F6',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 4 }}>
                  Download
                </Text>
              </View>
            </Pressable>
          )}

          {isDownloading && (
            <Pressable
              onPress={() => cancelDownload(model.name)}
              style={{
                flex: 1,
                backgroundColor: '#EF4444',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="stop-outline" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 4 }}>
                  Cancel
                </Text>
              </View>
            </Pressable>
          )}

          {isDownloaded && downloadedModel && (
            <>
              <Pressable
                onPress={() => loadModel(model.name)}
                style={{
                  flex: 1,
                  backgroundColor: downloadedModel.loaded ? '#10B981' : '#3B82F6',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons 
                    name={downloadedModel.loaded ? "checkmark-outline" : "play-outline"} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 4 }}>
                    {downloadedModel.loaded ? 'Loaded' : 'Load'}
                  </Text>
                </View>
              </Pressable>
              
              <Pressable
                onPress={() => deleteModel(model.name)}
                style={{
                  backgroundColor: '#EF4444',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading models...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 0 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
            Core ML Models
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 20 }}>
            Download and manage on-device AI models for private, fast inference
          </Text>

          {/* Storage Info */}
          {availableSpace && (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  Device Storage
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>
                  {formatBytes(availableSpace.freeSpace)} available
                </Text>
              </View>
              <View style={{
                height: 8,
                backgroundColor: '#E5E7EB',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${(availableSpace.usedSpace / availableSpace.totalSpace) * 100}%`,
                  backgroundColor: '#3B82F6',
                }} />
              </View>
            </View>
          )}
        </View>

        {/* Downloaded Models */}
        {downloadedModels.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
              Downloaded Models
            </Text>
            {AVAILABLE_MODELS.map((model) => {
              const downloadedModel = downloadedModels.find(dm => dm.name === model.name);
              if (!downloadedModel) return null;
              
              return (
                <ModelCard
                  key={model.name}
                  model={model}
                  isDownloaded={true}
                  downloadedModel={downloadedModel}
                />
              );
            })}
          </View>
        )}

        {/* Available Models */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
            Available Models
          </Text>
          {AVAILABLE_MODELS.map((model) => {
            const isDownloaded = downloadedModels.some(dm => dm.name === model.name);
            if (isDownloaded) return null;
            
            return <ModelCard key={model.name} model={model} />;
          })}
        </View>
      </ScrollView>

      {/* Model Details Modal */}
      <Modal
        visible={!!showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(null)}
      >
        {showDetailsModal && (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                  Model Details
                </Text>
                <Pressable
                  onPress={() => setShowDetailsModal(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <ScrollView>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
                  {showDetailsModal.displayName}
                </Text>
                <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 20, lineHeight: 24 }}>
                  {showDetailsModal.description}
                </Text>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
                    Specifications
                  </Text>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                    <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
                      Size: {showDetailsModal.size}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
                      Format: Core ML Package (.mlpackage)
                    </Text>
                    <Text style={{ fontSize: 14, color: '#374151' }}>
                      Optimization: 4-bit quantization for mobile
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
                    Capabilities
                  </Text>
                  {showDetailsModal.capabilities.map((capability) => (
                    <View
                      key={capability}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                        backgroundColor: '#F0F9FF',
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#0EA5E9" />
                      <Text style={{ fontSize: 14, color: '#0369A1', marginLeft: 8, textTransform: 'capitalize' }}>
                        {capability.replace('-', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="shield-checkmark" size={20} color="#D97706" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E', marginLeft: 8 }}>
                      Privacy & Security
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                    All inference happens locally on your device. No data is sent to external servers, 
                    ensuring complete privacy and security for your conversations.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}