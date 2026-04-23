import { defineCommand } from "citty";
import { cleanHtmlToMarkdown } from "../../scraper/data_processing/conversion/html_converter";
import { writeOutput } from "../output";

export default defineCommand({
  meta: {
    name: "html",
    description: "Convert HTML to markdown (from file or stdin)",
  },
  args: {
    file: {
      type: "positional",
      description: "HTML file path (reads from stdin if omitted)",
      required: false,
    },
    output: {
      alias: "o",
      type: "string",
      description: "Output file path (default: stdout)",
    },
    "run-js": {
      type: "boolean",
      description: "Enable JavaScript execution",
      default: true,
    },
    "base-url": {
      type: "string",
      description: "Base URL for resolving relative links",
    },
  },
  async run(ctx) {
    const { file, output, "run-js": runJs, "base-url": baseUrl } = ctx.args;

    try {
      let html: string;
      if (file) {
        html = await Bun.file(file).text();
      } else {
        html = await new Response(Bun.stdin).text();
      }

      const markdown = cleanHtmlToMarkdown(html, {
        runJS: runJs as boolean,
        baseUrl: baseUrl as string | undefined,
      });

      await writeOutput(markdown, output);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  },
});
