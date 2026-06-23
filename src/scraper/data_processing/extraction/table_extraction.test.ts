import { describe, expect, mock, test } from "bun:test";
import type { Browser, Page } from "playwright";
import {
  extractTableData,
  extractTableDataFromPage,
  type TableData,
  tableDataToMarkdownTable,
} from "./table_extraction";

describe("tableDataToMarkdownTable", () => {
  test("should return 'No data to display.' for empty array", () => {
    expect(tableDataToMarkdownTable([])).toBe("No data to display.");
  });

  test("should return 'No data to display.' for undefined input", () => {
    // @ts-expect-error testing undefined input
    expect(tableDataToMarkdownTable(undefined)).toBe("No data to display.");
  });

  test("should return 'No data to display.' for null input", () => {
    // @ts-expect-error testing null input
    expect(tableDataToMarkdownTable(null)).toBe("No data to display.");
  });

  test("should convert single row with headers to markdown table", () => {
    const data: TableData[] = [{ Name: "Alice", Age: "30" }];
    const expected = "| Name | Age |\n| --- | --- |\n| Alice | 30 |";
    expect(tableDataToMarkdownTable(data)).toBe(expected);
  });

  test("should convert multiple rows to markdown table", () => {
    const data: TableData[] = [
      { Name: "Alice", Age: "30", City: "NYC" },
      { Name: "Bob", Age: "25", City: "LA" },
      { Name: "Charlie", Age: "35", City: "Chicago" },
    ];
    const expected =
      "| Name | Age | City |\n| --- | --- | --- |\n| Alice | 30 | NYC |\n| Bob | 25 | LA |\n| Charlie | 35 | Chicago |";
    expect(tableDataToMarkdownTable(data)).toBe(expected);
  });

  test("should handle missing values with empty strings", () => {
    const data: TableData[] = [
      { Name: "Alice", Age: "30" },
      { Name: "Bob" }, // Age missing
    ];
    const expected =
      "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob |  |";
    expect(tableDataToMarkdownTable(data)).toBe(expected);
  });

  test("should handle empty string values", () => {
    const data: TableData[] = [
      { Name: "", Age: "30" },
      { Name: "Bob", Age: "" },
    ];
    const expected = "| Name | Age |\n| --- | --- |\n|  | 30 |\n| Bob |  |";
    expect(tableDataToMarkdownTable(data)).toBe(expected);
  });

  test("should handle data with no headers (empty objects)", () => {
    const data: TableData[] = [{}, {}];
    const expected = "|  |\n| --- |\n|  |\n|  |";
    expect(tableDataToMarkdownTable(data)).toBe(expected);
  });

  test("should use headers from first object even if subsequent objects have additional keys", () => {
    const data: TableData[] = [
      { Name: "Alice", Age: "30" },
      { Name: "Bob", Age: "25", Extra: "value" }, // Extra key ignored
    ];
    const expected =
      "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |";
    expect(tableDataToMarkdownTable(data)).toBe(expected);
  });
});

describe("extractTableDataFromPage", () => {
  test("should extract table data with headers and rows", async () => {
    const mockTableData: TableData[] = [
      { Name: "Alice", Age: "30" },
      { Name: "Bob", Age: "25" },
    ];

    const mockPage = {
      evaluate: mock().mockResolvedValue(mockTableData),
    } as unknown as Page;

    const result = await extractTableDataFromPage(mockPage, "#testTable");

    expect(mockPage.evaluate).toHaveBeenCalledWith(
      expect.any(Function),
      "#testTable",
    );
    expect(result).toEqual(mockTableData);
  });

  test("should return empty array when no tables found", async () => {
    const mockPage = {
      evaluate: mock().mockResolvedValue([]),
    } as unknown as Page;

    const result = await extractTableDataFromPage(mockPage, "#nonexistent");

    expect(mockPage.evaluate).toHaveBeenCalledWith(
      expect.any(Function),
      "#nonexistent",
    );
    expect(result).toEqual([]);
  });

  test("should handle table without headers", async () => {
    const mockTableData: TableData[] = [{}, {}]; // No headers, just empty objects

    const mockPage = {
      evaluate: mock().mockResolvedValue(mockTableData),
    } as unknown as Page;

    const result = await extractTableDataFromPage(mockPage, "table");

    expect(result).toEqual([{}, {}]);
  });

  test("should handle multiple tables with same selector", async () => {
    const mockCombinedData: TableData[] = [
      { Product: "Apple", Price: "1.00" },
      { Product: "Banana", Price: "0.50" },
      { Product: "Orange", Price: "0.75" },
    ];

    const mockPage = {
      evaluate: mock().mockResolvedValue(mockCombinedData),
    } as unknown as Page;

    const result = await extractTableDataFromPage(mockPage, ".data-table");

    expect(result).toEqual(mockCombinedData);
  });

  test("should handle page.evaluate errors", async () => {
    const mockPage = {
      evaluate: mock().mockRejectedValue(new Error("DOM evaluation failed")),
    } as unknown as Page;

    await expect(
      extractTableDataFromPage(mockPage, "#testTable"),
    ).rejects.toThrow("DOM evaluation failed");
  });

  test("should handle special characters in headers", async () => {
    const mockTableData: TableData[] = [
      { "Product Name": "Test Product", "Price $": "10.99" },
    ];

    const mockPage = {
      evaluate: mock().mockResolvedValue(mockTableData),
    } as unknown as Page;

    const result = await extractTableDataFromPage(mockPage, "#specialTable");

    expect(result).toEqual(mockTableData);
  });
});

