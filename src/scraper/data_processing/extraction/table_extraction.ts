import type { Browser, Page } from "playwright";

export type TableData = { [header: string]: string };

export const extractTableDataFromPage = async (
  page: Page,
  tableSelector: string,
): Promise<TableData[]> => {
  return await page.evaluate((selector: string) => {
    const tableElements = document.querySelectorAll(selector);
    if (!tableElements.length) {
      return [];
    }

    const allCombinedRows: TableData[] = [];

    tableElements.forEach((tableElement: Element) => {
      const headers = Array.from(tableElement.querySelectorAll("th")).map(
        (header: Element) => header.textContent?.trim() ?? "",
      );
      const rows = Array.from(tableElement.querySelectorAll("tbody tr"));

      rows.forEach((row: Element) => {
        const cells = Array.from(row.querySelectorAll("td"));
        const rowData: TableData = {};
        if (headers.length > 0) {
          headers.forEach((header: string, index: number) => {
            const safeHeader =
              typeof header === "string"
                ? header.replace(/[^a-zA-Z0-9 _-]/g, "")
                : `col${index}`;
            rowData[safeHeader] = cells[index]?.textContent?.trim() ?? "";
          });
        }
        allCombinedRows.push(rowData);
      });
    });

    return allCombinedRows;
  }, tableSelector);
};

export const extractTableData = async (
  browser: Browser,
  url: string,
  tableSelector: string,
): Promise<TableData[]> => {
  let page: Page | undefined;
  try {
    page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    return extractTableDataFromPage(page, tableSelector);
  } finally {
    if (page && typeof page.close === "function") {
      await page.close();
    }
  }
};

/**
 * Converts an array of TableData objects to a Markdown table string.
 *
 * @param data - An array of TableData objects.
 * @returns A string representing the data as a Markdown table.
 */
export const tableDataToMarkdownTable = (data: TableData[]): string => {
  if (!data || data.length === 0) {
    return "No data to display.";
  }

  const headers = Object.keys(data[0] as TableData);

  const headerRow = `| ${headers.join(" | ")} |`;

  // Adjust separator row for cases with no headers
  const separatorRow =
    headers.length > 0
      ? `| ${headers.map(() => "---").join(" | ")} |`
      : "| --- |";

  const dataRows = data
    .map((row) => {
      // If headers array is empty (e.g. data is [{}]), map over it produces empty rowValues.
      // This correctly results in "|  |" for each data row.
      const rowValues = headers.map((header) => row[header] || "");
      return `| ${rowValues.join(" | ")} |`;
    })
    .join("\n");

  return `${headerRow}\n${separatorRow}\n${dataRows}`;
};
