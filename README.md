# LinkLoom

TypeScript/Bun library for web scraping, content extraction, and markdown conversion.

## Features

- **URL to Markdown** — pass any URL, get clean markdown back. Auto-detects HTML pages vs PDF files
- **HTML to Markdown** — extract readable content from raw HTML using Readability + Turndown
- **PDF to Markdown** — parse PDF buffers into structured markdown with headings, lists, and code blocks
- **Headless browser rendering** — render JavaScript-heavy pages via Camoufox (stealth Firefox/Playwright)
- **iframe support** — extract content from nested frames with configurable wait strategies
- **Link extraction** — pull and classify URLs from text or HTML (PDF vs Page)
- **Table extraction** — scrape HTML tables from pages and convert to markdown tables
- **Text embeddings** — generate vectors via OpenAI or Gemini (optional, requires API key)
- **Temp file management** — download, save, and auto-cleanup of temp files
- **HTML minification** — strip comments, whitespace, and line breaks from HTML
- **Proxy support** - rotating proxy 

## Usage

### Scrape any URL to markdown

Auto-detects HTML pages and PDF files, returns clean markdown.

```ts
import { convertLinkToMarkdown } from "scraper_service";

const markdown = await convertLinkToMarkdown("https://example.com");
```

### Convert HTML to markdown

```ts
import { htmlConverter } from "scraper_service";

const markdown = htmlConverter.cleanHtmlToMarkdown("<html>...</html>", {
  runJS: false,
  baseUrl: "https://example.com",
});
```

### Convert PDF to markdown or text

```ts
import { pdfConverter } from "scraper_service";

const buffer = await fsPromises.readFile("document.pdf");
const markdown = await pdfConverter.convertPdfToMarkdown(buffer);
const text = await pdfConverter.convertPdfToText(buffer);
```

### Render pages with headless browser

```ts
import { renderers } from "scraper_service";

const browser = await renderers.puppeterRendered.initialize();
const result = await renderers.puppeterRendered.renderPage(browser, url, {
  timeout: 15000,
  waitUntil: "networkidle",
  viewport: { width: 1920, height: 1080 },
  frames: { enabled: true, timeout: 5000 },
});
await browser.close();
```

### Extract links from text or HTML

```ts
import { linkExtraction } from "scraper_service";

const links = linkExtraction.extractLinks("check https://example.com/doc.pdf");
const pdfLinks = await linkExtraction.extractDownloadLinksFromHtml(htmlContent);
```

### Extract tables from web pages

```ts
import { tableExtraction, renderers } from "scraper_service";

const browser = await renderers.puppeterRendered.initialize();
const data = await tableExtraction.extractTableData(browser, url, "table");
const md = tableExtraction.tableDataToMarkdownTable(data);
await browser.close();
```

### Generate text embeddings

Requires an OpenAI or Gemini API key.

```ts
import { textToVector } from "scraper_service";

const vector = await textToVector("hello world", { provider: "openai" });
```

## Setup

### Prerequisites

- [Bun](https://bun.sh/) runtime

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

### Scripts

| Command | Description |
|---|---|
| `bun run start` | Run the entry point |
| `bun run check` | Format + lint (biome) |
| `bun run type_check` | TypeScript type check |
| `bun test` | Run tests |

## Tech Stack

Bun, Camoufox + Playwright, JSDOM + Readability + Turndown, pdf.js-extract, LangChain (optional embeddings)
