import { describe, expect, test } from "bun:test";
import { minifyHTML } from "./minify";

// filepath: src/processing/minify_test.ts

describe("minifyHTML", () => {
  test("should return empty string for empty input", () => {
    expect(minifyHTML("")).toEqual("");
  });

  test("should handle undefined/null input", () => {
    expect(minifyHTML(undefined as unknown as string)).toEqual("");
    expect(minifyHTML(null as unknown as string)).toEqual("");
  });

  test("should remove HTML comments", () => {
    const input = "<div><!-- this is a comment -->content</div>";
    const expected = "<div>content</div>";
    expect(minifyHTML(input)).toEqual(expected);
  });

  test("should remove whitespace between tags", () => {
    const input = "<div>    <p>    </p>    </div>";
    const expected = "<div><p></p></div>";
    expect(minifyHTML(input)).toEqual(expected);
  });

  test("should remove whitespace at line start and end", () => {
    const input = "  <div>content</div>  ";
    const expected = "<div>content</div>";
    expect(minifyHTML(input)).toEqual(expected);
  });

  test("should replace multiple spaces with single space in content", () => {
    const input = "<div>this    has    spaces</div>";
    const expected = "<div>this has spaces</div>";
    expect(minifyHTML(input)).toEqual(expected);
  });

  test("should remove line breaks", () => {
    const input = "<div>\ncontent\r\nhere\r</div>";
    const expected = "<div>content here</div>";
    expect(minifyHTML(input)).toEqual(expected);
  });

  test("should handle complex HTML with multiple features", () => {
    const input = `
      <div>
        <!-- comment -->
        <p>   Multiple    spaces   </p>
        <span>
          New lines
        </span>
      </div>
    `;
    const expected = "<div><p>Multiple spaces</p><span>New lines</span></div>";
    expect(minifyHTML(input)).toEqual(expected);
  });

  test("should preserve HTML structure and attributes", () => {
    const input = `
      <div class="test">
        <p data-test="value">  Content  </p>
      </div>
    `;
    const expected = '<div class="test"><p data-test="value">Content</p></div>';
    expect(minifyHTML(input)).toEqual(expected);
  });
});
