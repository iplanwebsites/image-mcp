#!/usr/bin/env node

import AIImageMCPServer from '../src/mcp.mjs';

const server = new AIImageMCPServer();
server.run().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});