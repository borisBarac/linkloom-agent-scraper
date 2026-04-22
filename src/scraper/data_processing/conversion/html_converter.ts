import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { ScrapperError } from "../../types/internal";

type CleanHtmlToMarkdownOptions = {
  runJS?: boolean;
  baseUrl?: string;
};

export const cleanHtmlToMarkdown = (
  html: string,
  options: CleanHtmlToMarkdownOptions = {},
): string => {
  const { runJS = false } = options;

  if (!html || typeof html !== "string" || html.trim().length === 0) {
    console.warn("Attempted to clean empty or invalid HTML string.");
    return ""; // Return empty for empty input
  }

  const dom = new JSDOM(html, {
    runScripts: runJS ? "dangerously" : "outside-only",
    resources: "usable",
    url: options.baseUrl || "http://localhost",
  });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article?.content) {
    console.error("Readability failed to extract main content from HTML.");
    throw new ScrapperError(
      "ERR_MARKDOWN_CONTENT_EXTRACTION_FAILED",
      "Failed to extract readable content from HTML.",
    );
  }

  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  // Add any custom Turndown rules if needed, e.g., for tables, specific tags.

  let markdown: string;
  try {
    markdown = turndownService.turndown(
      (article.title ?? "") + article.content,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Turndown conversion failed: ${errorMessage}`);
    throw new ScrapperError(
      "ERR_MARKDOWN_CONVERSION_FAILED",
      `Failed to convert HTML to Markdown: ${errorMessage}`,
    );
  }

  if (
    !markdown ||
    (typeof markdown === "string" && markdown.trim().length === 0)
  ) {
    console.warn(
      "Turndown conversion resulted in empty or non-string markdown content.",
    );
  }

  return markdown;
};
