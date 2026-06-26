import { tmpdir } from "node:os";
import { join } from "node:path";

const getEnvTimeout = (
  envVar: string | undefined,
  defaultValue: number,
): number => {
  const value = envVar ? parseInt(envVar, 10) : NaN;
  return Number.isNaN(value) ? defaultValue : value;
};

const getEnvDebugMode = (): boolean => {
  const linkloomDebug = Bun.env.LINKLOOM_DEBUG?.toLowerCase();
  const debug = Bun.env.DEBUG?.toLowerCase();
  const debugNamespaces = debug?.split(",").map((value) => value.trim()) ?? [];

  return (
    linkloomDebug === "1" ||
    linkloomDebug === "true" ||
    debug === "1" ||
    debug === "true" ||
    debugNamespaces.some(
      (namespace) =>
        namespace === "linkloom" || namespace.startsWith("linkloom:"),
    )
  );
};

export const config = {
  fileManager: {
    tempDirName: "research-crew-scraper",
  },
  timeouts: {
    pageLoad: getEnvTimeout(Bun.env.PAGE_LOAD_TIMEOUT, 10000),
    frame: getEnvTimeout(Bun.env.FRAME_TIMEOUT, 5000),
    pdfDownload: getEnvTimeout(Bun.env.PDF_DOWNLOAD_TIMEOUT, 30000),
  },
  debug: getEnvDebugMode(),
  proxyUrl: Bun.env.PROXY_URL || undefined,
} as const;

export const TEMP_DIR_PATH = join(tmpdir(), config.fileManager.tempDirName);
export const PAGE_LOAD_TIMEOUT = config.timeouts.pageLoad;
export const FRAME_TIMEOUT = config.timeouts.frame;
export const PDF_DOWNLOAD_TIMEOUT = config.timeouts.pdfDownload;
export const PROXY_URL = config.proxyUrl;
export const DEBUG_MODE = config.debug;
