import { initialize, renderPage } from "../scraper/renderers/renderer";

export async function renderUrlToHtml(
  url: string,
  options?: {
    timeout?: number;
    waitUntil?: "domcontentloaded" | "load" | "networkidle";
  },
): Promise<string> {
  const browser = await initialize();
  try {
    const result = await renderPage(browser, url, {
      timeout: options?.timeout ?? 10000,
      waitUntil: options?.waitUntil ?? "domcontentloaded",
      frames: { enabled: false },
    });

    if (typeof result === "string") {
      return result;
    }
    return result.mainContent;
  } finally {
    await browser.close();
  }
}
