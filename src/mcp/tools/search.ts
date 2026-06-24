import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  type SearchEngine,
  searchWeb,
} from "../../scraper/data_processing/extraction/web_search";

export const registerSearchTool = (server: McpServer): void => {
  server.registerTool(
    "search_web",
    {
      title: "Web Search",
      description: "Search the web with Brave and return structured results",
      inputSchema: z.object({
        query: z.string().describe("Search query"),
        limit: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Maximum number of results to return"),
        engine: z
          .enum(["brave"])
          .optional()
          .describe("Search engine to use (default: brave)"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ query, limit, engine }) => {
      try {
        const results = await searchWeb({
          query,
          limit,
          engine: (engine ?? "brave") as SearchEngine,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Search failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
};
