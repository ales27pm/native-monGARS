package com.mongars.turbomodules;

import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@ReactModule(name = AIProcessorModule.NAME)
public class AIProcessorModule extends ReactContextBaseJavaModule {
    public static final String NAME = "AIProcessorModule";
    
    private final ExecutorService executorService;
    private final Handler mainHandler;
    private final Map<String, String> responseCache;
    private final Map<String, Map<String, Object>> modelStatus;
    private String currentContext = "";
    private int cacheHits = 0;
    private int totalRequests = 0;

    public AIProcessorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.executorService = Executors.newCachedThreadPool();
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.responseCache = new HashMap<>();
        this.modelStatus = new HashMap<>();
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void optimizePrompt(String prompt, Promise promise) {
        executorService.execute(() -> {
            try {
                String optimized = performPromptOptimization(prompt);
                mainHandler.post(() -> promise.resolve(optimized));
            } catch (Exception e) {
                mainHandler.post(() -> promise.reject("OPTIMIZATION_ERROR", e.getMessage()));
            }
        });
    }

    @ReactMethod
    public void processResponse(String response, String provider, Promise promise) {
        executorService.execute(() -> {
            try {
                long startTime = System.currentTimeMillis();
                
                String processedText = processResponseForProvider(response, provider);
                double confidence = calculateConfidence(processedText);
                long processingTime = System.currentTimeMillis() - startTime;
                
                WritableMap result = Arguments.createMap();
                result.putString("processedText", processedText);
                result.putDouble("confidence", confidence);
                result.putDouble("processingTime", processingTime);
                
                mainHandler.post(() -> promise.resolve(result));
            } catch (Exception e) {
                mainHandler.post(() -> promise.reject("PROCESSING_ERROR", e.getMessage()));
            }
        });
    }

    @ReactMethod
    public void setContext(String context, Promise promise) {
        this.currentContext = context != null ? context : "";
        promise.resolve(true);
    }

    @ReactMethod
    public void getContext(Promise promise) {
        promise.resolve(this.currentContext);
    }

    @ReactMethod
    public void clearContext(Promise promise) {
        this.currentContext = "";
        promise.resolve(true);
    }

    @ReactMethod
    public void preloadModel(String modelName, Promise promise) {
        executorService.execute(() -> {
            try {
                // Simulate model preloading
                Thread.sleep(500);
                
                Map<String, Object> status = new HashMap<>();
                status.put("loaded", true);
                status.put("size", 50 + (int)(Math.random() * 100));
                status.put("lastUsed", System.currentTimeMillis() / 1000);
                
                this.modelStatus.put(modelName, status);
                
                mainHandler.post(() -> promise.resolve(true));
            } catch (Exception e) {
                mainHandler.post(() -> promise.reject("PRELOAD_ERROR", e.getMessage()));
            }
        });
    }

    @ReactMethod
    public void getModelStatus(String modelName, Promise promise) {
        Map<String, Object> status = this.modelStatus.get(modelName);
        if (status != null) {
            WritableMap result = Arguments.createMap();
            result.putBoolean("loaded", (Boolean) status.get("loaded"));
            result.putInt("size", (Integer) status.get("size"));
            result.putDouble("lastUsed", ((Long) status.get("lastUsed")).doubleValue());
            promise.resolve(result);
        } else {
            WritableMap result = Arguments.createMap();
            result.putBoolean("loaded", false);
            result.putInt("size", 0);
            result.putDouble("lastUsed", 0);
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void sanitizeInput(String input, Promise promise) {
        String sanitized = sanitizeText(input);
        promise.resolve(sanitized);
    }

    @ReactMethod
    public void checkForSensitiveData(String text, Promise promise) {
        WritableMap result = detectSensitiveData(text);
        promise.resolve(result);
    }

    @ReactMethod
    public void cacheResponse(String key, String response, Promise promise) {
        this.responseCache.put(key, response);
        promise.resolve(true);
    }

    @ReactMethod
    public void getCachedResponse(String key, Promise promise) {
        this.totalRequests++;
        String cached = this.responseCache.get(key);
        if (cached != null) {
            this.cacheHits++;
            promise.resolve(cached);
        } else {
            promise.resolve(null);
        }
    }

    @ReactMethod
    public void clearCache(Promise promise) {
        this.responseCache.clear();
        promise.resolve(true);
    }

    @ReactMethod
    public void getCacheStats(Promise promise) {
        double hitRate = this.totalRequests > 0 ? (double) this.cacheHits / this.totalRequests : 0.0;
        
        WritableMap stats = Arguments.createMap();
        stats.putInt("size", this.responseCache.size());
        stats.putDouble("hitRate", hitRate);
        stats.putInt("totalRequests", this.totalRequests);
        
        promise.resolve(stats);
    }

    // Private helper methods
    private String performPromptOptimization(String prompt) {
        String trimmed = prompt.trim();
        
        // Basic deduplication
        String[] words = trimmed.split("\\s+");
        StringBuilder result = new StringBuilder();
        String lastWord = "";
        
        for (String word : words) {
            if (!word.toLowerCase().equals(lastWord.toLowerCase())) {
                if (result.length() > 0) {
                    result.append(" ");
                }
                result.append(word);
                lastWord = word;
            }
        }
        
        return result.toString();
    }

    private String processResponseForProvider(String response, String provider) {
        switch (provider.toLowerCase()) {
            case "anthropic":
                return response.replaceAll("I'm Claude, ", "");
            case "openai":
                return response.replaceAll("As an AI assistant, ", "");
            case "grok":
                return response;
            default:
                return response;
        }
    }

    private double calculateConfidence(String text) {
        int length = text.length();
        if (length < 10) return 0.3;
        if (length < 50) return 0.6;
        if (length < 200) return 0.8;
        return 0.95;
    }

    private String sanitizeText(String text) {
        String sanitized = text;
        
        // Remove email patterns
        sanitized = sanitized.replaceAll("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", "[EMAIL]");
        
        // Remove phone patterns
        sanitized = sanitized.replaceAll("\\b\\d{3}-\\d{3}-\\d{4}\\b", "[PHONE]");
        
        // Remove SSN patterns
        sanitized = sanitized.replaceAll("\\b\\d{3}-\\d{2}-\\d{4}\\b", "[SSN]");
        
        return sanitized;
    }

    private WritableMap detectSensitiveData(String text) {
        WritableMap result = Arguments.createMap();
        boolean hasSensitiveData = false;
        
        // Check for email
        Pattern emailPattern = Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");
        Matcher emailMatcher = emailPattern.matcher(text);
        boolean hasEmail = emailMatcher.find();
        
        // Check for phone
        Pattern phonePattern = Pattern.compile("\\b\\d{3}-\\d{3}-\\d{4}\\b");
        Matcher phoneMatcher = phonePattern.matcher(text);
        boolean hasPhone = phoneMatcher.find();
        
        // Check for SSN
        Pattern ssnPattern = Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");
        Matcher ssnMatcher = ssnPattern.matcher(text);
        boolean hasSSN = ssnMatcher.find();
        
        if (hasEmail || hasPhone || hasSSN) {
            hasSensitiveData = true;
        }
        
        result.putBoolean("hasSensitiveData", hasSensitiveData);
        
        // Create sensitive types array
        com.facebook.react.bridge.WritableArray types = Arguments.createArray();
        if (hasEmail) types.pushString("email");
        if (hasPhone) types.pushString("phone");
        if (hasSSN) types.pushString("ssn");
        
        result.putArray("sensitiveTypes", types);
        
        return result;
    }
}