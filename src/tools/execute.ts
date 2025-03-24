import { ExecuteCommandArgsSchema, ReadOutputArgsSchema, ForceTerminateArgsSchema } from './schemas.js';
import { terminalManager } from '../terminal-manager.js';
import { logInfo, logError } from '../logger.js';

type ExecuteCommandArgs = {
  command: string;
  timeout?: number;
};

type ReadOutputArgs = {
  pid: number;
};

type ForceTerminateArgs = {
  pid: number;
};

export async function executeCommand(args: ExecuteCommandArgs) {
  try {
    const { command, timeout } = args;
    logInfo(`Executing command: ${command}`);
    
    const result = await terminalManager.executeCommand(command, timeout);
    
    return {
      content: [
        {
          type: 'text',
          text: `Executing: ${command}\nPID: ${result.pid}${result.isBlocked ? ' (BLOCKED)' : ''}\n\n${result.output}`
        }
      ]
    };
  } catch (error) {
    logError('Error executing command', error instanceof Error ? error : new Error(String(error)));
    return {
      content: [
        {
          type: 'text',
          text: `Error executing command: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function readOutput(args: ReadOutputArgs) {
  try {
    const { pid } = args;
    logInfo(`Reading output for process ${pid}`);
    
    const output = terminalManager.readOutput(pid);
    
    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ]
    };
  } catch (error) {
    logError(`Error reading output for process ${args.pid}`, error instanceof Error ? error : new Error(String(error)));
    return {
      content: [
        {
          type: 'text',
          text: `Error reading output: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function forceTerminate(args: ForceTerminateArgs) {
  try {
    const { pid } = args;
    logInfo(`Force terminating process ${pid}`);
    
    const success = terminalManager.forceTerminate(pid);
    
    const resultText = success
      ? `Successfully terminated process ${pid}`
      : `Failed to terminate process ${pid} (process may not exist)`;
    
    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  } catch (error) {
    logError(`Error terminating process ${args.pid}`, error instanceof Error ? error : new Error(String(error)));
    return {
      content: [
        {
          type: 'text',
          text: `Error terminating process: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function listSessions() {
  try {
    const sessions = terminalManager.listSessions();
    
    if (sessions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No active terminal sessions.'
          }
        ]
      };
    }
    
    const sessionList = sessions.map(session => {
      return `PID: ${session.pid} | Runtime: ${session.runtime}s${session.isBlocked ? ' (BLOCKED)' : ''}`;
    }).join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `Active Sessions:\n${sessionList}`
        }
      ]
    };
  } catch (error) {
    logError('Error listing sessions', error instanceof Error ? error : new Error(String(error)));
    return {
      content: [
        {
          type: 'text',
          text: `Error listing sessions: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
