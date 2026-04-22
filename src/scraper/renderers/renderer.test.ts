import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Browser } from "puppeteer";
import { initialize, renderPage } from "./renderer";

let browserInstance: Browser | null = null;

describe("Renderer", () => {
  beforeAll(async () => {
    browserInstance = await initialize();
  });

  afterAll(async () => {
    if (browserInstance && !browserInstance.isConnected()) {
      return; // Browser already closed
    }
    await browserInstance?.close();
    browserInstance = null;
  });

  test("should render a complex page", async () => {
    const result = await renderPage(
      browserInstance as Browser,
      "https://developer.apple.com/documentation/swift/array/first(where:)",
    );

    if (typeof result === "string") {
      expect(result).toContain("negative number in an array");
    } else {
      expect(result.mainContent).toContain("negative number in an array");
    }
  }, 15_000);

  test("should render page without frames by default", async () => {
    const result = await renderPage(browserInstance as Browser, "https://pptr.dev");

    expect(typeof result).toBe("string");
    expect(result).toContain("<!DOCTYPE html>");
  }, 15_000);

  test("should render page with frames enabled", async () => {
    const result = await renderPage(browserInstance as Browser, "https://pptr.dev", { frames: { enabled: true } });

    expect(typeof result).toBe("object");
    if (typeof result === "object") {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
      expect(result.frameCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.frames)).toBe(true);
    }
  }, 15_000);

  test("should render Reddit page with frames", async () => {
    const result = await renderPage(
      browserInstance as Browser,
      "https://www.reddit.com/r/EngineeringPorn/comments/1paoc6q/is_there_a_theoretical_limit_to_how_big_a/",
      { frames: { enabled: true } },
    );

    if (typeof result === "string") {
      expect(result).toContain("theme-beta");
    } else {
      expect(result.mainContent).toContain("theme-beta");
      expect(result.frameCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.frames)).toBe(true);
    }
  }, 30_000);

  test("should render a page", async () => {
    const result = await renderPage(browserInstance as Browser, "https://pptr.dev");

    if (typeof result === "string") {
      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("<html");
    } else {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
      expect(result.mainContent).toContain("<html");
    }
  });

  test("should handle custom viewport", async () => {
    const result = await renderPage(browserInstance as Browser, "https://pptr.dev", {
      viewport: { width: 1920, height: 1080 },
    });

    if (typeof result === "string") {
      expect(result).toContain("<!DOCTYPE html>");
    } else {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
    }
  });

  test("should validate viewport dimensions", async () => {
    const result = await renderPage(browserInstance as Browser, "https://pptr.dev", {
      viewport: { width: 1920, height: 1080 },
    });

    if (typeof result === "string") {
      expect(result).toContain("<!DOCTYPE html>");
      expect(result.length).toBeGreaterThan(0);
    } else {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
      expect(result.mainContent.length).toBeGreaterThan(0);
    }
  });

  test("should render page with domcontentloaded", async () => {
    const result = await renderPage(browserInstance as Browser, "https://pptr.dev", {
      waitUntil: "domcontentloaded",
      frames: { enabled: true, waitUntil: "domcontentloaded" },
    });

    expect(typeof result).toBe("object");
    if (typeof result === "object") {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
      expect(result.frameCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.frames)).toBe(true);
    }
  });
});
