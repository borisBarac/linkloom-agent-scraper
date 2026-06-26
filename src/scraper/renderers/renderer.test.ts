import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import type { Browser, Page, Response } from "playwright";
import {
  closeBrowserQuietly,
  closePageQuietly,
  initialize,
  renderPage,
  withBrowser,
} from "./renderer";

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
    const result = await renderPage(
      browserInstance as Browser,
      "https://pptr.dev",
    );

    expect(typeof result).toBe("string");
    expect(result).toContain("<!DOCTYPE html>");
  }, 15_000);

  test("should render page with frames enabled", async () => {
    const result = await renderPage(
      browserInstance as Browser,
      "https://pptr.dev",
      { frames: { enabled: true } },
    );

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
    const result = await renderPage(
      browserInstance as Browser,
      "https://pptr.dev",
    );

    if (typeof result === "string") {
      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("<html");
    } else {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
      expect(result.mainContent).toContain("<html");
    }
  });

  test("should handle custom viewport", async () => {
    const result = await renderPage(
      browserInstance as Browser,
      "https://pptr.dev",
      {
        viewport: { width: 1920, height: 1080 },
      },
    );

    if (typeof result === "string") {
      expect(result).toContain("<!DOCTYPE html>");
    } else {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
    }
  });

  test("should validate viewport dimensions", async () => {
    const result = await renderPage(
      browserInstance as Browser,
      "https://pptr.dev",
      {
        viewport: { width: 1920, height: 1080 },
      },
    );

    if (typeof result === "string") {
      expect(result).toContain("<!DOCTYPE html>");
      expect(result.length).toBeGreaterThan(0);
    } else {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
      expect(result.mainContent.length).toBeGreaterThan(0);
    }
  });

  test("should render page with domcontentloaded", async () => {
    const result = await renderPage(
      browserInstance as Browser,
      "https://pptr.dev",
      {
        waitUntil: "domcontentloaded",
        frames: { enabled: true, waitUntil: "domcontentloaded" },
      },
    );

    expect(typeof result).toBe("object");
    if (typeof result === "object") {
      expect(result.mainContent).toContain("<!DOCTYPE html>");
      expect(result.frameCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.frames)).toBe(true);
    }
  });
});

describe("Renderer lifecycle helpers", () => {
  test("should ignore page close failures", async () => {
    const page = {
      close: mock().mockRejectedValue(new Error("close failed")),
    } as unknown as Page;

    await expect(closePageQuietly(page)).resolves.toBeUndefined();
    expect(page.close).toHaveBeenCalledTimes(1);
  });

  test("should ignore browser close failures", async () => {
    const browser = {
      close: mock().mockRejectedValue(new Error("close failed")),
    } as unknown as Browser;

    await expect(closeBrowserQuietly(browser)).resolves.toBeUndefined();
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  test("should close page after successful render without masking result", async () => {
    const mockPage = {
      goto: mock().mockResolvedValue({
        status: () => 200,
        statusText: () => "OK",
      } as unknown as Response),
      content: mock().mockResolvedValue("<!DOCTYPE html><html></html>"),
      close: mock().mockRejectedValue(new Error("close failed")),
    } as unknown as Page;
    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    const result = await renderPage(mockBrowser, "https://example.com");

    expect(result).toBe("<!DOCTYPE html><html></html>");
    expect(mockPage.close).toHaveBeenCalledTimes(1);
  });

  test("should preserve render error when page cleanup also fails", async () => {
    const mockPage = {
      goto: mock().mockRejectedValue(new Error("navigation failed")),
      close: mock().mockRejectedValue(new Error("close failed")),
    } as unknown as Page;
    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    await expect(
      renderPage(mockBrowser, "https://example.com"),
    ).rejects.toThrow("navigation failed");
    expect(mockPage.close).toHaveBeenCalledTimes(1);
  });

  test("should allow local file navigations without a network response", async () => {
    const mockPage = {
      goto: mock().mockResolvedValue(null),
      content: mock().mockResolvedValue("<!DOCTYPE html><html></html>"),
      close: mock().mockResolvedValue(undefined),
    } as unknown as Page;
    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    const result = await renderPage(mockBrowser, "file:///tmp/page.html");

    expect(result).toBe("<!DOCTYPE html><html></html>");
    expect(mockPage.close).toHaveBeenCalledTimes(1);
  });

  test("should reject HTTP navigations without a network response", async () => {
    const mockPage = {
      goto: mock().mockResolvedValue(null),
      close: mock().mockResolvedValue(undefined),
    } as unknown as Page;
    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    await expect(
      renderPage(mockBrowser, "https://example.com"),
    ).rejects.toThrow("No response received");
    expect(mockPage.close).toHaveBeenCalledTimes(1);
  });

  test("should close browser after callback failure", async () => {
    let callbackBrowser: Browser | undefined;

    await expect(
      withBrowser(async (browser) => {
        callbackBrowser = browser;
        throw new Error("callback failed");
      }),
    ).rejects.toThrow("callback failed");

    expect(callbackBrowser?.isConnected()).toBe(false);
  });
});
