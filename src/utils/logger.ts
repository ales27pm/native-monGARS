import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  tag: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isProduction = process.env.NODE_ENV === 'production';
  private logLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private constructor() {
    // Initialize logger silently
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: LogLevel, tag: string, message: string): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    return `[${timestamp}] [${levelName}] [${tag}] ${message}`;
  }

  private addLog(level: LogLevel, tag: string, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      tag,
      message,
      data,
      error,
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (!this.isProduction) {
      const formattedMessage = this.formatMessage(level, tag, message);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.log(formattedMessage, data || '');
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, error || data || '');
          break;
      }
    }
  }

  debug(tag: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(LogLevel.DEBUG, tag, message, data);
    }
  }

  info(tag: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(LogLevel.INFO, tag, message, data);
    }
  }

  warn(tag: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(LogLevel.WARN, tag, message, data);
    }
  }

  error(tag: string, message: string, error?: Error | any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(LogLevel.ERROR, tag, message, undefined, error);
    }
  }

  // Performance logging
  time(tag: string, label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.debug(tag, `⏱️ Timer started: ${label}`);
    }
  }

  timeEnd(tag: string, label: string, startTime: number): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const duration = Date.now() - startTime;
      this.debug(tag, `⏱️ Timer ended: ${label} - ${duration}ms`);
    }
  }

  // API logging
  apiRequest(tag: string, method: string, url: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.debug(tag, `🌐 API Request: ${method} ${url}`, data);
    }
  }

  apiResponse(tag: string, method: string, url: string, status: number, duration: number): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const emoji = status >= 400 ? '❌' : '✅';
      this.debug(tag, `🌐 API Response: ${emoji} ${method} ${url} - ${status} (${duration}ms)`);
    }
  }

  // Get logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level === undefined) {
      return [...this.logs];
    }
    return this.logs.filter(log => log.level >= level);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.info('Logger', 'Logs cleared');
  }

  // Export logs for debugging
  async exportLogs(): Promise<string> {
    const logs = this.getLogs();
    const logData = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: LogLevel[log.level],
      tag: log.tag,
      message: log.message,
      data: log.data,
      error: log.error?.message,
    }));

    return JSON.stringify(logData, null, 2);
  }

  // Save logs to file (for debugging)
  async saveLogsToFile(): Promise<string | null> {
    try {
      const logData = await this.exportLogs();
      // Create a safe filename by replacing invalid characters
      const dateStr = new Date().toISOString().split('T')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `mongars_logs_${dateStr}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, logData);
      this.info('Logger', `Logs saved to ${filePath}`);
      return filePath;
    } catch (error) {
      this.error('Logger', 'Failed to save logs to file', error);
      return null;
    }
  }

  // Set log level
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info('Logger', `Log level set to ${LogLevel[level]}`);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for easy import
export const log = {
  debug: (tag: string, message: string, data?: any) => logger.debug(tag, message, data),
  info: (tag: string, message: string, data?: any) => logger.info(tag, message, data),
  warn: (tag: string, message: string, data?: any) => logger.warn(tag, message, data),
  error: (tag: string, message: string, error?: Error | any) => logger.error(tag, message, error),
  time: (tag: string, label: string) => logger.time(tag, label),
  timeEnd: (tag: string, label: string, startTime: number) => logger.timeEnd(tag, label, startTime),
  apiRequest: (tag: string, method: string, url: string, data?: any) => logger.apiRequest(tag, method, url, data),
  apiResponse: (tag: string, method: string, url: string, status: number, duration: number) => logger.apiResponse(tag, method, url, status, duration),
};

export default logger;