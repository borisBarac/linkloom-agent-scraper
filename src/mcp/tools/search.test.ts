import { expect, mock, test } from "bun:test";

const mockedResults = [
  {
    title: "OpenAI",
    url: "https://openai.com",
    description: "AI research and deployment company.",
    source: "openai.com",
    engine: "brave" as const,
  },
];

const searchWebMock = mock(async () => mockedResults);

mock.module("../../scraper/data_processing/extraction/web_search", () => ({
  searchWeb: searchWebMock,
}));

const { registerSearchTool } = await import("./search");

test("registerSearchTool returns JSON search results", async () => {
  let registeredTool:
    | {
        name: string;
        config: { title: string; description: string };
        handler: (args: { query: string; limit?: number; engine?: "brave" }) => Promise<unknown>;
      }
    | undefined;

  const server = {
    registerTool: mock((name, config, handler) => {
      registeredTool = { name, config, handler };
    }),
  };

  registerSearchTool(server as never);

  expect(registeredTool?.name).toBe("search_web");
  expect(registeredTool?.config.title).toBe("Web Search");
  expect(registeredTool?.config.description).toContain("Brave");

  const result = await registeredTool?.handler({
    query: "openai",
    limit: 1,
    engine: "brave",
  });

  expect(searchWebMock).toHaveBeenCalledWith({
    query: "openai",
    limit: 1,
    engine: "brave",
  });
  expect(result).toEqual({
    content: [{ type: "text", text: JSON.stringify(mockedResults, null, 2) }],
  });
});
