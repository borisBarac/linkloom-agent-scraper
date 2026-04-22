import type { Browser, Frame, Page, PuppeteerLifeCycleEvent } from "puppeteer";
import puppeteer from "puppeteer-extra";

type FrameOptions = {
  enabled?: boolean;
  timeout?: number;
  waitForDynamic?: number;
  requiredSelector?: string;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
};

type RenderOptions = {
  timeout?: number;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
  viewport?: {
    width: number;
    height: number;
  };
  frames?: FrameOptions;
  html?: string;
  baseUrl?: string;
};

type FrameContent = {
  url: string;
  content: string;
  selector?: string;
};

type RenderResult = {
  mainContent: string;
  frames: FrameContent[];
  frameCount: number;
};

const waitForAllIframes = async (
  page: Page,
  options: FrameOptions = {},
): Promise<Frame[]> => {
  const {
    timeout = 20000,
    waitForDynamic = 2000,
    requiredSelector,
    waitUntil,
  } = options;

  const startTime = Date.now();
  const loadedFrames: Frame[] = [];

  const hasIframes = await page.evaluate(
    () => document.querySelectorAll("iframe").length > 0,
  );

  if (!hasIframes) {
    if (waitForDynamic > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitForDynamic));

      const hasIframesNow = await page.evaluate(
        () => document.querySelectorAll("iframe").length > 0,
      );

      if (!hasIframesNow) {
        return loadedFrames;
      }
    } else {
      return loadedFrames;
    }
  }

  const frames = page.frames().filter((f) => f !== page.mainFrame());

  for (const frame of frames) {
    const remainingTime = timeout - (Date.now() - startTime);

    if (remainingTime <= 0) {
      break;
    }

    try {
      if (waitUntil?.includes("domcontentloaded")) {
        await frame
          .waitForFunction(
            () =>
              document.readyState === "interactive" ||
              document.readyState === "complete",
            {
              timeout: Math.min(remainingTime, 5000),
            },
          )
          .catch(() => {});
      } else {
        await frame
          .waitForFunction(() => document.readyState === "complete", {
            timeout: Math.min(remainingTime, 5000),
          })
          .catch(() => {});
      }

      if (requiredSelector) {
        await frame.waitForSelector(requiredSelector, {
          visible: true,
          timeout: Math.min(remainingTime, 5000),
        });
      }

      loadedFrames.push(frame);
    } catch (_error) {
      // Continue processing other frames
    }
  }

  return loadedFrames;
};

export const initialize = async (): Promise<Browser> => {
  const browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      // https://stackoverflow.com/questions/57463616/disable-dev-shm-usage-does-not-resolve-the-chrome-crash-issue-in-docker
      "--disable-dev-shm-usage", // we need this one for docker
    ],
  });
  return browserInstance;
};

export const renderPage = async (
  browserInstance: Browser,
  url: string,
  options: RenderOptions = {},
): Promise<RenderResult | string> => {
  const page = await browserInstance.newPage();
  const frameOptions = options.frames ?? {};

  try {
    if (options.viewport) {
      await page.setViewport(options.viewport);
    }

    const response = await page.goto(url, {
      timeout: options.timeout ?? 30000,
      waitUntil: options.waitUntil ?? ["domcontentloaded", "networkidle0"],
    });

    if (!response) {
      throw new Error("No response received");
    }

    const status = response.status();
    if (status >= 400) {
      throw new Error(`HTTP ${status}: ${response.statusText()}`);
    }

    if (!frameOptions.enabled) {
      return await page.content();
    }

    const frames = await waitForAllIframes(page, {
      ...frameOptions,
      waitUntil: options.waitUntil,
    });
    const frameContents: FrameContent[] = [];

    for (const frame of frames) {
      try {
        const content = await frame.content();
        frameContents.push({
          url: frame.url() || "about:blank",
          content,
          selector: frameOptions.requiredSelector,
        });
      } catch (_error) {
        // Skip frames that can't be accessed
      }
    }

    return {
      mainContent: await page.content(),
      frames: frameContents,
      frameCount: frameContents.length,
    };
  } finally {
    await page.close();
  }
};
