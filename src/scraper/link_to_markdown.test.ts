import { describe, expect, it } from "bun:test";
import { convertLinkToMarkdown, isPdfUrl } from "./link_to_markdown";
import { ScrapperError } from "./types/internal";

describe("convertLinkToMarkdown", () => {
  describe("URL validation", () => {
    it("should throw error for empty URL", async () => {
      expect(convertLinkToMarkdown("")).rejects.toThrow(ScrapperError);
      expect(convertLinkToMarkdown("   ")).rejects.toThrow(ScrapperError);
    });

    it("should throw error for invalid URL format", async () => {
      expect(convertLinkToMarkdown("not-a-url")).rejects.toThrow(ScrapperError);
      expect(convertLinkToMarkdown("ftp://invalid")).rejects.toThrow(ScrapperError);
    });

    it("should throw error for null/undefined input", async () => {
      expect(convertLinkToMarkdown(null as any)).rejects.toThrow(ScrapperError);
      expect(convertLinkToMarkdown(undefined as any)).rejects.toThrow(ScrapperError);
    });
  });

  describe("PDF URL detection", () => {
    it("should detect PDF URLs correctly", () => {
      const pdfUrls = [
        "https://example.com/document.pdf",
        "https://example.com/path/to/file.PDF",
        "http://test.org/research.pdf",
        "https://example.com/file.pdf?download=true",
      ];

      pdfUrls.forEach((url) => {
        expect(isPdfUrl(url)).toBe(true);
      });
    });

    it("should detect non-PDF URLs correctly", () => {
      const nonPdfUrls = [
        "https://example.com/page.html",
        "https://example.com/article",
        "http://test.org/research.docx",
        "https://example.com/file.pdfx",
      ];

      nonPdfUrls.forEach((url) => {
        expect(isPdfUrl(url)).toBe(false);
      });
    });

    it("should handle invalid URLs gracefully", () => {
      const invalidUrls = ["not-a-url", "", null, undefined];

      invalidUrls.forEach((url) => {
        expect(isPdfUrl(url as any)).toBe(false);
      });
    });
  });

  describe("Error handling", () => {
    it("should handle 404 errors gracefully", async () => {
      const notFoundUrl = "https://httpbin.org/status/404";

      expect(convertLinkToMarkdown(notFoundUrl)).rejects.toThrow(ScrapperError);
    }, 15_000);
  });

  describe("HTML processing", () => {
    it("should process simple HTML pages", async () => {
      const testUrl = "https://httpbin.org/html";

      const result = await convertLinkToMarkdown(testUrl);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toContain("<html>");
      expect(result).not.toContain("</html>");
    });

    it("should handle pages with JavaScript content", async () => {
      const testUrl = "https://httpbin.org/";

      const result = await convertLinkToMarkdown(testUrl);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    }, 15_000);
  });

  describe("PDF processing", () => {
    it("should process PDF files when available", async () => {
      const pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

      try {
        const result = await convertLinkToMarkdown(pdfUrl);

        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      } catch (error) {
        if (error instanceof ScrapperError) {
          expect(error.code).toBeOneOf(["ERR_HTTP_REQUEST_FAILED", "PDF_MARKDOWN_CONVERSION_FAILED"]);
        } else {
          throw error;
        }
      }
    });
  });
});
