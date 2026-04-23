import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Browser } from "playwright";
import { z } from "zod";
import { initialize, renderPage } from "../../scraper/renderers/renderer";

export const registerRenderTool = (server: McpServer): void => {
  server.registerTool(
    "render_page",
    {
      title: "Render Page",
      description:
        "Render a URL with a headless browser and return the HTML content",
      inputSchema: z.object({
        url: z.string().describe("URL to render with headless browser"),
        timeout: z
          .number()
          .optional()
          .describe("Page load timeout in ms (default: 10000)"),
        waitUntil: z
          .enum(["domcontentloaded", "load", "networkidle"])
          .optional()
          .describe("Wait until event (default: domcontentloaded)"),
        selector: z
          .string()
          .optional()
          .describe(
            "CSS selector to extract a specific element instead of full page",
          ),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ url, timeout, waitUntil, selector }) => {
      let browser: Browser | undefined;
      try {
        browser = await initialize();
        const result = await renderPage(browser, url, {
          timeout: timeout ?? 10000,
          waitUntil: waitUntil ?? "domcontentloaded",
          frames: { enabled: false },
        });

        let html: string;
        if (typeof result === "string") {
          html = result;
        } else {
          html = result.mainContent;
        }

        if (selector) {
          const { JSDOM } = await import("jsdom");
          const dom = new JSDOM(html);
          const element = dom.window.document.querySelector(selector);
          if (!element) {
            return {
              content: [
                {
                  type: "text",
                  text: `No element found for selector "${selector}"`,
                },
              ],
              isError: true,
            };
          }
          html = element.outerHTML;
        }

        return { content: [{ type: "text", text: html }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Render failed: ${message}` }],
          isError: true,
        };
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    },
  );
};
