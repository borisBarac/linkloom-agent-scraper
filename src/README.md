# Library API

Programmatic usage for every module exported by LinkLoom. All imports go through the package entry point:

```ts
import { ... } from "linkloom";
```

---

## Scrape any URL to markdown

Auto-detects HTML pages and PDF files, returns clean markdown.

```ts
import { convertLinkToMarkdown } from "linkloom";

const markdown = await convertLinkToMarkdown("https://example.com");
```

## Convert HTML to markdown

```ts
import { htmlConverter } from "linkloom";

const markdown = htmlConverter.cleanHtmlToMarkdown("<html>...</html>", {
  runJS: false,
  baseUrl: "https://example.com",
});
```

## Convert PDF to markdown or text

```ts
import { pdfConverter } from "linkloom";
import { readFile } from "node:fs/promises";

const buffer = await readFile("document.pdf");
const markdown = await pdfConverter.convertPdfToMarkdown(buffer);
const text = await pdfConverter.convertPdfToText(buffer);
```

## Render pages with headless browser

```ts
import { renderers } from "linkloom";

const browser = await renderers.puppeterRendered.initialize();
const result = await renderers.puppeterRendered.renderPage(browser, url, {
  timeout: 15000,
  waitUntil: "networkidle",
  viewport: { width: 1920, height: 1080 },
  frames: { enabled: true, timeout: 5000 },
});
await browser.close();
```

## Extract links from text or HTML

```ts
import { linkExtraction } from "linkloom";

const links = linkExtraction.extractLinks("check https://example.com/doc.pdf");
const pdfLinks = await linkExtraction.extractDownloadLinksFromHtml(htmlContent);
```

## Extract tables from web pages

```ts
import { tableExtraction, renderers } from "linkloom";

const browser = await renderers.puppeterRendered.initialize();
const data = await tableExtraction.extractTableData(browser, url, "table");
const md = tableExtraction.tableDataToMarkdownTable(data);
await browser.close();
```

## Generate text embeddings

Requires an OpenAI or Gemini API key. Set `OPENAI_API_KEY` or `GEMINI_API_KEY` in your `.env`.

```ts
import { textToVector } from "linkloom";

const vector = await textToVector("hello world", { provider: "openai" });
```

## Temp file management

```ts
import { fileManager } from "linkloom";

const path = fileManager.saveToTempDir(buffer, "page.html");
```
