#import "AIProcessorModule.h"
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>

@implementation AIProcessorModule

// Private properties for caching and context
@property (nonatomic, strong) NSMutableDictionary *responseCache;
@property (nonatomic, strong) NSString *currentContext;
@property (nonatomic, strong) NSMutableDictionary *modelStatus;
@property (nonatomic, assign) NSInteger cacheHits;
@property (nonatomic, assign) NSInteger totalRequests;

RCT_EXPORT_MODULE()

- (instancetype)init {
    if (self = [super init]) {
        _responseCache = [[NSMutableDictionary alloc] init];
        _currentContext = @"";
        _modelStatus = [[NSMutableDictionary alloc] init];
        _cacheHits = 0;
        _totalRequests = 0;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeAIProcessorModuleSpecJSI>(params);
}

#pragma mark - AI Processing Methods

RCT_EXPORT_METHOD(optimizePrompt:(NSString *)prompt
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // Optimize prompt by removing redundancy and improving clarity
        NSString *optimized = [self performPromptOptimization:prompt];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            resolve(optimized);
        });
    });
}

RCT_EXPORT_METHOD(processResponse:(NSString *)response
                         provider:(NSString *)provider
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSTimeInterval startTime = [[NSDate date] timeIntervalSince1970];
        
        // Process response based on provider
        NSString *processedText = [self processResponseForProvider:response provider:provider];
        double confidence = [self calculateConfidence:processedText];
        
        NSTimeInterval processingTime = ([[NSDate date] timeIntervalSince1970] - startTime) * 1000;
        
        NSDictionary *result = @{
            @"processedText": processedText,
            @"confidence": @(confidence),
            @"processingTime": @(processingTime)
        };
        
        dispatch_async(dispatch_get_main_queue(), ^{
            resolve(result);
        });
    });
}

#pragma mark - Context Management

RCT_EXPORT_METHOD(setContext:(NSString *)context
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject) {
    self.currentContext = context ?: @"";
    resolve(@YES);
}

RCT_EXPORT_METHOD(getContext:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject) {
    resolve(self.currentContext ?: @"");
}

RCT_EXPORT_METHOD(clearContext:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject) {
    self.currentContext = @"";
    resolve(@YES);
}

#pragma mark - Performance Optimization

RCT_EXPORT_METHOD(preloadModel:(NSString *)modelName
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // Simulate model preloading
        [NSThread sleepForTimeInterval:0.5];
        
        self.modelStatus[modelName] = @{
            @"loaded": @YES,
            @"size": @(arc4random_uniform(100) + 50), // MB
            @"lastUsed": @([[NSDate date] timeIntervalSince1970])
        };
        
        dispatch_async(dispatch_get_main_queue(), ^{
            resolve(@YES);
        });
    });
}

RCT_EXPORT_METHOD(getModelStatus:(NSString *)modelName
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
    NSDictionary *status = self.modelStatus[modelName];
    if (status) {
        resolve(status);
    } else {
        resolve(@{
            @"loaded": @NO,
            @"size": @0,
            @"lastUsed": @0
        });
    }
}

#pragma mark - Privacy Features

RCT_EXPORT_METHOD(sanitizeInput:(NSString *)input
                        resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject) {
    NSString *sanitized = [self sanitizeText:input];
    resolve(sanitized);
}

RCT_EXPORT_METHOD(checkForSensitiveData:(NSString *)text
                                resolve:(RCTPromiseResolveBlock)resolve
                                 reject:(RCTPromiseRejectBlock)reject) {
    NSDictionary *result = [self detectSensitiveData:text];
    resolve(result);
}

#pragma mark - Caching and Performance

RCT_EXPORT_METHOD(cacheResponse:(NSString *)key
                        response:(NSString *)response
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
    self.responseCache[key] = response;
    resolve(@YES);
}

RCT_EXPORT_METHOD(getCachedResponse:(NSString *)key
                            resolve:(RCTPromiseResolveBlock)resolve
                             reject:(RCTPromiseRejectBlock)reject) {
    self.totalRequests++;
    NSString *cached = self.responseCache[key];
    if (cached) {
        self.cacheHits++;
        resolve(cached);
    } else {
        resolve([NSNull null]);
    }
}

RCT_EXPORT_METHOD(clearCache:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject) {
    [self.responseCache removeAllObjects];
    resolve(@YES);
}

RCT_EXPORT_METHOD(getCacheStats:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
    double hitRate = self.totalRequests > 0 ? (double)self.cacheHits / self.totalRequests : 0.0;
    
    NSDictionary *stats = @{
        @"size": @(self.responseCache.count),
        @"hitRate": @(hitRate),
        @"totalRequests": @(self.totalRequests)
    };
    
    resolve(stats);
}

