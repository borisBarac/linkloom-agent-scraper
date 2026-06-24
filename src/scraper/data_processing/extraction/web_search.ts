import * as cheerio from "cheerio";
import { Impit } from "impit";

export type SearchEngine = "brave";

export type SearchResult = {
  title: string;
  url: string;
  description: string;
  source: string;
  engine: SearchEngine;
};

export type SearchWebInput = {
  query: string;
  limit?: number;
  engine?: SearchEngine;
};

const DEFAULT_LIMIT = 10;
const BRAVE_PAGE_SIZE = 20;
const BRAVE_SEARCH_URL = "https://search.brave.com/search";

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const resolveUrl = (href: string, baseUrl: string): string | null => {
  try {
    const url = new URL(href, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
};

const pickText = ($: ReturnType<typeof cheerio.load>, selectors: string[]) => {
  for (const selector of selectors) {
    const node = $(selector).first();
    if (!node.length) {
      continue;
    }

    const text = normalizeWhitespace(node.text());
    if (text.length > 0) {
      return text;
    }
  }

  return "";
};

const pickAnchor = (
  $: ReturnType<typeof cheerio.load>,
  selectors: string[],
): { href: string; text: string } | null => {
  for (const selector of selectors) {
    const node = $(selector).first();
    if (!node.length) {
      continue;
    }

    const href = node.attr("href") ?? node.find("a[href]").first().attr("href");
    const text = normalizeWhitespace(node.text());

    if (href && text.length > 0) {
      return { href, text };
    }
  }

  const fallback = $("a[href]").first();
  if (!fallback.length) {
    return null;
  }

  const href = fallback.attr("href");
  const text = normalizeWhitespace(fallback.text());
  if (!href || text.length === 0) {
    return null;
  }

  return { href, text };
};

const collectResultFragments = (pageHtml: string): string[] => {
  const $ = cheerio.load(pageHtml);
  const fragments = new Set<string>();
  const selectors = ["#results .snippet", "#results .result-content"];

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const fragmentHtml = $.html(element);
      if (fragmentHtml) {
        fragments.add(fragmentHtml);
      }
    });
  }

  if (fragments.size === 0) {
    $("#results a[href]").each((_, element) => {
      const fragmentHtml = $.html(element);
      if (fragmentHtml) {
        fragments.add(fragmentHtml);
      }
    });
  }

  if (fragments.size === 0) {
    $("a[href]").each((_, element) => {
      const fragmentHtml = $.html(element);
      if (fragmentHtml) {
        fragments.add(fragmentHtml);
      }
    });
  }

  return [...fragments];
};

const parseResultFragment = (
  fragmentHtml: string,
  baseUrl: string,
): SearchResult | null => {
  const $ = cheerio.load(fragmentHtml);
  const title = pickAnchor($, [
    ".search-snippet-title a[href]",
    ".search-snippet-title[href]",
    "a[href]",
  ]);

  if (!title) {
    return null;
  }

  const url = resolveUrl(title.href, baseUrl);
  if (!url) {
    return null;
  }

  const source =
    pickText($, [
      ".site-name-wrapper",
      ".site-name",
      "cite",
      ".result-source",
    ]) || new URL(url).hostname;

  return {
    title: title.text,
    url,
    description: pickText($, [
      ".generic-snippet",
      ".snippet-description",
      ".result-description",
      "p",
    ]),
    source,
    engine: "brave",
  };
};

export const parseBraveSearchResults = (
  pageHtml: string,
  baseUrl: string,
  limit = DEFAULT_LIMIT,
): SearchResult[] => {
  const maxResults = Number.isFinite(limit)
    ? Math.max(0, Math.floor(limit))
    : DEFAULT_LIMIT;
  if (maxResults <= 0) {
    return [];
  }

  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const fragmentHtml of collectResultFragments(pageHtml)) {
    if (results.length >= maxResults) {
      break;
    }

    const result = parseResultFragment(fragmentHtml, baseUrl);
    if (!result || seenUrls.has(result.url)) {
      continue;
    }

    seenUrls.add(result.url);
    results.push(result);
  }

  return results;
};

const buildBraveSearchUrl = (query: string, offset: number): string => {
  const url = new URL(BRAVE_SEARCH_URL);
  url.search = new URLSearchParams({
    q: query,
    source: "web",
    offset: String(offset),
  }).toString();
  return url.toString();
};

export const searchBrave = async (
  query: string,
  limit = DEFAULT_LIMIT,
): Promise<SearchResult[]> => {
  const maxResults = Number.isFinite(limit)
    ? Math.max(0, Math.floor(limit))
    : DEFAULT_LIMIT;
  if (!query.trim() || maxResults <= 0) {
    return [];
  }

  const impit = new Impit({ browser: "chrome" });
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (let offset = 0; results.length < maxResults; offset += BRAVE_PAGE_SIZE) {
    const searchUrl = buildBraveSearchUrl(query, offset);
    const response = await impit.fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Brave search failed with HTTP ${response.status}`);
    }

    const html = await response.text();
    const pageResults = parseBraveSearchResults(
      html,
      response.url || searchUrl,
      maxResults - results.length,
    );

    const beforeCount = results.length;
    for (const result of pageResults) {
      if (seenUrls.has(result.url)) {
        continue;
      }

      seenUrls.add(result.url);
      results.push(result);

      if (results.length >= maxResults) {
        break;
      }
    }

    if (results.length === beforeCount) {
      break;
    }
  }

  return results;
};

export const searchWeb = async (
  input: SearchWebInput,
): Promise<SearchResult[]> => {
  const engine = input.engine ?? "brave";
  const limit = input.limit ?? DEFAULT_LIMIT;

  if (engine !== "brave") {
    throw new Error(`Unsupported search engine: ${engine}`);
  }

  return await searchBrave(input.query, limit);
};
