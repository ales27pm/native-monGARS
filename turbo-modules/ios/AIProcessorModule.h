#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface AIProcessorModule : NSObject <RCTBridgeModule, RCTTurboModule>

// AI Processing Methods
- (void)optimizePrompt:(NSString *)prompt
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (void)processResponse:(NSString *)response
               provider:(NSString *)provider
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject;

// Context Management
- (void)setContext:(NSString *)context
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (void)getContext:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (void)clearContext:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject;

// Performance Optimization
- (void)preloadModel:(NSString *)modelName
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject;

- (void)getModelStatus:(NSString *)modelName
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

// Privacy Features
- (void)sanitizeInput:(NSString *)input
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

- (void)checkForSensitiveData:(NSString *)text
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject;

// Caching and Performance
- (void)cacheResponse:(NSString *)key
             response:(NSString *)response
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

- (void)getCachedResponse:(NSString *)key
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject;

- (void)clearCache:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (void)getCacheStats:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END