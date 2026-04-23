import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convertPdfToMarkdown } from "../../scraper/data_processing/conversion/pdf_converter";

export const registerPdfTool = (server: McpServer): void => {
  server.registerTool(
    "pdf_to_markdown",
    {
      title: "PDF to Markdown",
      description: "Convert a PDF file to markdown",
      inputSchema: z.object({
        filePath: z.string().describe("Absolute path to the PDF file"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ filePath }) => {
      try {
        if (!filePath.toLowerCase().endsWith(".pdf")) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid file type: expected .pdf, got "${filePath}"`,
              },
            ],
            isError: true,
          };
        }
        const buffer = Buffer.from(await Bun.file(filePath).arrayBuffer());
        const markdown = await convertPdfToMarkdown(buffer);
        return { content: [{ type: "text", text: markdown }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `PDF conversion failed: ${message}` },
          ],
          isError: true,
        };
      }
    },
  );
};
