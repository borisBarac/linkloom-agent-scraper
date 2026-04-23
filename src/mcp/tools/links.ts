import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  extractDownloadLinksFromHtml,
  extractLinks,
} from "../../scraper/data_processing/extraction/link_extraction";

export const registerLinksTool = (server: McpServer): void => {
  server.registerTool(
    "extract_links",
    {
      title: "Extract Links",
      description:
        "Extract URLs from text or PDF download links from HTML content",
      inputSchema: z.object({
        input: z.string().describe("Text containing URLs, or HTML content"),
        isHtml: z
          .boolean()
          .optional()
          .describe(
            "Set to true to treat input as HTML and extract PDF download links (default: false)",
          ),
        isFile: z
          .boolean()
          .optional()
          .describe(
            "Set to true if 'input' is a file path to read from (default: false)",
          ),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ input, isHtml, isFile }) => {
      try {
        let content: string;
        if (isFile) {
          content = await Bun.file(input).text();
        } else {
          content = input;
        }

        if (isHtml) {
          const links = await extractDownloadLinksFromHtml(content);
          return {
            content: [{ type: "text", text: JSON.stringify(links, null, 2) }],
          };
        }

        const links = extractLinks(content);
        return {
          content: [{ type: "text", text: JSON.stringify(links, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Link extraction failed: ${message}` },
          ],
          isError: true,
        };
      }
    },
  );
};
