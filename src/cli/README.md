# CLI Reference

```
bun run cli <command> [options]
```

## Commands

### `scrape <url>`

Convert a URL (HTML page or PDF) to markdown.

```bash
bun run cli scrape https://example.com
bun run cli scrape https://example.com/paper.pdf -o output.md
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |

### `html [file]`

Convert HTML to markdown. Reads from a file argument or stdin.

```bash
bun run cli html page.html
echo "<h1>Hello</h1>" | bun run cli html
bun run cli html page.html -o output.md
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |
| `--run-js` | Enable JavaScript execution (default: false) |
| `--base-url` | Base URL for resolving relative links |

### `pdf <file>`

Convert a PDF file to markdown.

```bash
bun run cli pdf document.pdf
bun run cli pdf document.pdf -o output.md
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |

### `render <url>`

Render a URL with a headless browser and output raw HTML.

```bash
bun run cli render https://example.com
bun run cli render https://example.com -o page.html --wait-until networkidle
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |
| `--timeout` | Page load timeout in ms (default: 10000) |
| `--wait-until` | Wait until event: `domcontentloaded`, `load`, `networkidle` (default: `networkidle`) |
| `--selector` | CSS selector to extract a specific element instead of the full page |

### `links <input>`

Extract and classify links from text, HTML, or a URL. URLs are auto-detected and fetched with a headless browser.

```bash
bun run cli links "Visit https://example.com and https://site.com/doc.pdf"
bun run cli links page.html --file --html
bun run cli links https://example.com
bun run cli links https://example.com -o links.json
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |
| `--html` | Treat input as HTML and extract PDF download links |
| `--file` | Treat input as a file path to read from |

### `tables <url>`

Extract HTML tables from a web page as markdown.

```bash
bun run cli tables https://example.com/data
bun run cli tables https://example.com/data --selector "table.stats"
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |
| `--selector` | CSS selector for tables (default: `table`) |

### `mcp`

Start the MCP server. See [MCP Server docs](../mcp/README.md) for details.

```bash
bun run cli mcp
```
