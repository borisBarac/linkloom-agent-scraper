import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const CLI_ENTRY = `${import.meta.dir}/../cli.ts`;
const FIXTURES_DIR = join(import.meta.dir, "__e2e_fixtures__");
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
let fixtureServer: Server | undefined;
let fixtureBaseUrl: string;

async function closeMcpClient() {
  try {
    await client?.close();
  } finally {
    client = undefined;
  }
}

async function listenOnAvailablePort(server: Server): Promise<number> {
  for (let port = 39200; port < 39220; port++) {
    const started = await new Promise<boolean>((resolve) => {
      const onError = () => {
        server.off("listening", onListening);
        resolve(false);
      };
      const onListening = () => {
        server.off("error", onError);
        resolve(true);
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, "127.0.0.1");
    });

    if (started) {
      return port;
    }
  }

  throw new Error("Failed to start fixture server on an available port");
}

beforeAll(async () => {
  mkdirSync(FIXTURES_DIR, { recursive: true });
  writeFileSync(PDF_FIXTURE_PATH, PDF_FIXTURE);

  fixtureServer = createServer((request, response) => {
    const pathname = request.url
      ? new URL(request.url, "http://fixture").pathname
      : "/";

    if (pathname === "/page") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(PAGE_HTML);
      return;
    }

    if (pathname === "/sample.pdf") {
      response.writeHead(200, { "content-type": "application/pdf" });
      response.end(PDF_FIXTURE);
      return;
    }

    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });

  const port = await listenOnAvailablePort(fixtureServer);
  fixtureBaseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await closeMcpClient();

  await new Promise<void>((resolve, reject) => {
    if (!fixtureServer?.listening) {
      resolve();
      return;
    }

    fixtureServer.close((error) => (error ? reject(error) : resolve()));
  });
  rmSync(FIXTURES_DIR, { recursive: true, force: true });
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

function expectTextContent(result: Awaited<ReturnType<Client["callTool"]>>) {
  expect(result.isError).not.toBe(true);
  expect(result.content).toHaveLength(1);

  const [content] = result.content as Array<{ type: string; text: string }>;
  expect(content.type).toBe("text");
  return content.text;
}

describe("MCP server", () => {
  it("starts through the CLI and exposes all tools", async () => {
    const mcp = await connectMcpServer();
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

  it("calls every tool over stdio", async () => {
    const mcp = await connectMcpServer();

    const markdown = await mcp.callTool({
      name: "html_to_markdown",
      arguments: {
        html: "<h1>Hello</h1><p>This is <strong>MCP</strong>.</p>",
      },
    });
    expect(expectTextContent(markdown)).toBe("## Hello\n\nThis is **MCP**.");

    const links = await mcp.callTool({
      name: "extract_links",
      arguments: {
        input: HTML_WITH_LINKS,
        isHtml: true,
      },
    });
    expect(JSON.parse(expectTextContent(links))).toEqual([
      "https://example.com/report.pdf",
      "https://example.com/data.pdf",
    ]);

    const pdf = await mcp.callTool({
      name: "pdf_to_markdown",
      arguments: { filePath: PDF_FIXTURE_PATH },
    });
    expect(expectTextContent(pdf)).toContain("Dummy PDF file");

    const render = await mcp.callTool({
      name: "render_page",
      arguments: {
        url: `${fixtureBaseUrl}/page`,
        selector: "#title",
      },
    });
    expect(expectTextContent(render)).toBe(
      '<h1 id="title">Local MCP Page</h1>',
    );

    const tables = await mcp.callTool({
      name: "extract_tables",
      arguments: {
        url: `${fixtureBaseUrl}/page`,
        selector: "#stats",
      },
    });
    expect(expectTextContent(tables)).toContain("| Ada | 98 |");

    const scrape = await mcp.callTool({
      name: "scrape",
      arguments: { url: `${fixtureBaseUrl}/sample.pdf` },
    });
    expect(expectTextContent(scrape)).toContain("Dummy PDF file");
  }, 30000);
});
