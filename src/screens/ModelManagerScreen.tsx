import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { coreMLService, CoreMLModel, DownloadProgress } from '../api/core-ml-service';

interface ModelManagerScreenProps {
  onBack: () => void;
}

export default function ModelManagerScreen({ onBack }: ModelManagerScreenProps) {
  const [models, setModels] = useState<CoreMLModel[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<CoreMLModel | null>(null);
  const [storageInfo, setStorageInfo] = useState({ totalUsed: '0 GB', available: '64 GB' });

  useEffect(() => {
    loadModels();
    updateStorageInfo();

    const unsubscribe = coreMLService.onDownloadProgress((progress) => {
      setDownloadProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(progress.modelId, progress);
        return newMap;
      });

      if (progress.status === 'completed') {
        loadModels();
        updateStorageInfo();
        setTimeout(() => {
          setDownloadProgress(prev => {
            const newMap = new Map(prev);
            newMap.delete(progress.modelId);
            return newMap;
          });
        }, 2000);
      }
    });

    return unsubscribe;
  }, []);

  const loadModels = () => {
    setModels(coreMLService.getAvailableModels());
  };

  const updateStorageInfo = () => {
    setStorageInfo(coreMLService.getStorageInfo());
  };

  const handleDownloadModel = async (model: CoreMLModel) => {
    setSelectedModel(model);
    setShowDownloadModal(true);
  };

  const confirmDownload = async () => {
    if (!selectedModel) return;

    setShowDownloadModal(false);
    
    try {
      await coreMLService.downloadModel(selectedModel.id);
      Alert.alert(
        "Download Complete",
        `${selectedModel.name} has been successfully downloaded and is ready to use!`
      );
    } catch (error) {
      Alert.alert(
        "Download Failed",
        `Failed to download ${selectedModel.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleActivateModel = async (model: CoreMLModel) => {
    try {
      await coreMLService.activateModel(model.id);
      loadModels();
      Alert.alert(
        "Model Activated",
        `${model.name} is now your active AI model. All conversations will use this model.`
      );
    } catch (error) {
      Alert.alert(
        "Activation Failed",
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleDeleteModel = async (model: CoreMLModel) => {
    Alert.alert(
      "Delete Model",
      `Are you sure you want to delete ${model.name}? This will free up ${model.size} of storage.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await coreMLService.deleteModel(model.id);
              loadModels();
              updateStorageInfo();
              Alert.alert("Model Deleted", `${model.name} has been removed from your device.`);
            } catch (error) {
              Alert.alert(
                "Delete Failed",
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          }
        }
      ]
    );
  };

  const getModelStatusColor = (model: CoreMLModel) => {
    if (model.isActive) return '#22c55e';
    if (model.isDownloaded) return '#3b82f6';
    return '#6b7280';
  };

  const getModelStatusText = (model: CoreMLModel) => {
    if (model.isActive) return 'Active';
    if (model.isDownloaded) return 'Downloaded';
    return 'Available';
  };

  const renderModelCard = (model: CoreMLModel) => {
    const progress = downloadProgress.get(model.id);
    const isDownloading = progress && progress.status !== 'completed';

    return (
      <View
        key={model.id}
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderWidth: model.isActive ? 2 : 0,
          borderColor: model.isActive ? '#22c55e' : 'transparent'
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{
            width: 50,
            height: 50,
            backgroundColor: getModelStatusColor(model),
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16
          }}>
            <Ionicons 
              name={model.isActive ? "checkmark-circle" : (model.isDownloaded ? "download" : "cloud-download-outline")} 
              size={24} 
              color="white" 
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 }}>
                {model.name}
              </Text>
              <View style={{
                backgroundColor: getModelStatusColor(model),
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>
                  {getModelStatusText(model)}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              {model.description}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="hardware-chip" size={16} color="#666" />
              <Text style={{ fontSize: 14, color: '#666', marginLeft: 4, marginRight: 16 }}>
                {model.size}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {model.capabilities.slice(0, 2).map((capability, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: '#f3f4f6',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                      marginRight: 4
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>
                      {capability}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {isDownloading && progress && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {progress.status === 'downloading' ? 'Downloading...' : 'Installing...'}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#007AFF' }}>
                {Math.round(progress.progress)}%
              </Text>
            </View>
            <View style={{
              height: 6,
              backgroundColor: '#e5e7eb',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <View style={{
                height: '100%',
                width: `${progress.progress}%`,
                backgroundColor: '#007AFF',
                borderRadius: 3
              }} />
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {!model.isDownloaded && !isDownloading && (
            <Pressable
              style={{
                flex: 1,
                backgroundColor: '#007AFF',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center'
              }}
              onPress={() => handleDownloadModel(model)}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                Download
              </Text>
            </Pressable>
          )}

          {model.isDownloaded && !model.isActive && (
            <Pressable
              style={{
                flex: 1,
                backgroundColor: '#22c55e',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center'
              }}
              onPress={() => handleActivateModel(model)}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                Activate
              </Text>
            </Pressable>
          )}

          {model.isActive && (
            <View
              style={{
                flex: 1,
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 14 }}>
                Currently Active
              </Text>
            </View>
          )}

          {model.isDownloaded && !model.isActive && (
            <Pressable
              style={{
                backgroundColor: '#ef4444',
                borderRadius: 12,
                padding: 12,
                paddingHorizontal: 16
              }}
              onPress={() => handleDeleteModel(model)}
            >
              <Ionicons name="trash-outline" size={16} color="white" />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <Pressable onPress={onBack} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>Core ML Models</Text>
      </View>

      {/* Storage Info */}
      <View style={{
        backgroundColor: '#dbeafe',
        margin: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#3b82f6'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="hardware-chip" size={20} color="#1d4ed8" />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1d4ed8', marginLeft: 8 }}>
            Storage Usage
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, color: '#1e40af' }}>
            Used: {storageInfo.totalUsed}
          </Text>
          <Text style={{ fontSize: 14, color: '#1e40af' }}>
            Available: {storageInfo.available}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        {models.map(renderModelCard)}
      </ScrollView>

      {/* Download Confirmation Modal */}
      <Modal
        visible={showDownloadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDownloadModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>
              Download Model
            </Text>
            {selectedModel && (
              <>
                <Text style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
                  Download {selectedModel.name} ({selectedModel.size})?
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                  This model will be downloaded and stored locally on your device for private AI processing.
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    style={{
                      flex: 1,
                      backgroundColor: '#f3f4f6',
                      borderRadius: 12,
                      padding: 16,
                      alignItems: 'center'
                    }}
                    onPress={() => setShowDownloadModal(false)}
                  >
                    <Text style={{ color: '#6b7280', fontWeight: '600' }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={{
                      flex: 1,
                      backgroundColor: '#007AFF',
                      borderRadius: 12,
                      padding: 16,
                      alignItems: 'center'
                    }}
                    onPress={confirmDownload}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                      Download
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}