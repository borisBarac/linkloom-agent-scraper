import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CLI_ENTRY = join(import.meta.dir, "..", "cli.ts");
const FIXTURES_DIR = join(import.meta.dir, "__e2e_fixtures__");

type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

function log(label: string, ...data: unknown[]) {
  console.log(`[e2e] ${label}`, ...data);
}

async function runCli(
  args: string[],
  options?: { stdin?: string },
): Promise<RunResult> {
  log(`running: linkloom ${args.join(" ")}`);

  const start = performance.now();
  const proc = Bun.spawn(["bun", "run", CLI_ENTRY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    stdin: options?.stdin !== undefined ? "pipe" : undefined,
  });

  if (options?.stdin !== undefined && proc.stdin) {
    proc.stdin.write(options.stdin);
    proc.stdin.end();
  }

  const [stdoutText, stderrText, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  const elapsed = (performance.now() - start).toFixed(0);
  log(`done in ${elapsed}ms (exit=${exitCode})`);

  if (exitCode !== 0) {
    log(`stderr:\n${stderrText.trimEnd()}`);
  }

  return { stdout: stdoutText, stderr: stderrText, exitCode };
}

const SIMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<body>
  <h1>Hello World</h1>
  <p>This is a <strong>test</strong> paragraph.</p>
  <ul>
    <li>Item one</li>
    <li>Item two</li>
  </ul>
</body>
</html>`;

const HTML_WITH_LINKS = `<!DOCTYPE html>
<html lang="en">
<body>
  <a href="https://example.com/report.pdf">Report</a>
  <a href="https://example.com/page.html">Page</a>
  <a href="https://example.com/data.pdf">Data</a>
</body>
</html>`;

const TEXT_WITH_URLS = `Check out https://example.com and https://example.org/docs.pdf for more info.`;

beforeAll(() => {
  log(`creating fixtures in ${FIXTURES_DIR}`);
  mkdirSync(FIXTURES_DIR, { recursive: true });
  writeFileSync(join(FIXTURES_DIR, "sample.html"), SIMPLE_HTML);
  writeFileSync(join(FIXTURES_DIR, "links.html"), HTML_WITH_LINKS);
  writeFileSync(join(FIXTURES_DIR, "urls.txt"), TEXT_WITH_URLS);
  log("fixtures ready");
});

afterAll(() => {
  rmSync(FIXTURES_DIR, { recursive: true, force: true });
  log("cleaned up fixtures");
});

describe("root command", () => {
  it("prints help with --help", async () => {
    const result = await runCli(["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("linkloom");
    expect(result.stdout).toContain("scrape");
    expect(result.stdout).toContain("html");
    expect(result.stdout).toContain("pdf");
    expect(result.stdout).toContain("render");
    expect(result.stdout).toContain("links");
    expect(result.stdout).toContain("tables");
    expect(result.stdout).toContain("mcp");
  });

  it("prints version with --version", async () => {
    const result = await runCli(["--version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("1.0.0");
  });
});

describe("subcommand help", () => {
  const commands = [
    "scrape",
    "html",
    "pdf",
    "render",
    "links",
    "tables",
    "mcp",
  ];

  for (const cmd of commands) {
    it(`${cmd} --help outputs description`, async () => {
      const result = await runCli([cmd, "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
    });
  }
});

describe("html command", () => {
  it("converts an HTML file to markdown", async () => {
    const result = await runCli(["html", join(FIXTURES_DIR, "sample.html")]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Hello World");
    expect(result.stdout).toContain("**test**");
    expect(result.stdout).toContain("Item one");
    expect(result.stdout).toContain("Item two");
  });

  it("writes output to a file with -o flag", async () => {
    const outputPath = join(FIXTURES_DIR, "output.md");
    const result = await runCli([
      "html",
      join(FIXTURES_DIR, "sample.html"),
      "-o",
      outputPath,
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Written to");

    const written = await Bun.file(outputPath).text();
    expect(written.length).toBeGreaterThan(0);
    expect(written).toContain("Hello World");
  });

  it("reads HTML from stdin when no file is provided", async () => {
    const result = await runCli(["html"], { stdin: SIMPLE_HTML });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Hello World");
    expect(result.stdout).toContain("**test**");
  });

  it("exits with code 1 for non-existent file", async () => {
    const result = await runCli(["html", "/nonexistent/path/file.html"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error");
  });
});

describe("links command", () => {
  it("extracts links from plain text input", async () => {
    const result = await runCli(["links", TEXT_WITH_URLS]);
    expect(result.exitCode).toBe(0);

    const parsed = JSON.parse(result.stdout);
    const urls = parsed.map((l: { url: string }) => l.url);
    expect(urls).toContain("https://example.com/");
    expect(urls).toContain("https://example.org/docs.pdf");

    const pdfEntry = parsed.find((l: { type: string }) => l.type === "PDF");
    expect(pdfEntry).toBeDefined();
    expect(pdfEntry.url).toBe("https://example.org/docs.pdf");
  });

  it("extracts PDF download links from HTML with --html flag", async () => {
    const result = await runCli(["links", HTML_WITH_LINKS, "--html"]);
    expect(result.exitCode).toBe(0);

    const parsed = JSON.parse(result.stdout);
    expect(parsed).toContain("https://example.com/report.pdf");
    expect(parsed).toContain("https://example.com/data.pdf");
    expect(parsed).not.toContain("https://example.com/page.html");
  });

  it("reads input from file with --file flag", async () => {
    const result = await runCli([
      "links",
      join(FIXTURES_DIR, "urls.txt"),
      "--file",
    ]);
    expect(result.exitCode).toBe(0);

    const parsed = JSON.parse(result.stdout);
    const urls = parsed.map((l: { url: string }) => l.url);
    expect(urls).toContain("https://example.com/");
  });

  it("reads HTML file with --file and --html flags combined", async () => {
    const result = await runCli([
      "links",
      join(FIXTURES_DIR, "links.html"),
      "--file",
      "--html",
    ]);
    expect(result.exitCode).toBe(0);

    const parsed = JSON.parse(result.stdout);
    expect(parsed).toContain("https://example.com/report.pdf");
    expect(parsed).toContain("https://example.com/data.pdf");
  });

  it("writes output to file with -o flag", async () => {
    const outputPath = join(FIXTURES_DIR, "links_out.json");
    const result = await runCli(["links", TEXT_WITH_URLS, "-o", outputPath]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Written to");

    const written = await Bun.file(outputPath).text();
    const parsed = JSON.parse(written);
    expect(parsed.length).toBeGreaterThan(0);
  });
});

describe("pdf command", () => {
  it("exits with code 1 for non-existent file", async () => {
    const result = await runCli(["pdf", "/nonexistent/path/file.pdf"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error");
  });

  it("requires a file argument", async () => {
    const result = await runCli(["pdf"]);
    expect(result.exitCode).toBeGreaterThan(0);
  });
});

describe("scrape command", () => {
  it("requires a URL argument", async () => {
    const result = await runCli(["scrape"]);
    expect(result.exitCode).toBeGreaterThan(0);
  });

  it("exits with code 1 for invalid URL", async () => {
    const result = await runCli(["scrape", "not-a-valid-url"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error");
  });
});

describe("render command", () => {
  it("requires a URL argument", async () => {
    const result = await runCli(["render"]);
    expect(result.exitCode).toBeGreaterThan(0);
  });
});

describe("tables command", () => {
  it("requires a URL argument", async () => {
    const result = await runCli(["tables"]);
    expect(result.exitCode).toBeGreaterThan(0);
  });
});
