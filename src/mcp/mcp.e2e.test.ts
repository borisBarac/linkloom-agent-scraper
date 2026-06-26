import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const CLI_ENTRY = `${import.meta.dir}/../cli.ts`;
const FIXTURES_DIR = join(import.meta.dir, "__e2e_fixtures__");
const PAGE_FIXTURE_PATH = join(FIXTURES_DIR, "page.html");
const PDF_FIXTURE_PATH = join(FIXTURES_DIR, "sample.pdf");

const PDF_FIXTURE = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 74 >>
stream
BT
/F1 24 Tf
72 720 Td
(MCP PDF Title) Tj
/F1 12 Tf
0 -36 Td
(Dummy PDF file) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
435
%%EOF
`;

const PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Local MCP Fixture</title>
</head>
<body>
  <main>
    <article>
      <h1 id="title">Local MCP Page</h1>
      <p>This page is served by the MCP e2e fixture.</p>
      <table id="stats">
        <thead>
          <tr><th>Name</th><th>Score</th></tr>
        </thead>
        <tbody>
          <tr><td>Ada</td><td>98</td></tr>
          <tr><td>Grace</td><td>95</td></tr>
        </tbody>
      </table>
    </article>
  </main>
</body>
</html>`;

const HTML_WITH_LINKS = `<!DOCTYPE html>
<html lang="en">
<body>
  <a href="https://example.com/report.pdf">Report</a>
  <a href="https://example.com/page.html">Page</a>
  <a href="https://example.com/data.pdf">Data</a>
</body>
</html>`;

let client: Client | undefined;
let fixturePageUrl: string;
let fixturePdfUrl: string;

async function closeMcpClient() {
  try {
    await client?.close();
  } catch (error) {
    console.warn("Failed to close MCP client during test cleanup:", error);
  } finally {
    client = undefined;
  }
}

beforeAll(async () => {
  mkdirSync(FIXTURES_DIR, { recursive: true });
  writeFileSync(PAGE_FIXTURE_PATH, PAGE_HTML);
  writeFileSync(PDF_FIXTURE_PATH, PDF_FIXTURE);
  fixturePageUrl = pathToFileURL(PAGE_FIXTURE_PATH).href;
  fixturePdfUrl = pathToFileURL(PDF_FIXTURE_PATH).href;
});

afterAll(async () => {
  try {
    await closeMcpClient();
  } finally {
    rmSync(FIXTURES_DIR, { recursive: true, force: true });
  }
});

afterEach(async () => {
  await closeMcpClient();
});

async function connectMcpServer() {
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", CLI_ENTRY, "mcp"],
  });

  client = new Client({ name: "linkloom-mcp-e2e", version: "0.0.0" });
  await client.connect(transport);
  return client;
}

async function withMcpServer<T>(run: (mcp: Client) => Promise<T>): Promise<T> {
  const mcp = await connectMcpServer();

  try {
    return await run(mcp);
  } finally {
    await closeMcpClient();
  }
}

function getTextContent(result: Awaited<ReturnType<Client["callTool"]>>) {
  expect(result.content).toHaveLength(1);

  const [content] = result.content as Array<{ type: string; text: string }>;
  expect(content.type).toBe("text");
  return content.text;
}

async function callToolText(
  mcp: Client,
  name: string,
  arguments_: Record<string, unknown>,
) {
  const result = await mcp.callTool({ name, arguments: arguments_ });

  if (result.isError) {
    throw new Error(`${name} failed: ${getTextContent(result)}`);
  }

  return getTextContent(result);
}

describe("MCP server", () => {
  it("starts through the CLI and exposes all tools", async () => {
    await withMcpServer(async (mcp) => {
      const response = await mcp.listTools();

      expect(response.tools.map((tool) => tool.name).sort()).toEqual([
        "extract_links",
        "extract_tables",
        "html_to_markdown",
        "pdf_to_markdown",
        "render_page",
        "scrape",
        "search_web",
      ]);
    });
  });

  it("calls every tool over stdio", async () => {
    await withMcpServer(async (mcp) => {
      const markdown = await callToolText(mcp, "html_to_markdown", {
        html: "<h1>Hello</h1><p>This is <strong>MCP</strong>.</p>",
      });
      expect(markdown).toBe("## Hello\n\nThis is **MCP**.");

      const links = await callToolText(mcp, "extract_links", {
        input: HTML_WITH_LINKS,
        isHtml: true,
      });
      expect(JSON.parse(links)).toEqual([
        "https://example.com/report.pdf",
        "https://example.com/data.pdf",
      ]);

      const pdf = await callToolText(mcp, "pdf_to_markdown", {
        filePath: PDF_FIXTURE_PATH,
      });
      expect(pdf).toContain("Dummy PDF file");

      const render = await callToolText(mcp, "render_page", {
        url: fixturePageUrl,
        selector: "#title",
      });
      expect(render).toBe('<h1 id="title">Local MCP Page</h1>');

      const tables = await callToolText(mcp, "extract_tables", {
        url: fixturePageUrl,
        selector: "#stats",
      });
      expect(tables).toContain("| Ada | 98 |");

      const scrape = await callToolText(mcp, "scrape", {
        url: fixturePdfUrl,
      });
      expect(scrape).toContain("Dummy PDF file");
    });
  }, 30000);
});
