#!/bin/bash
echo "Starting MCP Core server..."
cd "$(dirname "$0")"
node dist/index.js
