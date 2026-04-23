import { defineCommand } from "citty";

export default defineCommand({
  meta: {
    name: "mcp",
    description: "Start the LinkLoom MCP server (stdio transport)",
  },
  async run() {
    await import("../../mcp");
  },
});
