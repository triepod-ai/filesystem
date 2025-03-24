import fs from 'node:fs';
import path from 'node:path';
import { LOG_FILE, ERROR_LOG_FILE } from './config.js';

// Simple log levels
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

// Format the current date and time for log entries
const getTimestamp = (): string => {
  return new Date().toISOString();
};

// Base logging function
export function log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
  const timestamp = getTimestamp();
  const metadataStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
  const logEntry = `[${timestamp}] [${level}] ${message}${metadataStr}\n`;
  
  // Log to console
  console.log(logEntry);
  
  // Log to file
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    // If we can't write to the log file, just log to console
    console.error(`Failed to write to log file: ${error}`);
  }
}

// Helper functions for different log levels
export function logInfo(message: string, metadata?: Record<string, any>): void {
  log(LogLevel.INFO, message, metadata);
}

export function logWarning(message: string, metadata?: Record<string, any>): void {
  log(LogLevel.WARN, message, metadata);
}

export function logError(message: string, error?: Error, metadata?: Record<string, any>): void {
  // Combine error details with metadata if an error is provided
  const errorMetadata = error
    ? { ...metadata, error: { message: error.message, stack: error.stack } }
    : metadata;
  
  log(LogLevel.ERROR, message, errorMetadata);
  
  // For errors, also log to the error log file
  try {
    const timestamp = getTimestamp();
    const errorDetails = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
    const metadataStr = metadata ? `\nMetadata: ${JSON.stringify(metadata, null, 2)}` : '';
    const errorEntry = `[${timestamp}] [ERROR] ${message}${errorDetails}${metadataStr}\n\n`;
    
    fs.appendFileSync(ERROR_LOG_FILE, errorEntry);
  } catch (err) {
    console.error(`Failed to write to error log file: ${err}`);
  }
}

export function logDebug(message: string, metadata?: Record<string, any>): void {
  log(LogLevel.DEBUG, message, metadata);
}

// Log MCP tool requests
export function logToolRequest(toolName: string, args: any): void {
  logInfo(`Tool request: ${toolName}`, { args });
}

// Log MCP tool responses
export function logToolResponse(toolName: string, isError: boolean, message: string): void {
  const level = isError ? LogLevel.ERROR : LogLevel.INFO;
  log(level, `Tool response: ${toolName}`, { isError, message });
}
