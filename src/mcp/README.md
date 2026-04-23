# LinkLoom MCP Server

> [Back to main README](../../README.md)

A Model Context Protocol server exposing LinkLoom's scraping, conversion, and extraction tools to MCP clients (Claude Desktop, Cursor, etc.).

## Quick Start

```bash
bun run mcp
```

The server communicates over stdio — it reads JSON-RPC from stdin and writes responses to stdout. You don't run it directly; MCP clients spawn it as a child process.

## Available Tools

| Tool | Description |
|------|-------------|
| `scrape` | Scrape a URL (HTML or PDF) and return markdown |
| `html_to_markdown` | Convert raw HTML to markdown |
| `pdf_to_markdown` | Convert a local PDF file to markdown |
| `render_page` | Render a URL with a headless browser and return HTML |
| `extract_links` | Extract URLs from text, or PDF download links from HTML |
| `extract_tables` | Extract HTML tables from a web page as markdown |

## Usage

```bash
bun run cli mcp      # via CLI subcommand
bun run mcp          # via script shortcut
bun run src/mcp.ts   # via entry point
```

## Client Configuration

Add one of these to your MCP client's config file.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "linkloom": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/LinkLoom/src/mcp.ts"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "linkloom": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/LinkLoom/src/mcp.ts"]
    }
  }
}
```

### Any MCP Client

The server is a standard stdio MCP server. Point your client at:

```
command: bun
args: ["run", "/absolute/path/to/LinkLoom/src/mcp.ts"]
```

## Smoke Testing

Test the initialize handshake:

```bash
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' | bun run cli mcp
```

List all tools:

```bash
printf '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}\n{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}\n' | bun run cli mcp
```
