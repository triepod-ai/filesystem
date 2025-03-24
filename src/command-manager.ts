import fs from 'node:fs';
import path from 'node:path';
import { logInfo, logError, logWarning } from './logger.js';
import { CONFIG_FILE } from './config.js';

// Default blocked commands for security
const DEFAULT_BLOCKED_COMMANDS = [
  'format',  // Disk formatting commands
  'del /q', // Dangerous deletion
  'rm -rf',  // Recursive force delete
  'sudo',    // Elevated privileges
  'chmod 777', // Insecure permissions
  'mkfs'     // Make filesystem
];

interface CommandManagerConfig {
  blockedCommands: string[];
}

class CommandManager {
  private blockedCommands: Set<string>;
  private configPath: string;

  constructor(configPath: string = CONFIG_FILE) {
    this.blockedCommands = new Set<string>(DEFAULT_BLOCKED_COMMANDS);
    this.configPath = configPath;
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(configData) as CommandManagerConfig;
        
        if (config.blockedCommands && Array.isArray(config.blockedCommands)) {
          // Add any configured blocked commands to our set
          config.blockedCommands.forEach(cmd => this.blockedCommands.add(cmd));
          logInfo(`Loaded ${config.blockedCommands.length} blocked commands from config`);
        }
      } else {
        logWarning(`Config file not found at ${this.configPath}, using default blocked commands`);
        this.saveConfig(); // Create the default config file
      }
    } catch (error) {
      logError('Error loading command manager config', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private saveConfig(): void {
    try {
      const config: CommandManagerConfig = {
        blockedCommands: Array.from(this.blockedCommands)
      };
      
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      logInfo('Saved command manager configuration');
    } catch (error) {
      logError('Error saving command manager config', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if a command contains any blocked patterns
   */
  isCommandBlocked(command: string): boolean {
    const lowerCommand = command.toLowerCase();
    
    for (const blockedCmd of this.blockedCommands) {
      if (lowerCommand.includes(blockedCmd.toLowerCase())) {
        logWarning(`Command "${command}" was blocked due to blocked pattern: ${blockedCmd}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Add a command to the blocklist
   */
  async blockCommand(command: string): Promise<string> {
    if (!command || typeof command !== 'string' || command.trim() === '') {
      return 'Error: Cannot block empty command';
    }
    
    const trimmedCommand = command.trim();
    this.blockedCommands.add(trimmedCommand);
    this.saveConfig();
    
    return `Successfully blocked command: ${trimmedCommand}`;
  }

  /**
   * Remove a command from the blocklist
   */
  async unblockCommand(command: string): Promise<string> {
    if (!command || typeof command !== 'string' || command.trim() === '') {
      return 'Error: Cannot unblock empty command';
    }
    
    const trimmedCommand = command.trim();
    
    if (this.blockedCommands.has(trimmedCommand)) {
      this.blockedCommands.delete(trimmedCommand);
      this.saveConfig();
      return `Successfully unblocked command: ${trimmedCommand}`;
    }
    
    return `Command not found in blocklist: ${trimmedCommand}`;
  }

  /**
   * Get a list of all currently blocked commands
   */
  async listBlockedCommands(): Promise<string[]> {
    return Array.from(this.blockedCommands).sort();
  }
}

// Singleton instance
export const commandManager = new CommandManager();