describe("extractTableData", () => {
  test("should successfully extract table data from URL", async () => {
    const mockTableData: TableData[] = [
      { Header1: "Value1", Header2: "Value2" },
      { Header1: "Value3", Header2: "Value4" },
    ];

    const mockPage = {
      goto: mock().mockResolvedValue(undefined),
      close: mock().mockResolvedValue(undefined),
      evaluate: mock().mockResolvedValue(mockTableData),
    } as unknown as Page;

    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    const result = await extractTableData(
      mockBrowser,
      "https://example.com",
      "#data-table",
    );

    expect(mockBrowser.newPage).toHaveBeenCalledTimes(1);
    expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", {
      waitUntil: "networkidle",
    });
    expect(mockPage.evaluate).toHaveBeenCalledWith(
      expect.any(Function),
      "#data-table",
    );
    expect(mockPage.close).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockTableData);
  });

  test("should wait for table extraction before closing the page", async () => {
    const mockTableData: TableData[] = [{ Header: "Value" }];
    const events: string[] = [];

    const mockPage = {
      goto: mock().mockResolvedValue(undefined),
      close: mock(() => {
        events.push("close");
        return Promise.resolve();
      }),
      evaluate: mock(async () => {
        events.push("evaluate:start");
        await new Promise((resolve) => setTimeout(resolve, 1));
        events.push("evaluate:end");
        return mockTableData;
      }),
    } as unknown as Page;

    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    const result = await extractTableData(
      mockBrowser,
      "https://example.com",
      "#data-table",
    );

    expect(result).toEqual(mockTableData);
    expect(events).toEqual(["evaluate:start", "evaluate:end", "close"]);
  });

  test("should close page even if navigation fails", async () => {
    const mockPage = {
      goto: mock().mockRejectedValue(new Error("Navigation timeout")),
      close: mock().mockResolvedValue(undefined),
    } as unknown as Page;

    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    await expect(
      extractTableData(mockBrowser, "https://invalid-url.com", "table"),
    ).rejects.toThrow("Navigation timeout");

    expect(mockPage.close).toHaveBeenCalledTimes(1);
  });

  test("should close page even if extraction fails", async () => {
    const mockPage = {
      goto: mock().mockResolvedValue(undefined),
      close: mock().mockResolvedValue(undefined),
      evaluate: mock().mockRejectedValue(new Error("Extraction failed")),
    } as unknown as Page;

    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    await expect(
      extractTableData(mockBrowser, "https://example.com", "table"),
    ).rejects.toThrow("Extraction failed");

    expect(mockPage.close).toHaveBeenCalledTimes(1);
  });

  test("should handle browser.newPage failure", async () => {
    const mockBrowser = {
      newPage: mock().mockRejectedValue(new Error("Failed to create page")),
    } as unknown as Browser;

    await expect(
      extractTableData(mockBrowser, "https://example.com", "table"),
    ).rejects.toThrow("Failed to create page");
  });

  test("should handle page without close method gracefully", async () => {
    const mockTableData: TableData[] = [{ Test: "Data" }];

    const mockPageWithoutClose = {
      goto: mock().mockResolvedValue(undefined),
      evaluate: mock().mockResolvedValue(mockTableData),
      // Note: no close method
    } as unknown as Page;

    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPageWithoutClose),
    } as unknown as Browser;

    const result = await extractTableData(
      mockBrowser,
      "https://example.com",
      "table",
    );

    expect(result).toEqual(mockTableData);
    // Should not throw error when trying to close
  });

  test("should propagate page.close failure", async () => {
    const mockTableData: TableData[] = [{ Test: "Data" }];

    const mockPage = {
      goto: mock().mockResolvedValue(undefined),
      evaluate: mock().mockResolvedValue(mockTableData),
      close: mock().mockRejectedValue(new Error("Failed to close")),
    } as unknown as Page;

    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    // Should throw error when close fails since it's in finally block
    await expect(
      extractTableData(mockBrowser, "https://example.com", "table"),
    ).rejects.toThrow("Failed to close");
  });

  test("should return empty array when no tables found", async () => {
    const mockPage = {
      goto: mock().mockResolvedValue(undefined),
      close: mock().mockResolvedValue(undefined),
      evaluate: mock().mockResolvedValue([]),
    } as unknown as Page;

    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    const result = await extractTableData(
      mockBrowser,
      "https://example.com",
      "#nonexistent",
    );

    expect(result).toEqual([]);
    expect(mockPage.close).toHaveBeenCalledTimes(1);
  });

  test("should handle different wait strategies", async () => {
    const mockTableData: TableData[] = [{ Dynamic: "Content" }];

    const mockPage = {
      goto: mock().mockResolvedValue(undefined),
      close: mock().mockResolvedValue(undefined),
      evaluate: mock().mockResolvedValue(mockTableData),
    } as unknown as Page;

    const mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage),
    } as unknown as Browser;

    await extractTableData(mockBrowser, "https://spa-app.com", "table");

    expect(mockPage.goto).toHaveBeenCalledWith("https://spa-app.com", {
      waitUntil: "networkidle",
    });
  });
});
