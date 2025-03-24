# MCP Core

A focused, modular Model Context Protocol (MCP) server providing essential terminal and filesystem operations.

## Overview

MCP Core is a streamlined implementation of the core functionality needed for Claude to interact with your local environment. It focuses on two key areas:

1. **Terminal Operations**: Execute commands, manage processes, and control sessions
2. **Filesystem Operations**: Read, write, and manipulate files and directories

This is a refined version of ClaudeDesktopCommander, focusing only on the essential functionality while moving supplementary features into plugins.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mcp-core.git

# Navigate to the project directory
cd mcp-core

# Install dependencies
npm install
```

## Building

```bash
# Build the TypeScript source
npm run build
```

## Running

After building, you can run the server using the provided batch script:

```bash
# On Windows
run-mcp-core.bat

# On Unix/Linux
chmod +x run-mcp-core.sh
./run-mcp-core.sh
```

Or directly:

```bash
node dist/index.js
```

## Integration

### Claude Desktop

To integrate with Claude Desktop, update your configuration file (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mcp-core": {
      "command": "C:\\path\\to\\mcp-core\\run-mcp-core.bat",
      "args": []
    }
  }
}
```

### Windsurf

To integrate with Windsurf, update the MCP configuration file:

```json
{
  "mcpServers": {
    "mcp-core": {
      "command": "node",
      "args": ["path/to/mcp-core/dist/index.js"]
    }
  }
}
```

## Available Tools

### Terminal Operations

- `execute_command`: Run a terminal command with timeout
- `read_output`: Read output from a running terminal session
- `force_terminate`: Terminate a running terminal session
- `list_sessions`: List all active terminal sessions
- `list_processes`: Get details of running processes
- `kill_process`: Terminate a process by PID

### Command Security

- `block_command`: Block a command pattern
- `unblock_command`: Unblock a command pattern
- `list_blocked_commands`: View blocked commands

### Filesystem Operations

- `read_file`: Read file contents
- `read_multiple_files`: Read multiple files at once
- `write_file`: Write content to a file
- `create_directory`: Create a new directory
- `list_directory`: List directory contents
- `move_file`: Move or rename files
- `search_files`: Find files matching patterns
- `get_file_info`: Get file metadata
- `list_allowed_directories`: View accessible directories
- `edit_block`: Make surgical text replacements

## Project Separation

This project is part of a broader effort to modularize the ClaudeDesktopCommander into:

1. **MCP Core**: Essential terminal and filesystem operations (this repository)
2. **ToolNexusMCP**: Plugin system for additional functionality
3. **Plugin repositories**: Specialized functionality like code analysis, memory systems, and API integrations

By separating these components, we achieve:

- Better stability and maintainability
- Clearer separation of concerns
- More flexible deployment options
- Improved performance by loading only the needed functionality

## Configuration

The server's behavior can be configured through the `config.json` file:

```json
{
  "blockedCommands": [
    "format",
    "del /q",
    "rm -rf",
    "sudo",
    "chmod 777",
    "mkfs"
  ],
  "logging": {
    "level": "info",
    "format": "simple",
    "file": {
      "enabled": true,
      "path": "./logs"
    }
  },
  "allowedDirectories": []
}
```

## License

MIT
