import { AuditService } from './AuditService';
import FeatureFlagService, { FeatureFlags } from './FeatureFlagService';

export interface PerformanceMetrics {
  // App Performance
  coldStartTime?: number;
  warmStartTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  
  // LLM Performance
  inferenceTime?: number;
  tokensPerSecond?: number;
  modelLoadTime?: number;
  
  // Network Performance
  apiResponseTime?: number;
  networkLatency?: number;
  
  // User Experience
  frameRate?: number;
  uiResponseTime?: number;
  
  // Battery & Resources
  batteryDrainRate?: number;
  thermalState?: string;
  
  timestamp: number;
  sessionId: string;
}

export interface PerformanceThresholds {
  coldStartTime: number; // < 5 seconds
  warmStartTime: number; // < 2 seconds
  memoryUsage: number; // < 300 MB during inference
  cpuUsage: number; // < 5% average background
  frameRate: number; // > 55 FPS
  inferenceTime: number; // Varies by model
  apiResponseTime: number; // < 5 seconds
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  coldStartTime: 5000, // 5 seconds
  warmStartTime: 2000, // 2 seconds
  memoryUsage: 300 * 1024 * 1024, // 300 MB in bytes
  cpuUsage: 5, // 5%
  frameRate: 55, // FPS
  inferenceTime: 10000, // 10 seconds for on-device LLM
  apiResponseTime: 5000, // 5 seconds
};

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private sessionId: string;
  private thresholds: PerformanceThresholds;
  private startTimes: Map<string, number> = new Map();

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.sessionId = Date.now().toString();
    this.thresholds = DEFAULT_THRESHOLDS;
    this.initialize();
  }

  private initialize(): void {
    if (FeatureFlagService.getInstance().isEnabled(FeatureFlags.PERFORMANCE_MONITORING)) {
      this.startPerformanceTracking();
    }
  }

  // Start timing an operation
  startTimer(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }

  // End timing and record the metric
  endTimer(operationId: string, metricType: keyof PerformanceMetrics): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(operationId);

    this.recordMetric({ [metricType]: duration });
    
    // Check against thresholds
    this.checkThreshold(metricType, duration);
    
    return duration;
  }

  // Record a metric
  recordMetric(metric: Partial<PerformanceMetrics>): void {
    if (!FeatureFlagService.getInstance().isEnabled(FeatureFlags.PERFORMANCE_MONITORING)) {
      return;
    }

    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.metrics.push(fullMetric);

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Log significant performance events
    this.logSignificantEvents(fullMetric);
  }

  // Check if a metric exceeds thresholds
  private checkThreshold(metricType: keyof PerformanceMetrics, value: number): void {
    const threshold = this.thresholds[metricType as keyof PerformanceThresholds];
    if (!threshold) return;

    const exceeded = this.isThresholdExceeded(metricType, value, threshold);
    
    if (exceeded) {
      const message = `Performance threshold exceeded: ${metricType} = ${value}ms (threshold: ${threshold}ms)`;
      console.warn(message);
      AuditService.getInstance().log('performance_warning', message);
      
      if (__DEV__) {
        // In development, also log to help developers
        console.table({
          Metric: metricType,
          Value: value,
          Threshold: threshold,
          Exceeded: exceeded,
        });
      }
    }
  }

  private isThresholdExceeded(metricType: keyof PerformanceMetrics, value: number, threshold: number): boolean {
    // For frame rate, we want higher values (so threshold is minimum)
    if (metricType === 'frameRate') {
      return value < threshold;
    }
    
    // For most other metrics, we want lower values (so threshold is maximum)
    return value > threshold;
  }

  // Get performance summary
  getPerformanceSummary(): {
    averages: Partial<PerformanceMetrics>;
    violations: Array<{ metric: string; value: number; threshold: number }>;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return { averages: {}, violations: [], recommendations: [] };
    }

    // Calculate averages
    const averages: Partial<PerformanceMetrics> = {};
    const violations: Array<{ metric: string; value: number; threshold: number }> = [];
    
    const metricsToAverage: Array<keyof PerformanceMetrics> = [
      'coldStartTime', 'warmStartTime', 'memoryUsage', 'cpuUsage', 
      'frameRate', 'inferenceTime', 'apiResponseTime'
    ];

    metricsToAverage.forEach(metric => {
      const values = this.metrics
        .map(m => m[metric])
        .filter((v): v is number => typeof v === 'number');
      
      if (values.length > 0) {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        averages[metric] = average;
        
        // Check for violations
        const threshold = this.thresholds[metric as keyof PerformanceThresholds];
        if (threshold && this.isThresholdExceeded(metric, average, threshold)) {
          violations.push({
            metric,
            value: average,
            threshold,
          });
        }
      }
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(violations);

    return { averages, violations, recommendations };
  }

  private generateRecommendations(violations: Array<{ metric: string; value: number; threshold: number }>): string[] {
    const recommendations: string[] = [];

    violations.forEach(violation => {
      switch (violation.metric) {
        case 'coldStartTime':
          recommendations.push('Consider reducing bundle size or optimizing initial load');
          break;
        case 'memoryUsage':
          recommendations.push('Memory usage is high - consider model quantization or memory optimization');
          break;
        case 'inferenceTime':
          recommendations.push('LLM inference is slow - consider using a smaller model or hardware acceleration');
          break;
        case 'frameRate':
          recommendations.push('UI performance is poor - check for blocking operations on the main thread');
          break;
        case 'apiResponseTime':
          recommendations.push('Network requests are slow - consider request optimization or caching');
          break;
        case 'cpuUsage':
          recommendations.push('High CPU usage detected - optimize background processing');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Start automatic performance tracking
  private startPerformanceTracking(): void {
    // Memory monitoring
    setInterval(() => {
      this.measureMemoryUsage();
    }, 30000); // Every 30 seconds

    // App state monitoring
    this.trackAppState();
  }

  private measureMemoryUsage(): void {
    try {
      // In a real React Native app, you would use a native module to get memory info
      // For now, we'll simulate or use what's available
      const memoryInfo = this.getMemoryInfo();
      
      if (memoryInfo.usedMemory) {
        this.recordMetric({ memoryUsage: memoryInfo.usedMemory });
      }
    } catch (error) {
      console.error('Failed to measure memory usage:', error);
    }
  }

  private getMemoryInfo(): { usedMemory?: number } {
    // Placeholder for native memory measurement
    // In a real implementation, this would call a native module
    if (__DEV__) {
      // Simulate memory usage for development
      return {
        usedMemory: Math.random() * 200 * 1024 * 1024 + 100 * 1024 * 1024 // 100-300MB
      };
    }
    
    return {};
  }

  private trackAppState(): void {
    // Track app lifecycle events
    const appStartTime = Date.now();
    
    // Simulate cold start measurement
    setTimeout(() => {
      const coldStartTime = Date.now() - appStartTime;
      this.recordMetric({ coldStartTime });
    }, 100);
  }

  private logSignificantEvents(metric: PerformanceMetrics): void {
    // Log particularly interesting performance events
    if (metric.inferenceTime && metric.inferenceTime > 0) {
      AuditService.getInstance().log(
        'performance_metric', 
        `LLM inference completed in ${metric.inferenceTime}ms`
      );
    }

    if (metric.coldStartTime && metric.coldStartTime > 0) {
      AuditService.getInstance().log(
        'performance_metric', 
        `App cold start: ${metric.coldStartTime}ms`
      );
    }

    if (metric.apiResponseTime && metric.apiResponseTime > 0) {
      AuditService.getInstance().log(
        'performance_metric', 
        `API response time: ${metric.apiResponseTime}ms`
      );
    }
  }

  // Export performance data for analysis
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Clear metrics (useful for testing)
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  // Update thresholds
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    AuditService.getInstance().log('settings_change', 'Performance thresholds updated');
  }
}

export default PerformanceMonitor.getInstance();