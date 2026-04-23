import { defineCommand } from "citty";
import { convertLinkToMarkdown } from "../../scraper/link_to_markdown";
import { writeOutput } from "../output";

export default defineCommand({
  meta: {
    name: "scrape",
    description: "Convert a URL (HTML page or PDF) to markdown",
  },
  args: {
    url: {
      type: "positional",
      description: "URL to scrape",
      required: true,
    },
    output: {
      alias: "o",
      type: "string",
      description: "Output file path (default: stdout)",
    },
  },
  async run(ctx) {
    const { url, output } = ctx.args;
    try {
      const markdown = await convertLinkToMarkdown(url as string);
      await writeOutput(markdown, output);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  },
});
