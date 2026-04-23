import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cleanHtmlToMarkdown } from "../../scraper/data_processing/conversion/html_converter";

export const registerHtmlTool = (server: McpServer): void => {
  server.registerTool(
    "html_to_markdown",
    {
      title: "HTML to Markdown",
      description: "Convert raw HTML to markdown",
      inputSchema: z.object({
        html: z.string().describe("Raw HTML string to convert"),
        runJs: z
          .boolean()
          .optional()
          .describe("Enable JavaScript execution (default: true)"),
        baseUrl: z
          .string()
          .optional()
          .describe("Base URL for resolving relative links"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ html, runJs, baseUrl }) => {
      try {
        const markdown = cleanHtmlToMarkdown(html, {
          runJS: runJs ?? false,
          baseUrl,
        });
        return { content: [{ type: "text", text: markdown }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `HTML conversion failed: ${message}` },
          ],
          isError: true,
        };
      }
    },
  );
};
