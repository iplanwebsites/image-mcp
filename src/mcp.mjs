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
                output_dir: {
                  type: "string",
                  description:
                    "Absolute path direcotry where to save the image (use current folder root by default)",
                },
              },
              required: ["prompt", "output_dir"],
            },
          },
          {
            name: "square_image",
            description:
              "Generate a square AI image (1024x1024) - shortcut for generate_ai_image",
            inputSchema: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The text prompt for image generation",
                },
                model: {
                  type: "string",
                  description: "AI model to use for generation (optional)",
                },
                output: {
                  type: "string",
                  description: "Output file path (optional)",
                },
                output_dir: {
                  type: "string",
                  description:
                    "Absolute path direcotry where to save the image (use current folder root by default)",
                },
              },
              required: ["prompt", "output_dir"],
            },
          },
          {
            name: "landscape_image",
            description:
              "Generate a landscape AI image (1536x1024) - works great for cover images - shortcut for generate_ai_image",
            inputSchema: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The text prompt for image generation",
                },
                model: {
                  type: "string",
                  description: "AI model to use for generation (optional)",
                },
                output: {
                  type: "string",
                  description: "Output file path (optional)",
                },
                output_dir: {
                  type: "string",
                  description:
                    "Absolute path direcotry where to save the image (use current folder, or one that make sense for assets)",
                },
              },
              required: ["prompt", "output_dir"],
            },
          },
          {
            name: "portrait_image",
            description:
              "Generate a portrait AI image (1024x1536) - shortcut for generate_ai_image",
            inputSchema: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "The text prompt for image generation",
                },
                model: {
                  type: "string",
                  description: "AI model to use for generation (optional)",
                },
                output: {
                  type: "string",
                  description: "Output file path (optional)",
                },
                output_dir: {
                  type: "string",
                  description:
                    "Absolute path direcotry where to save the image (use current folder root by default)",
                },
              },
              required: ["prompt", "output_dir"],
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
      } else if (request.params.name === "square_image") {
        return await this.handleGenerateImage({
          ...request.params.arguments,
          size: "1024x1024",
        });
      } else if (request.params.name === "landscape_image") {
        return await this.handleGenerateImage({
          ...request.params.arguments,
          size: "1536x1024",
        });
      } else if (request.params.name === "portrait_image") {
        return await this.handleGenerateImage({
          ...request.params.arguments,
          size: "1024x1536",
        });
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
    const timestamp = new Date().toISOString();
    const testResults = [];
    const fs = await import("fs/promises");
    const path = await import("path");
    const url = await import("url");

    // Get various path information
    const currentDir = process.cwd();
    const scriptPath = url.fileURLToPath(import.meta.url);
    const scriptDir = path.dirname(scriptPath);
    const repoRoot = path.resolve(scriptDir, "..");

    // Test different writable locations
    const testPaths = [
      process.cwd(),
      "/tmp/fs-test-write.txt",
      "./fs-test-write.txt",
      `${currentDir}/fs-test-write.txt`,
      `/var/tmp/fs-test-write.txt`,
      `${scriptDir}/fs-test-write.txt`,
      `${repoRoot}/fs-test-write.txt`,
      `${repoRoot}/output/fs-test-write.txt`,
      `${repoRoot}/temp/fs-test-write.txt`,
      `${repoRoot}/images/fs-test-write.txt`,
      `${repoRoot}/generated/fs-test-write.txt`,
      `${currentDir}/output/fs-test-write.txt`,
      `${currentDir}/temp/fs-test-write.txt`,
      `${currentDir}/images/fs-test-write.txt`,
      "/Users/felix/web/git/repo-md/klepto-repo/articles/fs-test-write.txt",
      "/Users/felix/web/git/repo-md/klepto-repo/articles/images/fs-test-write.txt",
      "/Users/felix/web/git/repo-md/klepto-repo/articles/generated/fs-test-write.txt",
      "/Users/felix/web/git/repo-md/klepto-repo/articles/assets/fs-test-write.txt",
    ];

    // If HOME is available, add it
    if (process.env.HOME) {
      testPaths.push(`${process.env.HOME}/fs-test-write.txt`);
      testPaths.push(`${process.env.HOME}/ai-images/fs-test-write.txt`);
    }

    for (const testPath of testPaths) {
      try {
        // First try to create directory if it doesn't exist
        const dir = path.dirname(testPath);
        try {
          await fs.mkdir(dir, { recursive: true });
        } catch (mkdirError) {
          // Ignore mkdir errors, might already exist or not have permission
        }

        // Try to write a test file
        const testContent = `Test write at ${timestamp}\nPath: ${testPath}\nPID: ${
          process.pid
        }\nCWD: ${process.cwd()}`;

        await fs.writeFile(testPath, testContent, "utf8");

        // Try to read it back
        await fs.readFile(testPath, "utf8");

        // Clean up
        await fs.unlink(testPath);

        testResults.push(
          `✅ SUCCESS: ${testPath} - Write/Read/Delete successful`
        );
      } catch (error) {
        testResults.push(
          `❌ FAILED: ${testPath} - ${error.code}: ${error.message}`
        );
      }
    }

    // Test directory permissions
    const dirTests = [];
    const dirsToTest = [
      currentDir,
      scriptDir,
      repoRoot,
      "/tmp",
      "/var/tmp",
      process.env.HOME,
      "/Users/felix/web/git/repo-md/klepto-repo/articles",
    ].filter(Boolean);

    for (const dir of dirsToTest) {
      try {
        await fs.access(dir, fs.constants.F_OK);
        const stats = await fs.stat(dir);

        try {
          await fs.access(dir, fs.constants.W_OK);
          dirTests.push(
            `📁 ${dir}: EXISTS, WRITABLE (mode: ${stats.mode.toString(8)})`
          );
        } catch {
          dirTests.push(
            `📁 ${dir}: EXISTS, READ-ONLY (mode: ${stats.mode.toString(8)})`
          );
        }
      } catch (error) {
        dirTests.push(`📁 ${dir}: NOT ACCESSIBLE - ${error.code}`);
      }
    }

    // Test process info
    const processInfo = [
      `Process ID: ${process.pid}`,
      `Current Working Directory: ${currentDir}`,
      `Script Path: ${scriptPath}`,
      `Script Directory: ${scriptDir}`,
      `Repo Root (guessed): ${repoRoot}`,
      `Node Version: ${process.version}`,
      `Platform: ${process.platform}`,
      `Architecture: ${process.arch}`,
      `User ID: ${process.getuid ? process.getuid() : "N/A"}`,
      `Group ID: ${process.getgid ? process.getgid() : "N/A"}`,
      `Environment TMPDIR: ${process.env.TMPDIR || "Not set"}`,
      `Environment HOME: ${process.env.HOME || "Not set"}`,
      `Process argv[0]: ${process.argv[0]}`,
      `Process argv[1]: ${process.argv[1]}`,
    ];

    // Create a detailed log and also write it to a file
    const fullReport = [
      `🍕 Pizza Test - Enhanced Filesystem Write Test`,
      `Timestamp: ${timestamp}`,
      ``,
      `📁 Write Test Results:`,
      ...testResults,
      ``,
      `📂 Directory Permission Tests:`,
      ...dirTests,
      ``,
      `🔍 Process Information:`,
      ...processInfo,
      ``,
      `🔑 Secret Password: kangaroo`,
    ].join("\n");

    // Try to write the full report to a log file
    try {
      const logPath = `/tmp/mcp-server-test-${Date.now()}.log`;
      await fs.writeFile(logPath, fullReport, "utf8");
      console.error(`📝 Full report written to: ${logPath}`);
    } catch (logError) {
      console.error(`❌ Could not write log file: ${logError.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: fullReport,
        },
      ],
    };
  }

  async handleGenerateImage(args) {
    const { prompt, size = "1024x1024", model, output, output_dir } = args;

    if (!prompt) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Prompt is required for image generation"
      );
    }

    if (!output_dir) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Output directory is required for image generation"
      );
    }

    // Check if output_dir is a relative path (starts with . or doesn't start with /)
    if (output_dir.startsWith('.') || !output_dir.startsWith('/')) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Output directory must be an absolute path, not a relative path"
      );
    }

    // Test if output directory is writable
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      
      // Create directory if it doesn't exist
      await fs.mkdir(output_dir, { recursive: true });
      
      // Test write permissions by creating a temporary file
      const testFile = path.join(output_dir, `test-write-${Date.now()}.tmp`);
      await fs.writeFile(testFile, "test", "utf8");
      await fs.unlink(testFile);
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Output directory is not writable: ${error.message}`
      );
    }

    try {
      const result = await this.executeAIImageCommand({
        prompt,
        size,
        model,
        output,
        output_dir,
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

  async executeAIImageCommand({ prompt, size, model, output, output_dir }) {
    return new Promise((resolve, reject) => {
      const args = ["ai-image", "generate", "--prompt", prompt, "--size", size];

      // Add optional parameters
      if (model) {
        args.push("--model", model);
      }
      if (output) {
        args.push("--output", output);
      }
      if (output_dir) {
        args.push("--output-dir", output_dir);
      }

      // Pass API key if available in environment
      const apiKey =
        process.env.OPENAI_API_KEY || process.env.REPLICATE_API_TOKEN; //TODO: use the key that matches the model/provider
      if (apiKey) {
        args.push("--api-key", apiKey);
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
        console.error(
          `Progress: Image generation in progress... (${elapsed}s elapsed)`
        );
      }, PROGRESS_UPDATE_INTERVAL);

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        // Reset progress when we receive data
        console.error(
          "Progress: Received output from image generation process"
        );
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
        // Reset progress when we receive data
        console.error(
          "Progress: Received stderr from image generation process"
        );
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
