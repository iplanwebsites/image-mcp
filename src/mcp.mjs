#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { promisify } from "util";

const PROGRESS_UPDATE_INTERVAL = 3000; // 3 seconds

class AIImageMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "ai-image/mcp",
        version: "0.0.1",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "generate_ai_image",
            description: "Generate AI images using the ai-image CLI tool",
            inputSchema: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The text prompt for image generation",
                },
                size: {
                  type: "string",
                  description:
                    "Image size in format WIDTHxHEIGHT (e.g., 1536x1024)",
                  default: "1024x1024",
                },
                model: {
                  type: "string",
                  description: "AI model to use for generation (optional)",
                },
                output: {
                  type: "string",
                  description: "Output file path (optional)",
                },
                style: {
                  type: "string",
                  description: "Image style (optional)",
                },
              },
              required: ["prompt"],
            },
          },
          {
            name: "pizza-test",
            description: "Mock test tool that returns a password",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === "generate_ai_image") {
        return await this.handleGenerateImage(request.params.arguments);
      } else if (request.params.name === "pizza-test") {
        return await this.handlePizzaTest(request.params.arguments);
      } else {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }
    });
  }

  async handlePizzaTest() {
    return {
      content: [
        {
          type: "text",
          text: "kangaroo",
        },
      ],
    };
  }

  async handleGenerateImage(args) {
    const { prompt, size = "1024x1024", model, output, style } = args;

    if (!prompt) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Prompt is required for image generation"
      );
    }

    try {
      const result = await this.executeAIImageCommand({
        prompt,
        size,
        model,
        output,
        style,
      });

      return {
        content: [
          {
            type: "text",
            text: `Image generation completed successfully!\n\nCommand executed: ${
              result.command
            }\n\nOutput:\n${result.stdout}${
              result.stderr ? `\n\nErrors/Warnings:\n${result.stderr}` : ""
            }`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate image: ${error.message}`
      );
    }
  }

  async executeAIImageCommand({ prompt, size, model, output, style }) {
    return new Promise((resolve, reject) => {
      const args = ["ai-image", "generate", "--prompt", prompt, "--size", size];

      // Add optional parameters
      if (model) {
        args.push("--model", model);
      }
      if (output) {
        args.push("--output", output);
      }
      if (style) {
        args.push("--style", style);
      }

      const command = `npx ${args.join(" ")}`;
      console.error(`Executing: ${command}`); // Log to stderr so it doesn't interfere with MCP protocol

      const child = spawn("npx", args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: process.platform === "win32", // Use shell on Windows
      });

      let stdout = "";
      let stderr = "";
      let startTime = Date.now();

      // Send progress updates every 3 seconds
      const progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.error(`Progress: Image generation in progress... (${elapsed}s elapsed)`);
      }, PROGRESS_UPDATE_INTERVAL);

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        // Reset progress when we receive data
        console.error("Progress: Received output from image generation process");
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
        // Reset progress when we receive data
        console.error("Progress: Received stderr from image generation process");
      });

      child.on("close", (code) => {
        clearInterval(progressInterval);
        if (code === 0) {
          resolve({
            command,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code,
          });
        } else {
          reject(
            new Error(
              `Command failed with exit code ${code}.\nStdout: ${stdout}\nStderr: ${stderr}`
            )
          );
        }
      });

      child.on("error", (error) => {
        clearInterval(progressInterval);
        reject(new Error(`Failed to spawn process: ${error.message}`));
      });

      // Increase timeout and clear interval on completion
      const timeout = setTimeout(() => {
        clearInterval(progressInterval);
        child.kill("SIGTERM");
        reject(new Error("Command timed out after 5 minutes"));
      }, 300000); // 5 minutes instead of 60 seconds

      child.on("close", () => {
        clearTimeout(timeout);
        clearInterval(progressInterval);
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("AI Image Generator MCP server running on stdio");
  }
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AIImageMCPServer();
  server.run().catch((error) => {
    console.error("Server failed:", error);
    process.exit(1);
  });
}

export default AIImageMCPServer;
