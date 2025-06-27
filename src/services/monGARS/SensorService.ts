// Sensor service for native-monGARS
// Integrates with existing ARIA sensor system

import { NativeModules } from 'react-native';
import { sensorManager } from '../../api/sensor-manager';

// Fallback for cases where BatteryModule is not available
const { BatteryModule } = NativeModules || {};

export default class SensorService {
  /**
   * Check if device is currently charging
   * Uses ARIA's existing sensor system or fallback
   */
  static async isCharging(): Promise<boolean> {
    try {
      // Try to use ARIA's sensor manager first
      const sensorData = sensorManager.getCurrentData();
      if (sensorData?.deviceInfo?.battery !== undefined) {
        return false; // deviceInfo doesn't include charging status, default to false
      }
      
      // Fallback to native module if available
      if (BatteryModule) {
        const status: { charging: boolean } = await BatteryModule.getBatteryState();
        return status.charging;
      }
      
      // Default fallback - assume not charging
      console.warn('Battery status unavailable, assuming not charging');
      return false;
    } catch (error) {
      console.warn('Error checking charging status:', error);
      return false;
    }
  }
  
  /**
   * Get battery level (0.0 - 1.0)
   */
  static async getBatteryLevel(): Promise<number> {
    try {
      const sensorData = sensorManager.getCurrentData();
      if (sensorData?.deviceInfo?.battery !== undefined) {
        return sensorData.deviceInfo.battery;
      }
      
      if (BatteryModule) {
        const status: { level: number } = await BatteryModule.getBatteryState();
        return status.level;
      }
      
      return 0.5; // Default fallback
    } catch (error) {
      console.warn('Error getting battery level:', error);
      return 0.5;
    }
  }
  
  /**
   * Check if device is in low power mode
   */
  static async isLowPowerMode(): Promise<boolean> {
    try {
      const batteryLevel = await this.getBatteryLevel();
      return batteryLevel < 0.2; // Consider low power if below 20%
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get memory pressure indicator
   */
  static async getMemoryPressure(): Promise<'low' | 'medium' | 'high'> {
    try {
      const sensorData = sensorManager.getCurrentData();
      // SensorData doesn't include device memory usage, return default
      if (false) {
        const usage = 0;
        if (usage > 0.8) return 'high';
        if (usage > 0.6) return 'medium';
        return 'low';
      }
      
      return 'medium'; // Default fallback
    } catch (error) {
      return 'medium';
    }
  }
  
  /**
   * Check if device is connected to WiFi
   */
  static async isOnWiFi(): Promise<boolean> {
    try {
      const sensorData = sensorManager.getCurrentData();
      if (sensorData?.deviceInfo?.connectivity) {
        return sensorData.deviceInfo.connectivity === 'wifi';
      }
      
      return true; // Default assume WiFi for prefetching
    } catch (error) {
      return true;
    }
  }
  
  /**
   * Get optimal conditions for prefetching
   */
  static async isOptimalForPrefetch(): Promise<boolean> {
    try {
      const [isCharging, isOnWiFi, isLowPower, memoryPressure] = await Promise.all([
        this.isCharging(),
        this.isOnWiFi(),
        this.isLowPowerMode(),
        this.getMemoryPressure()
      ]);
      
      return isCharging && isOnWiFi && !isLowPower && memoryPressure !== 'high';
    } catch (error) {
      return false;
    }
  }
}