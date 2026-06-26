# Agents

Operational note for future Codex runs:

- Browser-backed verification in this repo depends on Camoufox.
- On macOS, run `bun run setup:browser` before verifying browser launch. It downloads the browser/GeoIP data and re-signs the Camoufox app bundle.
- If Camoufox aborts with `SIGABRT` inside the Codex macOS sandbox, rerun the browser-backed test outside the sandbox. The browser can launch successfully outside the sandbox after repair/re-sign.
- The MCP e2e suite (`src/mcp/mcp.e2e.test.ts`) was verified after the Camoufox repair step.
