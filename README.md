# LinkLoom

Web scraping, content extraction, and markdown conversion — in TypeScript/Bun.

Pass a URL, get clean markdown. Render JS-heavy pages. Extract links, tables, and embeddings.

## Features

- **URL to Markdown** — pass any URL, get clean markdown back. Auto-detects HTML pages vs PDF files
- **HTML to Markdown** — extract readable content from raw HTML using Readability + Turndown
- **PDF to Markdown** — parse PDF buffers into structured markdown
- **Headless browser rendering** — render JavaScript-heavy pages via Camoufox (stealth Firefox/Playwright)
- **iframe support** — extract content from nested frames with configurable wait strategies
- **Link extraction** — pull and classify URLs from text or HTML (PDF vs Page)
- **Table extraction** — scrape HTML tables from pages and convert to markdown tables
- **Text embeddings** — generate vectors via OpenAI or Gemini (optional, requires API key)
- **CLI** — use every feature from the command line
- **MCP Server** — expose all tools to Claude Desktop, Cursor, and other MCP clients

## Tech Stack

Bun, Camoufox, JSDOM + Readability + Turndown, pdf.js-extract, LangChain (optional embeddings)

## Setup

### Prerequisites

- [Bun](https://bun.sh/) runtime
- [camoufox] (https://camoufox.com/) headless browser

### Install

```bash
bun install
npx camoufox-js fetch
```

### Environment

```bash
cp env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PAGE_LOAD_TIMEOUT` | No | `10000` | Browser page load timeout (ms) |
| `FRAME_TIMEOUT` | No | `5000` | iframe load timeout (ms) |
| `PDF_DOWNLOAD_TIMEOUT` | No | `30000` | PDF download timeout (ms) |
| `OPENAI_API_KEY` | Yes\* | — | Required for `textToVector` with OpenAI |
| `GEMINI_API_KEY` | Yes\* | — | Required for `textToVector` with Gemini |

> \* Only needed if you use the `textToVector` embedding feature. The core scraping and conversion pipeline works without any API keys.

## Documentation

| Document | Description |
|---|---|
| [Library API](src/README.md) | Programmatic usage with code examples for every module |
| [CLI Reference](src/cli/README.md) | Command-line interface — all subcommands, flags, and examples |
| [MCP Server](src/mcp/README.md) | Model Context Protocol server for AI clients (Claude, Cursor, etc.) |

## Scripts

| Command | Description |
|---|---|
| `bun run start` | Run the entry point |
| `bun run cli` | Run the CLI |
| `bun run mcp` | Run the MCP server |
| `bun run check` | Format + lint (biome) |
| `bun run type_check` | TypeScript type check |
| `bun test` | Run tests |
