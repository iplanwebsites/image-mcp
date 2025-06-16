# Image MCP Server

An MCP (Model Context Protocol) server that provides AI image generation capabilities using the [ai-image](https://www.npmjs.com/package/ai-image) npm module, which wraps around OpenAI and Replicate image inference APIs.

## Features

- **generate_ai_image**: Generate AI images with customizable prompts, sizes, models, and styles
- **square_image**: Generate square images (1024x1024) - shortcut command
- **landscape_image**: Generate landscape images (1536x1024) - shortcut command
- **portrait_image**: Generate portrait images (1024x1536) - shortcut command
- Built on the ai-image module for seamless integration with OpenAI and Replicate APIs
- Simple setup and configuration

## Installation

```bash
npm install -g image-mcp
```

## Setup

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "image-mcp": {
      "command": "npx",
      "args": ["image-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key",
        "REPLICATE_API_TOKEN": "your-replicate-api-token",
        "MCP_TIMEOUT": "1200000"
      },
      "resetTimeoutOnProgress": true
    }
  }
}
```

### Environment Variables

The server requires API keys for the underlying image generation services:

- `OPENAI_API_KEY`: Your OpenAI API key for GPT-based models (we won't be supporting Dall-e models as they'll likely be dropped soon)
- `REPLICATE_API_TOKEN`: Your Replicate API token for other AI models

## Usage

Once configured, you can use the image generation functions through Claude:

### generate_ai_image

Generate AI images with various parameters:

- **prompt** (required): Text description of the image to generate
- **size** (optional): Image dimensions in WIDTHxHEIGHT format (default: "1024x1024")
- **model** (optional): Specific AI model to use
- **output** (optional): Custom output file path

### Shortcut Commands

For convenience, use these preset size commands:

- **square_image**: Generate 1024x1024 square images
- **landscape_image**: Generate 1536x1024 landscape images
- **portrait_image**: Generate 1024x1536 portrait images

All shortcut commands accept the same parameters as `generate_ai_image` except `size` (which is preset).

Example prompts:

- "A red cat in Picasso style"
- "A sunset over mountains, photorealistic"
- "Abstract geometric patterns in blue and gold"

## Development

```bash
# Clone the repository
git clone https://github.com/iplanwebsites/image-mcp.git
cd image-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Start the server
npm start
```

## Requirements

- Node.js >= 18.0.0
- Valid API keys for OpenAI and/or Replicate

## TODOs

### Urgent

- [ ] **Fix npm module issue**: It only works locally...

### Improvements

- [ ] **Better guides**: Add more detailed setup guides with troubleshooting steps, an Add to cursor button, etc

- [x] **Use ai-image library directly**: Replace subprocess CLI calls with direct library imports
- [ ] **Return file paths**: Return created image file paths in response
- [ ] **Local inference support**: Add support for local models like Flux
- [ ] **Image optimization**: Add lightweight image resizing and optimization options
- [ ] **Image captioning tool**: Add captioning model for basic use cases (useful for models without vision)

## License

MIT
