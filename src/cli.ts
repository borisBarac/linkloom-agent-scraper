#!/usr/bin/env bun

import { defineCommand, runMain } from "citty";
import html from "./cli/commands/html";
import links from "./cli/commands/links";
import mcp from "./cli/commands/mcp";
import pdf from "./cli/commands/pdf";
import render from "./cli/commands/render";
import scrape from "./cli/commands/scrape";
import tables from "./cli/commands/tables";

const main = defineCommand({
  meta: {
    name: "@boris.barac/linkloom",
    description:
      "CLI for web scraping, content extraction, and markdown conversion",
    version: "1.0.0",
  },
  subCommands: {
    scrape,
    html,
    pdf,
    render,
    links,
    tables,
    mcp,
  },
});

runMain(main);
