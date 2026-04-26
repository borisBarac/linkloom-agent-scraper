# CLI Reference

## Using via bunx (no install required)

```bash
bunx @boris.barac/linkloom <command> [options]
```

## Development (from source)

```bash
bun run cli <command> [options]
```

## Commands

### `scrape <url>`

Convert a URL (HTML page or PDF) to markdown.

```bash
bunx @boris.barac/linkloom scrape https://example.com
bunx @boris.barac/linkloom scrape https://example.com/paper.pdf -o output.md
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |

### `html [file]`

Convert HTML to markdown. Reads from a file argument or stdin.

```bash
bunx @boris.barac/linkloom html page.html
echo "<h1>Hello</h1>" | bunx @boris.barac/linkloom html
bunx @boris.barac/linkloom html page.html -o output.md
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |
| `--run-js` | Enable JavaScript execution (default: false) |
| `--base-url` | Base URL for resolving relative links |

### `pdf <file>`

Convert a PDF file to markdown.

```bash
bunx @boris.barac/linkloom pdf document.pdf
bunx @boris.barac/linkloom pdf document.pdf -o output.md
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |

### `render <url>`

Render a URL with a headless browser and output raw HTML.

```bash
bunx @boris.barac/linkloom render https://example.com
bunx @boris.barac/linkloom render https://example.com -o page.html --wait-until networkidle
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
bunx @boris.barac/linkloom links "Visit https://example.com and https://site.com/doc.pdf"
bunx @boris.barac/linkloom links page.html --file --html
bunx @boris.barac/linkloom links https://example.com
bunx @boris.barac/linkloom links https://example.com -o links.json
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |
| `--html` | Treat input as HTML and extract PDF download links |
| `--file` | Treat input as a file path to read from |

### `tables <url>`

Extract HTML tables from a web page as markdown.

```bash
bunx @boris.barac/linkloom tables https://example.com/data
bunx @boris.barac/linkloom tables https://example.com/data --selector "table.stats"
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Write output to a file instead of stdout |
| `--selector` | CSS selector for tables (default: `table`) |

### `mcp`

Start the MCP server. See [MCP Server docs](../mcp/README.md) for details.

```bash
bunx @boris.barac/linkloom mcp
bunx @boris.barac/linkloom-mcp
```
