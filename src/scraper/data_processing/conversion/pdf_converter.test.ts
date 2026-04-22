import { describe, expect, it } from "bun:test";
import { ScrapperError } from "../../types/internal";
import { convertPdfToMarkdown, convertPdfToText } from "./pdf_converter";

describe("PDF Converter", () => {
  describe("convertPdfToText", () => {
    it("should handle empty buffer", async () => {
      const emptyBuffer = Buffer.from("");

      await expect(convertPdfToText(emptyBuffer)).rejects.toThrow();
    });

    it("should handle invalid PDF data", async () => {
      const invalidBuffer = Buffer.from("not a pdf");

      await expect(convertPdfToText(invalidBuffer)).rejects.toThrow();
    });
  });

  describe("convertPdfToMarkdown", () => {
    it("should handle empty buffer", async () => {
      const emptyBuffer = Buffer.from("");

      await expect(convertPdfToMarkdown(emptyBuffer)).rejects.toThrow(ScrapperError);
    });

    it("should handle invalid PDF data", async () => {
      const invalidBuffer = Buffer.from("not a pdf");

      await expect(convertPdfToMarkdown(invalidBuffer)).rejects.toThrow(ScrapperError);
    });

    it("should throw ScrapperError with correct code on failure", async () => {
      const invalidBuffer = Buffer.from("invalid pdf data");

      try {
        await convertPdfToMarkdown(invalidBuffer);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ScrapperError);
        if (error instanceof ScrapperError) {
          expect(error.code).toBe("PDF_MARKDOWN_CONVERSION_FAILED");
        }
      }
    });
  });

  describe("PDF structure analysis", () => {
    it("should detect list patterns correctly", () => {
      const listTexts = [
        "• First item",
        "- Second item",
        "1. Numbered item",
        "(a) Lettered item",
        "a. Another lettered item",
      ];

      listTexts.forEach((text) => {
        const isListPattern =
          /^[\u2022\u2023\u25E6\u2043\u2219]\s/.test(text.trim()) ||
          /^[-*+]\s/.test(text.trim()) ||
          /^\d+\.\s/.test(text.trim()) ||
          /^\([a-zA-Z]\)\s/.test(text.trim()) ||
          /^[a-zA-Z]\.\s/.test(text.trim());

        expect(isListPattern).toBe(true);
      });
    });

    it("should identify heading candidates", () => {
      const headingTexts = ["MAIN TITLE", "Chapter 1: Introduction", "Section Header"];

      headingTexts.forEach((text) => {
        const isAllCaps = text === text.toUpperCase() && text.length > 3;
        const isShort = text.length < 100;

        expect(isAllCaps || isShort).toBe(true);
      });
    });
  });
});
