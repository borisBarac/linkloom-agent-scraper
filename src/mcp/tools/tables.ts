import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  extractTableData,
  tableDataToMarkdownTable,
} from "../../scraper/data_processing/extraction/table_extraction";
import { withBrowser } from "../../scraper/renderers/renderer";

export const registerTablesTool = (server: McpServer): void => {
  server.registerTool(
    "extract_tables",
    {
      title: "Extract Tables",
      description: "Extract HTML tables from a web page as markdown",
      inputSchema: z.object({
        url: z.string().describe("URL of the page containing HTML tables"),
        selector: z
          .string()
          .optional()
          .describe("CSS selector for tables (default: 'table')"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ url, selector }) => {
      try {
        const data = await withBrowser((browser) =>
          extractTableData(browser, url, selector ?? "table"),
        );
        const markdown = tableDataToMarkdownTable(data);
        return { content: [{ type: "text", text: markdown }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Table extraction failed: ${message}` },
          ],
          isError: true,
        };
      }
    },
  );
};
