import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

if (process.platform !== "darwin") {
  process.exit(0);
}

function camoufoxCli(args) {
  try {
    return execFileSync("camoufox-js", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }

    return execFileSync(process.execPath, ["x", "camoufox-js", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
  }
}

const camoufoxPath = camoufoxCli(["path"]).trim();

const appPath = join(camoufoxPath, "Camoufox.app");
const executablePath = join(appPath, "Contents", "MacOS", "camoufox");

if (!existsSync(executablePath)) {
  throw new Error(`Camoufox executable not found at ${executablePath}`);
}

execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], {
  stdio: "inherit",
});

execFileSync(executablePath, ["--version"], {
  stdio: "inherit",
});
