import { describe, expect, it, test } from "bun:test";
import { checkProtocol, extractDownloadLinksFromHtml, extractLinks } from "./link_extraction";

test("extracts no links from empty text", () => {
  const result = extractLinks("");
  expect(result).toEqual([]);
});

test("extracts no links from text without URLs", () => {
  const result = extractLinks("This is plain text without any links");
  expect(result).toEqual([]);
});

test("extracts single HTTP link", () => {
  const result = extractLinks("Visit https://example.com");
  expect(result).toEqual([{ url: "https://example.com/", type: "PAGE" }]);
});

test("extracts single FTP link", () => {
  const result = extractLinks("Download via ftp://files.example.com");
  expect(result).toEqual([{ url: "ftp://files.example.com/", type: "PAGE" }]);
});

test("extracts single FILE link", () => {
  const result = extractLinks("Open file://files.example.com//documents/report.pdf");
  expect(result).toEqual([{ url: "file://files.example.com//documents/report.pdf", type: "PDF" }]);
});

test("extracts PDF link with .pdf extension", () => {
  const result = extractLinks("PDF: https://example.com/doc.pdf");
  expect(result).toEqual([{ url: "https://example.com/doc.pdf", type: "PDF" }]);
});

test("extracts PDF link with .PDF uppercase extension", () => {
  const result = extractLinks("PDF: https://example.com/doc.PDF");
  expect(result).toEqual([{ url: "https://example.com/doc.PDF", type: "PDF" }]);
});

test("identifies page link even with pdf in path", () => {
  const result = extractLinks("Not PDF: https://example.com/pdf-docs");
  expect(result).toEqual([{ url: "https://example.com/pdf-docs", type: "PAGE" }]);
});

test("extracts multiple links of different types", () => {
  const text = `
    Home: https://example.com
    Docs: ftp://docs.example.com
    Report: https://example.com/final.pdf
  `;
  const result = extractLinks(text);
  expect(result).toEqual([
    { url: "https://example.com/", type: "PAGE" },
    { url: "ftp://docs.example.com/", type: "PAGE" },
    { url: "https://example.com/final.pdf", type: "PDF" },
  ]);
});

test("skips invalid URLs", () => {
  const result = extractLinks("Invalid: http://:invalid and https://.");
  expect(result).toEqual([]);
});

test("handles URLs with special characters", () => {
  const result = extractLinks("Check https://example.com/path?query=param#fragment");
  expect(result).toEqual([{ url: "https://example.com/path?query=param#fragment", type: "PAGE" }]);
});

test("handles URLs in parentheses", () => {
  const result = extractLinks("(https://parenthesized.com)");
  expect(result).toEqual([{ url: "https://parenthesized.com/", type: "PAGE" }]);
});

describe("checkProtocol", () => {
  it("should return true for valid protocols", () => {
    expect(checkProtocol("http:")).toBe(true);
    expect(checkProtocol("https:")).toBe(true);
    expect(checkProtocol("ftp:")).toBe(true);
    expect(checkProtocol("file:")).toBe(true);
  });

  it("should return false for protocols missing the colon", () => {
    expect(checkProtocol("http")).toBe(false);
    expect(checkProtocol("https")).toBe(false);
    expect(checkProtocol("ftp")).toBe(false);
    expect(checkProtocol("file")).toBe(false);
  });

  it("should return false for unsupported protocols", () => {
    expect(checkProtocol("mailto:")).toBe(false);
    expect(checkProtocol("javascript:")).toBe(false);
    expect(checkProtocol("data:")).toBe(false);
    expect(checkProtocol("custom:")).toBe(false);
  });
});

describe("scrapeDownloadLinksFromPage", () => {
  test("should extract PDF links from HTML content", async () => {
    const htmlContent = `
      <html>
        <body>
          <a href="http://example.com/document1.pdf">Document 1</a>
          <a href="https://example.com/document2.PDF">Document 2</a>
          <a href="http://example.com/image.png">Image</a>
          <a href="https://example.com/document3.pdf?query=param">Document 3 with query</a>
          <a href="http://example.com/document4.pdf#fragment">Document 4 with fragment</a>
        </body>
      </html>
    `;
    const links = await extractDownloadLinksFromHtml(htmlContent);
    expect(links).toEqual([
      "http://example.com/document1.pdf",
      "https://example.com/document2.PDF",
      "https://example.com/document3.pdf?query=param",
      "http://example.com/document4.pdf#fragment",
    ]);
  });

  test("should return an empty array if no PDF links are found", async () => {
    const htmlContent = `
      <html>
        <body>
          <a href="http://example.com/image.png">Image</a>
          <a href="https://example.com/document.doc">Word Document</a>
        </body>
      </html>
    `;
    const links = await extractDownloadLinksFromHtml(htmlContent);
    expect(links).toEqual([]);
  });

  test("should return an empty array for empty HTML content", async () => {
    const htmlContent = "";
    const links = await extractDownloadLinksFromHtml(htmlContent);
    expect(links).toEqual([]);
  });

  test("should handle HTML with no anchor tags", async () => {
    const htmlContent = `
      <html>
        <body>
          <p>No links here.</p>
        </body>
      </html>
    `;
    const links = await extractDownloadLinksFromHtml(htmlContent);
    expect(links).toEqual([]);
  });

  test("should ignore non-HTTP/HTTPS links", async () => {
    const htmlContent = `
      <html>
        <body>
          <a href="ftp://example.com/document.pdf">FTP Link</a>
          <a href="mailto:test@example.com">Mail Link</a>
          <a href="http://example.com/another.pdf">Valid Link</a>
        </body>
      </html>
    `;
    const links = await extractDownloadLinksFromHtml(htmlContent);
    expect(links).toEqual(["http://example.com/another.pdf"]);
  });

  test("should handle links with mixed case .pdf extension", async () => {
    const htmlContent = `
      <html>
        <body>
          <a href="http://example.com/document.PdF">Mixed Case PDF</a>
        </body>
      </html>
    `;
    const links = await extractDownloadLinksFromHtml(htmlContent);
    expect(links).toEqual(["http://example.com/document.PdF"]);
  });

  test("should handle malformed URLs gracefully", async () => {
    const htmlContent = `
      <html>
        <body>
          <a href="http://example com/invalid space.pdf">Invalid URL with space</a>
          <a href="http://example.com/valid.pdf">Valid PDF</a>
          <a href="notaurl.pdf">Not a URL</a>
        </body>
      </html>
    `;
    // JSDOM's URL parsing is quite robust and might resolve "notaurl.pdf" relative to a base if one were present.
    // However, our filter `link.startsWith("http")` will catch it.
    // For "http://example com/invalid space.pdf", the new URL() constructor will throw, and it will be filtered out.
    const links = await extractDownloadLinksFromHtml(htmlContent);
    expect(links).toEqual(["http://example.com/valid.pdf"]);
  });
});
