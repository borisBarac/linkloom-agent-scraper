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
| `search_web` | Search the web with Brave and return structured results |
| `extract_tables` | Extract HTML tables from a web page as markdown |

## Usage

```bash
bunx @boris.barac/linkloom mcp
```

Or from source:

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
      "args": ["x", "@boris.barac/linkloom", "mcp"]
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
      "args": ["x", "@boris.barac/linkloom", "mcp"]
    }
  }
}
```

### Any MCP Client

The server is a standard stdio MCP server. Point your client at:

```
command: bun
args: ["x", "@boris.barac/linkloom", "mcp"]
```

## MCP Inspector

Test and debug the server interactively using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
bunx @modelcontextprotocol/inspector bunx @boris.barac/linkloom mcp
```

This opens a web UI where you can browse available tools, call them with custom parameters, and inspect JSON-RPC messages.
