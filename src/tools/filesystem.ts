import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import { logInfo, logError, logWarning } from '../logger.js';

// List of allowed directories for security
// Will be initialized on first access
let allowedDirectories: string[] = [];

// Initialize allowed directories
async function initAllowedDirectories() {
  // For now, just return the current drive and user's home directory
  // This should be customized based on security requirements
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  
  allowedDirectories = [
    process.cwd(),        // Current working directory
    homeDir,              // User's home directory
    'C:/',                // Root of C drive on Windows
    'D:/',                // Root of D drive on Windows
    '/tmp'                // Temp directory on Linux/macOS
  ];
  
  logInfo(`Initialized allowed directories: ${allowedDirectories.join(', ')}`);
}

/**
 * Check if a path is inside an allowed directory
 */
function isAllowedPath(filePath: string): boolean {
  if (allowedDirectories.length === 0) {
    initAllowedDirectories();
  }
  
  const resolvedPath = path.resolve(filePath);
  
  for (const allowedDir of allowedDirectories) {
    if (resolvedPath === allowedDir || resolvedPath.startsWith(allowedDir + path.sep)) {
      return true;
    }
  }
  
  logWarning(`Access denied to path: ${filePath}`);
  return false;
}

/**
 * Read a file from the file system
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    if (!isAllowedPath(filePath)) {
      throw new Error(`Access denied to path: ${filePath}`);
    }
    
    logInfo(`Reading file: ${filePath}`);
    
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    logError(`Error reading file: ${filePath}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Read multiple files from the file system
 */
export async function readMultipleFiles(filePaths: string[]): Promise<string[]> {
  const results: string[] = [];
  
  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath);
      results.push(`File: ${filePath}\n${content}`);
    } catch (error) {
      results.push(`Error reading ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return results;
}

/**
 * Write content to a file
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    if (!isAllowedPath(filePath)) {
      throw new Error(`Access denied to path: ${filePath}`);
    }
    
    logInfo(`Writing file: ${filePath}`);
    
    // Create directory if it doesn't exist
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
    
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    logError(`Error writing file: ${filePath}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Error writing file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a directory
 */
export async function createDirectory(dirPath: string): Promise<void> {
  try {
    if (!isAllowedPath(dirPath)) {
      throw new Error(`Access denied to path: ${dirPath}`);
    }
    
    logInfo(`Creating directory: ${dirPath}`);
    
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    logError(`Error creating directory: ${dirPath}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Error creating directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List files and directories in a directory
 */
export async function listDirectory(dirPath: string): Promise<string[]> {
  try {
    if (!isAllowedPath(dirPath)) {
      throw new Error(`Access denied to path: ${dirPath}`);
    }
    
    logInfo(`Listing directory: ${dirPath}`);
    
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    return entries.map(entry => {
      const prefix = entry.isDirectory() ? '[DIR] ' : '[FILE]';
      return `${prefix} ${entry.name}`;
    });
  } catch (error) {
    logError(`Error listing directory: ${dirPath}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Error listing directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Move or rename a file
 */
export async function moveFile(sourcePath: string, destPath: string): Promise<void> {
  try {
    if (!isAllowedPath(sourcePath) || !isAllowedPath(destPath)) {
      throw new Error(`Access denied to path: ${!isAllowedPath(sourcePath) ? sourcePath : destPath}`);
    }
    
    logInfo(`Moving file: ${sourcePath} -> ${destPath}`);
    
    // Create directory if it doesn't exist
    const directory = path.dirname(destPath);
    await fs.mkdir(directory, { recursive: true });
    
    await fs.rename(sourcePath, destPath);
  } catch (error) {
    logError(`Error moving file: ${sourcePath} -> ${destPath}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Error moving file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search for files matching a pattern
 */
export async function searchFiles(dirPath: string, pattern: string): Promise<string[]> {
  try {
    if (!isAllowedPath(dirPath)) {
      throw new Error(`Access denied to path: ${dirPath}`);
    }
    
    logInfo(`Searching files in ${dirPath} with pattern: ${pattern}`);
    
    const matches = await glob(path.join(dirPath, pattern));
    return matches;
  } catch (error) {
    logError(`Error searching files: ${dirPath}/${pattern}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Error searching files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get file or directory information
 */
export async function getFileInfo(filePath: string): Promise<Record<string, string>> {
  try {
    if (!isAllowedPath(filePath)) {
      throw new Error(`Access denied to path: ${filePath}`);
    }
    
    logInfo(`Getting file info: ${filePath}`);
    
    const stats = await fs.stat(filePath);
    
    return {
      path: filePath,
      size: `${stats.size} bytes`,
      type: stats.isDirectory() ? 'Directory' : 'File',
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
      permissions: stats.mode.toString(8).slice(-3),
      isDirectory: String(stats.isDirectory()),
      isFile: String(stats.isFile()),
      isSymbolicLink: String(stats.isSymbolicLink())
    };
  } catch (error) {
    logError(`Error getting file info: ${filePath}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Error getting file info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List allowed directories
 */
export function listAllowedDirectories(): string[] {
  if (allowedDirectories.length === 0) {
    initAllowedDirectories();
  }
  
  return [...allowedDirectories];
}
