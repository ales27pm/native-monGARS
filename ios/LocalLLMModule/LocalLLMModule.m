#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(LocalLLMModule, RCTEventEmitter)

// Model Management
RCT_EXTERN_METHOD(downloadModel:(NSString *)modelId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(loadModel:(NSString *)modelId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteModel:(NSString *)modelId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAvailableModels:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Text Generation
RCT_EXTERN_METHOD(generateText:(NSString *)prompt
                  maxTokens:(NSNumber *)maxTokens
                  temperature:(NSNumber *)temperature
                  topP:(NSNumber *)topP
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end