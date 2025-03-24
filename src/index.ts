#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';
import { logInfo, logError } from './logger.js';
import { VERSION } from './version.js';

async function main() {
  try {
    logInfo(`Starting mcp-core server v${VERSION}`);
    
    // Connect using stdio transport
    const transport = new StdioServerTransport();
    
    logInfo('Connecting server to stdio transport');
    await server.connect(transport);
    
    logInfo('MCP server running...');
    
    // Handle process shutdown
    process.on('SIGINT', async () => {
      logInfo('Received SIGINT, shutting down server...');
      await server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logInfo('Received SIGTERM, shutting down server...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    logError('Fatal error starting server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Start the server
main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
