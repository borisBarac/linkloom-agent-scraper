import { expect, test } from "bun:test";
import { cleanHtmlToMarkdown } from "./html_converter";

// HTML to Markdown Tests
test("cleanHtmlToMarkdown - converts simple HTML to markdown", () => {
  const html = `
    <html>
      <body>
        <h1>Test Heading</h1>
        <p>Test paragraph with <strong>bold</strong> text.</p>
      </body>
    </html>
  `;
  const result = cleanHtmlToMarkdown(html);
  expect(result).toContain("# Test Heading");
  expect(result).toContain("Test paragraph with **bold** text.");
});

test("cleanHtmlToMarkdown - handles empty input", () => {
  expect(cleanHtmlToMarkdown("")).toBe("");
  expect(cleanHtmlToMarkdown("   ")).toBe("");
});

test("cleanHtmlToMarkdown - handles invalid HTML", () => {
  const html = "<p>Unclosed paragraph<strong>Bold</p>";
  expect(() => cleanHtmlToMarkdown(html)).not.toThrow();
});

test("cleanHtmlToMarkdown - handles JS rendering gracefully", () => {
  const html = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic List Rendering</title>
</head>
<body>

    <h1>A List of Fruits</h1>
    <div id="list-container">
        <p>Static content that should be extracted</p>
    </div>

    <script>
        // This script may not execute in test environment, but static content should still be extracted
        document.getElementById("list-container").innerHTML = "<p>Dynamic content</p>";
    </script>

</body>
</html>
  `;
  const result = cleanHtmlToMarkdown(html, { runJS: true });
  // Should extract the static content even if JS doesn't run
  expect(result).toContain("A List of Fruits");
  expect(result).toContain("Static content");
});
