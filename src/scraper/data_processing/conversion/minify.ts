/**
 * Minifies HTML content by removing unnecessary whitespace, comments, and line breaks
 * while preserving the HTML structure and text content spacing
 */
export const minifyHTML = (html: string): string => {
  if (!html) return "";

  return (
    html
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Remove whitespace between tags
      .replace(/>\s+</g, "><")
      // Remove whitespace at the start and end
      .trim()
      // Collapse multiple spaces/newlines/tabs to single space in text content
      .replace(/(?<=>)([^<]+)(?=<)/g, (match) =>
        match.replace(/\s+/g, " ").trim(),
      )
  );
};
