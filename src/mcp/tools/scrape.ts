import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convertLinkToMarkdown } from "../../scraper/link_to_markdown";

export const registerScrapeTool = (server: McpServer): void => {
  server.registerTool(
    "scrape",
    {
      title: "Scrape URL",
      description:
        "Scrape a URL (HTML page or PDF file) and convert to markdown",
      inputSchema: z.object({
        url: z.string().describe("URL to scrape (HTML page or PDF file)"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ url }) => {
      try {
        const markdown = await convertLinkToMarkdown(url);
        return { content: [{ type: "text", text: markdown }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Scrape failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
};
