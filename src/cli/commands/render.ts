import { defineCommand } from "citty";
import { initialize, renderPage } from "../../scraper/renderers/renderer";
import { writeOutput } from "../output";

export default defineCommand({
  meta: {
    name: "render",
    description: "Render a URL with headless browser and output raw HTML",
  },
  args: {
    url: {
      type: "positional",
      description: "URL to render",
      required: true,
    },
    output: {
      alias: "o",
      type: "string",
      description: "Output file path (default: stdout)",
    },
    timeout: {
      type: "string",
      description: "Page load timeout in ms",
      default: "10000",
    },
    "wait-until": {
      type: "string",
      description: "Wait until event: domcontentloaded | load | networkidle",
      default: "domcontentloaded",
    },
    selector: {
      type: "string",
      description:
        "CSS selector to extract a specific element's outer HTML instead of the full page",
    },
  },
  async run(ctx) {
    const {
      url,
      output,
      timeout,
      "wait-until": waitUntil,
      selector,
    } = ctx.args;

    let browser: import("playwright").Browser | undefined;
    try {
      browser = await initialize();
      const result = await renderPage(browser, url as string, {
        timeout: timeout ? Number(timeout) : 10000,
        waitUntil:
          (waitUntil as "domcontentloaded" | "load" | "networkidle") ??
          "domcontentloaded",
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
          console.error(`Error: No element found for selector "${selector}"`);
          process.exit(1);
        }
        html = element.outerHTML;
      }

      await writeOutput(html, output);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
});
