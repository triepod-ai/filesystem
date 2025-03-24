import { spawn, ChildProcess } from 'child_process';
import { TerminalSession, CommandExecutionResult, ActiveSession, CompletedSession } from './types.js';
import { logInfo, logError, logWarning } from './logger.js';
import { commandManager } from './command-manager.js';
import { DEFAULT_COMMAND_TIMEOUT } from './config.js';

class TerminalManager {
  private sessions: Map<number, TerminalSession>;
  private completedSessions: Map<number, CompletedSession>;
  private nextPid: number;

  constructor() {
    this.sessions = new Map();
    this.completedSessions = new Map();
    this.nextPid = 1;
  }

  /**
   * Execute a command in a new terminal session
   */
  executeCommand(command: string, timeout: number = DEFAULT_COMMAND_TIMEOUT): Promise<CommandExecutionResult> {
    return new Promise((resolve, reject) => {
      try {
        // Check if command is blocked
        if (commandManager.isCommandBlocked(command)) {
          return resolve({
            pid: -1,
            output: `Command blocked for security reasons: ${command}`,
            isBlocked: true
          });
        }

        // Create a unique PID for this session
        const pid = this.nextPid++;
        
        // On Windows, execute through cmd.exe
        // On Unix-like systems, use /bin/sh
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/sh';
        const args = isWindows ? ['/c', command] : ['-c', command];
        
        // Spawn the process
        const childProcess = spawn(shell, args, {
          shell: true,
          stdio: 'pipe'
        });

        let output = '';
        
        // Collect output
        childProcess.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        childProcess.stderr.on('data', (data) => {
          output += data.toString();
        });

        // Store the session
        const session: TerminalSession = {
          pid,
          process: childProcess,
          lastOutput: output,
          isBlocked: false,
          startTime: new Date()
        };
        
        this.sessions.set(pid, session);
        
        // Set a timeout to return initial output
        setTimeout(() => {
          resolve({
            pid,
            output,
            isBlocked: false
          });
        }, timeout);

        // Handle process exit
        childProcess.on('exit', (code) => {
          logInfo(`Process ${pid} exited with code ${code}`);
          
          // Move from active to completed sessions
          if (this.sessions.has(pid)) {
            const session = this.sessions.get(pid)!;
            this.sessions.delete(pid);
            
            const completedSession: CompletedSession = {
              pid,
              output: session.lastOutput + output, // Combine any new output
              exitCode: code,
              startTime: session.startTime,
              endTime: new Date()
            };
            
            this.completedSessions.set(pid, completedSession);
          }
        });

        // Handle errors
        childProcess.on('error', (err) => {
          logError(`Process ${pid} error: ${err.message}`, err);
          reject(new Error(`Command execution error: ${err.message}`));
        });
        
      } catch (error) {
        logError('Failed to execute command', error instanceof Error ? error : new Error(String(error)));
        reject(error);
      }
    });
  }

  /**
   * Read output from a running session
   */
  readOutput(pid: number): string {
    // Check if the session exists
    if (!this.sessions.has(pid)) {
      // Check if it's a completed session
      if (this.completedSessions.has(pid)) {
        return this.completedSessions.get(pid)!.output;
      }
      return `No session found with PID ${pid}`;
    }

    const session = this.sessions.get(pid)!;
    return session.lastOutput;
  }
  
  /**
   * Force terminate a running session
   */
  forceTerminate(pid: number): boolean {
    if (!this.sessions.has(pid)) {
      return false;
    }
    
    try {
      const session = this.sessions.get(pid)!;
      
      // On Windows, use taskkill
      // On Unix-like systems, use SIGTERM
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        spawn('taskkill', ['/pid', session.process.pid!.toString(), '/f', '/t']);
      } else {
        session.process.kill('SIGTERM');
      }
      
      // Move to completed sessions
      const completedSession: CompletedSession = {
        pid,
        output: session.lastOutput,
        exitCode: null, // We don't have an exit code when force terminating
        startTime: session.startTime,
        endTime: new Date()
      };
      
      this.completedSessions.set(pid, completedSession);
      this.sessions.delete(pid);
      
      return true;
    } catch (error) {
      logError(`Error terminating process ${pid}`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
  
  /**
   * List all active sessions
   */
  listSessions(): ActiveSession[] {
    const now = new Date();
    
    return Array.from(this.sessions.entries()).map(([pid, session]) => {
      const runtime = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);
      
      return {
        pid,
        isBlocked: session.isBlocked,
        runtime
      };
    });
  }
}

// Singleton instance
export const terminalManager = new TerminalManager();
