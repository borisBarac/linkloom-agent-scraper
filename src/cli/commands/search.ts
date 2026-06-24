import { defineCommand } from "citty";
import {
  type SearchEngine,
  searchWeb,
} from "../../scraper/data_processing/extraction/web_search";
import { writeOutput } from "../output";

export default defineCommand({
  meta: {
    name: "search",
    description: "Search the web with Brave and return JSON results",
  },
  args: {
    query: {
      type: "positional",
      description: "Search query",
      required: true,
    },
    limit: {
      type: "string",
      description: "Maximum number of results to return",
    },
    engine: {
      type: "string",
      description: "Search engine to use (default: brave)",
    },
    output: {
      alias: "o",
      type: "string",
      description: "Output file path (default: stdout)",
    },
  },
  async run(ctx) {
    const { query, limit, engine, output } = ctx.args;

    try {
      const parsedLimit =
        limit === undefined ? undefined : Number.parseInt(limit as string, 10);
      if (limit !== undefined && Number.isNaN(parsedLimit)) {
        throw new Error(`Invalid limit value: ${limit}`);
      }

      const parsedEngine = (engine as SearchEngine | undefined) ?? "brave";
      const results = await searchWeb({
        query: query as string,
        limit: parsedLimit,
        engine: parsedEngine,
      });

      await writeOutput(JSON.stringify(results, null, 2), output);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  },
});
