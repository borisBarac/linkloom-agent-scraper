import { JSDOM } from "jsdom";

const LinkType = {
  Pdf: "PDF",
  Page: "PAGE",
} as const;

export type LinkType = (typeof LinkType)[keyof typeof LinkType];

export type LinkInfo = {
  url: string;
  type: LinkType;
};

const normalizeUrl = (url: URL): string => {
  // Create a new URL to avoid modifying the original
  const normalized = new URL(url.toString());

  // Sort query parameters for deterministic comparison
  const sortedParams = new URLSearchParams();
  const params = Array.from(normalized.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of params) {
    sortedParams.append(key, value);
  }

  normalized.search = sortedParams.toString();
  return normalized.toString();
};

export const extractLinks = (text: string): LinkInfo[] => {
  const urlRegex = /(https?|ftp|file):\/\/[^\s]+/g;
  const links: LinkInfo[] = [];
  const seen = new Set<string>();
  // biome-ignore lint: false positive
  let match;

  // biome-ignore lint: false positive
  while ((match = urlRegex.exec(text)) !== null) {
    let urlString = match[0];

    // Remove trailing non-URL characters (like punctuation)
    urlString = urlString.replace(/[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/, "");
    // trim whitespaces, brackets, and parentheses
    urlString = urlString.trim().replace(/^[[(]+|[\])]+$/g, "");

    try {
      const urlOb = new URL(urlString);
      if (!checkProtocol(urlOb.protocol) || !checkHostname(urlOb.hostname)) {
        continue;
      }

      const normalizedUrl = normalizeUrl(urlOb);
      if (seen.has(normalizedUrl)) {
        continue;
      }
      seen.add(normalizedUrl);
      const isPdf = normalizedUrl.toLowerCase().endsWith(".pdf");
      links.push({
        url: normalizedUrl,
        type: isPdf ? LinkType.Pdf : LinkType.Page,
      });
    } catch {}
  }

  return links;
};

export function checkProtocol(protocol: string): boolean {
  return protocol.match(/^(https?|ftp|file):$/i) !== null;
}

export function checkHostname(name: string): boolean {
  if (name.length > 253) {
    return false;
  }

  // Check if the hostname contains at least one letter
  if (!/[a-zA-Z]/.test(name)) {
    return false;
  }

  // Basic check for valid characters and structure
  // Allows letters, digits, hyphens, and dots. Hyphens not at start/end of labels.
  const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
  if (!hostnameRegex.test(name)) {
    return false;
  }

  return true;
}

export const extractDownloadLinksFromHtml = async (htmlContent: string): Promise<string[]> => {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  const refs = document.querySelectorAll("a");
  const uniqueLinks = new Set<string>();

  // Process links directly into the Set
  Array.from(refs).forEach((a: any) => {
    const link = a.href;
    if (link.startsWith("http") || link.startsWith("https")) {
      try {
        const url = new URL(link);
        if (url.pathname.toLowerCase().endsWith(".pdf")) {
          const normalizedUrl = normalizeUrl(url);
          uniqueLinks.add(normalizedUrl);
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  });

  return Array.from(uniqueLinks);
};
