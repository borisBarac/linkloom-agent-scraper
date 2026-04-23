#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerHtmlTool } from "./mcp/tools/html";
import { registerLinksTool } from "./mcp/tools/links";
import { registerPdfTool } from "./mcp/tools/pdf";
import { registerRenderTool } from "./mcp/tools/render";
import { registerScrapeTool } from "./mcp/tools/scrape";
import { registerTablesTool } from "./mcp/tools/tables";

const server = new McpServer({ name: "linkloom", version: "1.0.0" });

registerScrapeTool(server);
registerHtmlTool(server);
registerPdfTool(server);
registerRenderTool(server);
registerLinksTool(server);
registerTablesTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);
