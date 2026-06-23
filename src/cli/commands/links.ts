import { defineCommand } from "citty";
import {
  extractDownloadLinksFromHtml,
  extractLinks,
} from "../../scraper/data_processing/extraction/link_extraction";
import { writeOutput } from "../output";
import { renderUrlToHtml } from "../utils";

const isUrl = (input: string): boolean => {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default defineCommand({
  meta: {
    name: "links",
    description: "Extract and classify links from text, HTML, or a URL",
  },
  args: {
    input: {
      type: "positional",
      description: "Text, HTML string, URL, or path to a file",
      required: true,
    },
    output: {
      alias: "o",
      type: "string",
      description: "Output file path (default: stdout)",
    },
    html: {
      type: "boolean",
      description: "Treat input as HTML to extract PDF download links",
      default: false,
    },
    file: {
      type: "boolean",
      description: "Treat input as a file path to read from",
      default: false,
    },
  },
  async run(ctx) {
    const { input, output, html: htmlFlag, file: fileFlag } = ctx.args;

    try {
      let content = input as string;
      const inputIsUrl = !fileFlag && isUrl(input as string);

      if (fileFlag) {
        content = await Bun.file(input as string).text();
      } else if (inputIsUrl) {
        content = await renderUrlToHtml(input as string);
      }

      let result: string;
      if (htmlFlag || inputIsUrl) {
        const downloadLinks = await extractDownloadLinksFromHtml(content);
        result = JSON.stringify(downloadLinks, null, 2);
      } else {
        const links = extractLinks(content);
        result = JSON.stringify(links, null, 2);
      }

      await writeOutput(result, output);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  },
});
