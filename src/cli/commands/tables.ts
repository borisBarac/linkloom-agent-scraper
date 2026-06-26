import { defineCommand } from "citty";
import {
  extractTableData,
  tableDataToMarkdownTable,
} from "../../scraper/data_processing/extraction/table_extraction";
import { withBrowser } from "../../scraper/renderers/renderer";
import { writeOutput } from "../output";

export default defineCommand({
  meta: {
    name: "tables",
    description: "Extract HTML tables from a web page as markdown",
  },
  args: {
    url: {
      type: "positional",
      description: "URL of the page containing tables",
      required: true,
    },
    output: {
      alias: "o",
      type: "string",
      description: "Output file path (default: stdout)",
    },
    selector: {
      type: "string",
      description: "CSS selector for tables (default: table)",
      default: "table",
    },
  },
  async run(ctx) {
    const { url, output, selector } = ctx.args;

    try {
      const data = await withBrowser((browser) =>
        extractTableData(
          browser,
          url as string,
          (selector as string) ?? "table",
        ),
      );
      const markdown = tableDataToMarkdownTable(data);
      await writeOutput(markdown, output);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  },
});
