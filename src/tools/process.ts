import { spawn } from 'child_process';
import { ProcessInfo } from '../types.js';
import { logInfo, logError } from '../logger.js';

type KillProcessArgs = {
  pid: number;
};

/**
 * List all running processes
 */
export async function listProcesses() {
  try {
    logInfo('Listing processes');
    
    const processes = await getRunningProcesses();
    
    return {
      content: [
        {
          type: 'text',
          text: formatProcessList(processes)
        }
      ]
    };
  } catch (error) {
    logError('Error listing processes', error instanceof Error ? error : new Error(String(error)));
    return {
      content: [
        {
          type: 'text',
          text: `Error listing processes: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Kill a process by PID
 */
export async function killProcess(args: KillProcessArgs) {
  try {
    const { pid } = args;
    logInfo(`Killing process ${pid}`);
    
    const success = await terminateProcess(pid);
    
    const resultText = success
      ? `Successfully killed process ${pid}`
      : `Failed to kill process ${pid} (process may not exist)`;
    
    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  } catch (error) {
    logError(`Error killing process ${args.pid}`, error instanceof Error ? error : new Error(String(error)));
    return {
      content: [
        {
          type: 'text',
          text: `Error killing process: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Get a list of running processes
 */
async function getRunningProcesses(): Promise<ProcessInfo[]> {
  return new Promise((resolve, reject) => {
    // The command depends on the platform
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'tasklist' : 'ps';
    const args = isWindows ? ['/fo', 'csv', '/nh'] : ['-e', '-o', 'pid,pcpu,pmem,comm'];
    
    const child = spawn(command, args);
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const processes = parseProcessOutput(stdout, isWindows);
        resolve(processes);
      } catch (error) {
        reject(error);
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse the output of process listing commands
 */
function parseProcessOutput(output: string, isWindows: boolean): ProcessInfo[] {
  const processes: ProcessInfo[] = [];
  
  if (isWindows) {
    // Parse Windows tasklist output (CSV format)
    const lines = output.trim().split('\n');
    
    for (const line of lines) {
      // Remove quotes from CSV
      const parts = line.replace(/"/g, '').split(',');
      
      if (parts.length >= 5) {
        const process: ProcessInfo = {
          pid: parseInt(parts[1], 10),
          command: parts[0],
          memory: parts[4],
          cpu: 'N/A'  // Windows tasklist doesn't provide CPU usage
        };
        
        processes.push(process);
      }
    }
  } else {
    // Parse Unix ps output
    const lines = output.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      
      if (parts.length >= 4) {
        const process: ProcessInfo = {
          pid: parseInt(parts[0], 10),
          cpu: parts[1] + '%',
          memory: parts[2] + '%',
          command: parts.slice(3).join(' ')
        };
        
        processes.push(process);
      }
    }
  }
  
  return processes;
}

/**
 * Format process list for display
 */
function formatProcessList(processes: ProcessInfo[]): string {
  if (processes.length === 0) {
    return 'No processes found.';
  }
  
  // Sort by PID
  processes.sort((a, b) => a.pid - b.pid);
  
  // Format as a table
  const headers = ['PID', 'CPU', 'Memory', 'Command'];
  const rows = processes.map(p => [
    p.pid.toString(),
    p.cpu,
    p.memory,
    p.command
  ]);
  
  // Calculate column widths
  const colWidths = [
    Math.max(headers[0].length, ...rows.map(r => r[0].length)),
    Math.max(headers[1].length, ...rows.map(r => r[1].length)),
    Math.max(headers[2].length, ...rows.map(r => r[2].length)),
    Math.max(headers[3].length, ...rows.map(r => r[3].length))
  ];
  
  // Format header
  const header = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
  const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');
  
  // Format rows
  const formattedRows = rows.map(row => {
    return row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ');
  });
  
  return [header, separator, ...formattedRows].join('\n');
}

/**
 * Terminate a process by PID
 */
async function terminateProcess(pid: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'taskkill' : 'kill';
      const args = isWindows ? ['/F', '/PID', pid.toString()] : ['-9', pid.toString()];
      
      const child = spawn(command, args);
      
      child.on('close', (code) => {
        resolve(code === 0);
      });
      
      child.on('error', () => {
        resolve(false);
      });
    } catch (error) {
      logError(`Error in terminateProcess for PID ${pid}`, error instanceof Error ? error : new Error(String(error)));
      resolve(false);
    }
  });
}
