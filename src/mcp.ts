#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pkg from "../package.json" with { type: "json" };
import { registerHtmlTool } from "./mcp/tools/html";
import { registerLinksTool } from "./mcp/tools/links";
import { registerPdfTool } from "./mcp/tools/pdf";
import { registerRenderTool } from "./mcp/tools/render";
import { registerScrapeTool } from "./mcp/tools/scrape";
import { registerTablesTool } from "./mcp/tools/tables";

const server = new McpServer({ name: "@boris.barac/linkloom", version: pkg.version });

registerScrapeTool(server);
registerHtmlTool(server);
registerPdfTool(server);
registerRenderTool(server);
registerLinksTool(server);
registerTablesTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(
  [
    "",
    `  LinkLoom MCP Server v${pkg.version}`,
    "",
    "  Transport : stdio (no HTTP port — reads JSON-RPC from stdin)",
    "",
    "  Test with MCP Inspector :",
    "    npx @modelcontextprotocol/inspector bun run src/mcp.ts",
    "",
    "  Tools : scrape, html_to_markdown, pdf_to_markdown, render_page, extract_links, extract_tables",
    "",
  ].join("\n"),
);
