#import "LocalLLMModule.h"

@interface RCT_EXTERN_MODULE(LocalLLMModule, NSObject)

// Model Management
RCT_EXTERN_METHOD(loadModel:(NSString *)modelName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(unloadModel:(NSString *)modelName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getLoadedModels:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getModelInfo:(NSString *)modelName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// Model Download
RCT_EXTERN_METHOD(downloadModel:(NSString *)modelName downloadURL:(NSString *)downloadURL resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(cancelDownload:(NSString *)modelName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getDownloadProgress:(NSString *)modelName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(deleteModel:(NSString *)modelName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getAvailableSpace:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(listDownloadedModels:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// State Management
RCT_EXTERN_METHOD(initializeState:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(saveState:(NSString *)stateId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(loadState:(NSString *)stateId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(clearState:(NSString *)stateId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// Text Generation
RCT_EXTERN_METHOD(generateText:(NSString *)prompt options:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(generateStream:(NSString *)prompt options:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getStreamToken:(NSString *)sessionId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stopStream:(NSString *)sessionId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// Configuration
RCT_EXTERN_METHOD(setSystemPrompt:(NSString *)prompt stateId:(NSString *)stateId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getSystemPrompt:(NSString *)stateId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(addToContext:(NSString *)message role:(NSString *)role stateId:(NSString *)stateId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getContext:(NSString *)stateId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(clearContext:(NSString *)stateId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getPerformanceStats:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setModelConfig:(NSDictionary *)config resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getModelConfig:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end