#pragma mark - Private Helper Methods

- (NSString *)performPromptOptimization:(NSString *)prompt {
    // Basic prompt optimization
    NSString *trimmed = [prompt stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    
    // Remove duplicate words
    NSArray *words = [trimmed componentsSeparatedByString:@" "];
    NSMutableArray *uniqueWords = [[NSMutableArray alloc] init];
    NSMutableSet *seen = [[NSMutableSet alloc] init];
    
    for (NSString *word in words) {
        if (![seen containsObject:[word lowercaseString]]) {
            [uniqueWords addObject:word];
            [seen addObject:[word lowercaseString]];
        }
    }
    
    return [uniqueWords componentsJoinedByString:@" "];
}

- (NSString *)processResponseForProvider:(NSString *)response provider:(NSString *)provider {
    // Provider-specific processing
    if ([provider isEqualToString:@"anthropic"]) {
        return [self processAnthropicResponse:response];
    } else if ([provider isEqualToString:@"openai"]) {
        return [self processOpenAIResponse:response];
    } else if ([provider isEqualToString:@"grok"]) {
        return [self processGrokResponse:response];
    }
    
    return response;
}

- (NSString *)processAnthropicResponse:(NSString *)response {
    // Clean up common Anthropic response patterns
    return [response stringByReplacingOccurrencesOfString:@"I'm Claude, " withString:@""];
}

- (NSString *)processOpenAIResponse:(NSString *)response {
    // Clean up common OpenAI response patterns
    return [response stringByReplacingOccurrencesOfString:@"As an AI assistant, " withString:@""];
}

- (NSString *)processGrokResponse:(NSString *)response {
    // Clean up common Grok response patterns
    return response;
}

- (double)calculateConfidence:(NSString *)text {
    // Simple confidence calculation based on text characteristics
    NSUInteger length = text.length;
    if (length < 10) return 0.3;
    if (length < 50) return 0.6;
    if (length < 200) return 0.8;
    return 0.95;
}

- (NSString *)sanitizeText:(NSString *)text {
    // Remove potential sensitive patterns
    NSMutableString *sanitized = [text mutableCopy];
    
    // Remove email patterns
    NSRegularExpression *emailRegex = [NSRegularExpression regularExpressionWithPattern:@"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b" options:0 error:nil];
    [emailRegex replaceMatchesInString:sanitized options:0 range:NSMakeRange(0, sanitized.length) withTemplate:@"[EMAIL]"];
    
    // Remove phone patterns
    NSRegularExpression *phoneRegex = [NSRegularExpression regularExpressionWithPattern:@"\\b\\d{3}-\\d{3}-\\d{4}\\b" options:0 error:nil];
    [phoneRegex replaceMatchesInString:sanitized options:0 range:NSMakeRange(0, sanitized.length) withTemplate:@"[PHONE]"];
    
    return [sanitized copy];
}

- (NSDictionary *)detectSensitiveData:(NSString *)text {
    NSMutableArray *sensitiveTypes = [[NSMutableArray alloc] init];
    BOOL hasSensitiveData = NO;
    
    // Check for email
    NSRegularExpression *emailRegex = [NSRegularExpression regularExpressionWithPattern:@"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b" options:0 error:nil];
    if ([emailRegex numberOfMatchesInString:text options:0 range:NSMakeRange(0, text.length)] > 0) {
        [sensitiveTypes addObject:@"email"];
        hasSensitiveData = YES;
    }
    
    // Check for phone
    NSRegularExpression *phoneRegex = [NSRegularExpression regularExpressionWithPattern:@"\\b\\d{3}-\\d{3}-\\d{4}\\b" options:0 error:nil];
    if ([phoneRegex numberOfMatchesInString:text options:0 range:NSMakeRange(0, text.length)] > 0) {
        [sensitiveTypes addObject:@"phone"];
        hasSensitiveData = YES;
    }
    
    // Check for SSN pattern
    NSRegularExpression *ssnRegex = [NSRegularExpression regularExpressionWithPattern:@"\\b\\d{3}-\\d{2}-\\d{4}\\b" options:0 error:nil];
    if ([ssnRegex numberOfMatchesInString:text options:0 range:NSMakeRange(0, text.length)] > 0) {
        [sensitiveTypes addObject:@"ssn"];
        hasSensitiveData = YES;
    }
    
    return @{
        @"hasSensitiveData": @(hasSensitiveData),
        @"sensitiveTypes": sensitiveTypes
    };
}

@end