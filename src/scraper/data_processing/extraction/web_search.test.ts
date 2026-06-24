import { describe, expect, it, test } from "bun:test";
import { parseBraveSearchResults, searchBrave } from "./web_search";

const BRAVE_RESULTS_HTML = `<!DOCTYPE html>
<html lang="en">
  <body>
    <main>
      <section id="results">
        <div class="snippet">
          <div class="result-content">
            <a class="search-snippet-title" href="/docs/search-alpha">
              Brave Alpha
            </a>
            <div class="generic-snippet">
              Alpha description from the fixture.
            </div>
            <div class="site-name-wrapper">
              alpha.example.com
            </div>
          </div>
        </div>
        <div class="snippet">
          <div class="result-content">
            <div class="search-snippet-title">
              <a href="https://beta.example.com/articles/bravo">
                Brave Bravo
              </a>
            </div>
            <div class="generic-snippet">
              Bravo description from the fixture.
            </div>
            <cite>beta.example.com</cite>
          </div>
        </div>
        <div class="snippet">
          <div class="result-content">
            <a href="https://gamma.example.com/direct">
              Brave Charlie
            </a>
            <div class="generic-snippet">
              Charlie description from the fixture.
            </div>
            <div class="site-name-wrapper">
              gamma.example.com
            </div>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;

test("parses Brave result cards into structured search results", () => {
  const results = parseBraveSearchResults(
    BRAVE_RESULTS_HTML,
    "https://search.brave.com/search?q=fixture",
    10,
  );

  expect(results).toEqual([
    {
      title: "Brave Alpha",
      url: "https://search.brave.com/docs/search-alpha",
      description: "Alpha description from the fixture.",
      source: "alpha.example.com",
      engine: "brave",
    },
    {
      title: "Brave Bravo",
      url: "https://beta.example.com/articles/bravo",
      description: "Bravo description from the fixture.",
      source: "beta.example.com",
      engine: "brave",
    },
    {
      title: "Brave Charlie",
      url: "https://gamma.example.com/direct",
      description: "Charlie description from the fixture.",
      source: "gamma.example.com",
      engine: "brave",
    },
  ]);
});

test("respects the requested result limit", () => {
  const results = parseBraveSearchResults(
    BRAVE_RESULTS_HTML,
    "https://search.brave.com/search?q=fixture",
    2,
  );

  expect(results).toHaveLength(2);
  expect(results[1]?.title).toBe("Brave Bravo");
});

test("returns an empty array when no results are present", () => {
  const results = parseBraveSearchResults(
    "<!DOCTYPE html><html><body><main><section id='results'></section></main></body></html>",
    "https://search.brave.com/search?q=fixture",
    10,
  );

  expect(results).toEqual([]);
});

const liveDescribe =
  Bun.env.LINKLOOM_LIVE_SEARCH_TEST === "1" ? describe : describe.skip;

liveDescribe("live Brave search", () => {
  it("returns real Brave results for a stable query", async () => {
    const results = await searchBrave("OpenAI", 3);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
    for (const result of results) {
      expect(result.engine).toBe("brave");
      expect(
        result.url.startsWith("http://") || result.url.startsWith("https://"),
      ).toBe(true);
    }
  }, 30000);
});
