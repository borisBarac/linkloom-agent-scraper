import type { PDFExtractResult } from "pdf.js-extract";
import { PDFExtract } from "pdf.js-extract";
import { ScrapperError } from "../../types/internal";

const pdfExtract = new PDFExtract();

type PdfElement = {
  type: "heading" | "paragraph" | "list" | "table" | "code";
  content: string;
  level?: number;
  items?: string[];
  rows?: string[][];
};

type TextItem = {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName?: string;
  fontSize?: number;
};

export const convertPdfToText = async (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    pdfExtract.extractBuffer(
      buffer,
      {},
      (err: Error | null, data?: PDFExtractResult) => {
        if (err) return reject(err);
        if (!data) return reject(new Error("No data extracted"));

        const fullText = data.pages
          .map((page) => page.content.map((item) => item.str).join(" "))
          .join("\n\n");
        resolve(fullText);
      },
    );
  });
};

const analyzePdfStructure = (extractedData: PDFExtractResult): PdfElement[] => {
  const elements: PdfElement[] = [];

  for (const page of extractedData.pages) {
    const textItems = page.content as TextItem[];
    const lines = groupTextIntoLines(textItems);

    for (const line of lines) {
      const element = analyzeLine(line);
      if (element) {
        elements.push(element);
      }
    }
  }

  return elements;
};

const groupTextIntoLines = (items: TextItem[]): TextItem[][] => {
  if (items.length === 0) return [];

  const lines: TextItem[][] = [];
  const tolerance = 5;
  const firstItem = items[0];
  if (!firstItem) return [];

  let currentLine: TextItem[] = [firstItem];
  let currentY = firstItem.y;

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    if (Math.abs(item.y - currentY) <= tolerance) {
      currentLine.push(item);
    } else {
      lines.push(currentLine.sort((a, b) => a.x - b.x));
      currentLine = [item];
      currentY = item.y;
    }
  }

  lines.push(currentLine.sort((a, b) => a.x - b.x));
  return lines;
};

const analyzeLine = (line: TextItem[]): PdfElement | null => {
  if (line.length === 0) return null;

  const text = line
    .map((item) => item.str)
    .join(" ")
    .trim();
  if (!text) return null;

  const firstItem = line[0];
  if (!firstItem) return null;

  const fontSize = firstItem.fontSize || 12;
  const isBold = firstItem.fontName?.includes("Bold") || false;
  const isAllCaps = text === text.toUpperCase() && text.length > 3;
  const isMonospace = firstItem.fontName?.includes("Courier") || false;

  if (isMonospace && text.includes("\n")) {
    return {
      type: "code",
      content: text,
    };
  }

  if (isList(text)) {
    return {
      type: "list",
      content: text,
      items: [text],
    };
  }

  if ((fontSize >= 16 || isBold || isAllCaps) && text.length < 100) {
    let level = 1;
    if (fontSize >= 24) level = 1;
    else if (fontSize >= 20) level = 2;
    else if (fontSize >= 16) level = 3;
    else level = 4;

    return {
      type: "heading",
      content: text,
      level,
    };
  }

  return {
    type: "paragraph",
    content: text,
  };
};

const isList = (text: string): boolean => {
  const listPatterns = [
    /^[\u2022\u2023\u25E6\u2043\u2219]\s/, // bullet points
    /^[-*+]\s/, // dash/asterisk/plus
    /^\d+\.\s/, // numbered lists
    /^\([a-zA-Z]\)\s/, // lettered lists in parentheses
    /^[a-zA-Z]\.\s/, // lettered lists
  ];

  return listPatterns.some((pattern) => pattern.test(text.trim()));
};

const elementsToMarkdown = (elements: PdfElement[]): string => {
  return elements
    .map((element) => {
      switch (element.type) {
        case "heading":
          return `${"#".repeat(element.level || 1)} ${element.content}`;

        case "list":
          return element.content;

        case "code":
          if (element.content.includes("\n")) {
            return `\`\`\`\n${element.content}\n\`\`\``;
          }
          return `\`${element.content}\``;
        default:
          return element.content;
      }
    })
    .join("\n\n");
};

export const convertPdfToMarkdown = async (buffer: Buffer): Promise<string> => {
  try {
    const pdfData = await new Promise<PDFExtractResult>((resolve, reject) => {
      pdfExtract.extractBuffer(
        buffer,
        {},
        (err: Error | null, data?: PDFExtractResult) => {
          if (err) return reject(err);
          if (!data) return reject(new Error("No data extracted"));
          resolve(data);
        },
      );
    });

    const structuredElements = analyzePdfStructure(pdfData);
    const markdown = elementsToMarkdown(structuredElements);

    if (!markdown || markdown.trim().length === 0) {
      throw new ScrapperError(
        "PDF_MARKDOWN_CONVERSION_FAILED",
        "PDF conversion resulted in empty markdown",
      );
    }

    return markdown;
  } catch (error) {
    if (error instanceof ScrapperError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ScrapperError(
      "PDF_MARKDOWN_CONVERSION_FAILED",
      `Failed to convert PDF to markdown: ${errorMessage}`,
    );
  }
};
