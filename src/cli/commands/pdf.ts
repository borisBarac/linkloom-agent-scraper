import { defineCommand } from "citty";
import { convertPdfToMarkdown } from "../../scraper/data_processing/conversion/pdf_converter";
import { writeOutput } from "../output";

export default defineCommand({
  meta: {
    name: "pdf",
    description: "Convert a PDF file to markdown",
  },
  args: {
    file: {
      type: "positional",
      description: "Path to PDF file",
      required: true,
    },
    output: {
      alias: "o",
      type: "string",
      description: "Output file path (default: stdout)",
    },
  },
  async run(ctx) {
    const { file, output } = ctx.args;
    try {
      const arrayBuffer = await Bun.file(file as string).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const markdown = await convertPdfToMarkdown(buffer);
      await writeOutput(markdown, output);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  },
});
