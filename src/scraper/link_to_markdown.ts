import type { Browser } from "puppeteer";
import { FRAME_TIMEOUT, PAGE_LOAD_TIMEOUT } from "../app_config";
import { cleanHtmlToMarkdown } from "./data_processing/conversion/html_converter";
import { convertPdfToMarkdown } from "./data_processing/conversion/pdf_converter";
import { initialize, renderPage } from "./renderers/renderer";
import { ScrapperError } from "./types/internal";
import { downloadFileAsBuffer } from "./util/file_manager";

export const isPdfUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return pathname.endsWith(".pdf") || pathname.includes(".pdf?");
  } catch {
    return false;
  }
};

const processHtmlUrl = async (url: string): Promise<string> => {
  let browser: Browser | null = null;
  try {
    browser = await initialize();

    const renderResult = await renderPage(browser, url, {
      timeout: PAGE_LOAD_TIMEOUT,
      waitUntil: ["domcontentloaded"],
      frames: {
        enabled: false,
        timeout: FRAME_TIMEOUT,
      },
    });

    let htmlContent: string;
    if (typeof renderResult === "string") {
      htmlContent = renderResult;
    } else {
      htmlContent = renderResult.mainContent;
    }

    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new ScrapperError("ERR_MARKDOWN_CONTENT_EXTRACTION_FAILED", "No HTML content extracted from URL");
    }

    const markdown = cleanHtmlToMarkdown(htmlContent, {
      runJS: false,
      baseUrl: url,
    });

    if (!markdown || markdown.trim().length === 0) {
      throw new ScrapperError(
        "ERR_MARKDOWN_CONVERSION_FAILED",
        "HTML to markdown conversion resulted in empty content",
      );
    }

    return markdown;
  } catch (error) {
    if (error instanceof ScrapperError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("TimeoutError") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("exceeded")
    ) {
      throw new ScrapperError("ERR_HTTP_TIMEOUT", `Request timeout: ${errorMessage}`);
    }

    throw new ScrapperError("ERR_HTTP_REQUEST_FAILED", `Failed to process HTML URL: ${errorMessage}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const processPdfUrl = async (url: string): Promise<string> => {
  try {
    const pdfBuffer = await downloadFileAsBuffer(url);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new ScrapperError("ERR_HTTP_REQUEST_FAILED", "Failed to download PDF file or file is empty");
    }

    const markdown = await convertPdfToMarkdown(pdfBuffer);

    if (!markdown || markdown.trim().length === 0) {
      throw new ScrapperError("PDF_MARKDOWN_CONVERSION_FAILED", "PDF to markdown conversion resulted in empty content");
    }

    return markdown;
  } catch (error) {
    if (error instanceof ScrapperError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ScrapperError("ERR_HTTP_REQUEST_FAILED", `Failed to process PDF URL: ${errorMessage}`);
  }
};

export const convertLinkToMarkdown = async (url: string): Promise<string> => {
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    throw new ScrapperError("INVALID_INPUT", "URL is required and must be a non-empty string");
  }

  try {
    new URL(url);
  } catch {
    throw new ScrapperError("ERR_HTTP_INVALID_URL", `Invalid URL format: ${url}`);
  }

  if (isPdfUrl(url)) {
    return await processPdfUrl(url);
  } else {
    return await processHtmlUrl(url);
  }
};
