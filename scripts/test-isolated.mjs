#!/usr/bin/env bun

const TEST_ROOT = "src";
const TEST_SUFFIX = ".test.ts";

const formatDuration = (startedAt) => {
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < 1000) {
    return `${elapsedMs}ms`;
  }
  return `${(elapsedMs / 1000).toFixed(1)}s`;
};

const collectTestFiles = async (directory) => {
  const files = [];

  for await (const entry of new Bun.Glob("**/*.test.ts").scan({
    cwd: directory,
    onlyFiles: true,
  })) {
    files.push(`${directory}/${entry}`);
  }

  return files.sort();
};

const runTestFile = async (file) => {
  const proc = Bun.spawn(["bun", "test", file, "--max-concurrency=1"], {
    stdout: "inherit",
    stderr: "inherit",
  });

  return await proc.exited;
};

const main = async () => {
  const startedAt = Date.now();
  const files = await collectTestFiles(TEST_ROOT);

  if (files.length === 0) {
    console.log(`No ${TEST_SUFFIX} files found under ${TEST_ROOT}/`);
    return 0;
  }

  console.log(`Running ${files.length} test files in isolated Bun processes\n`);

  let passed = 0;

  for (const file of files) {
    const fileStartedAt = Date.now();
    console.log(`\n> ${file}`);

    const exitCode = await runTestFile(file);

    if (exitCode !== 0) {
      console.error(
        `\nFailed: ${file} exited with ${exitCode} after ${formatDuration(
          fileStartedAt,
        )}`,
      );
      console.error(
        `Summary: ${passed}/${files.length} files passed in ${formatDuration(
          startedAt,
        )}`,
      );
      return exitCode;
    }

    passed += 1;
    console.log(`OK ${file} passed in ${formatDuration(fileStartedAt)}`);
  }

  console.log(
    `\nSummary: ${passed}/${files.length} files passed in ${formatDuration(
      startedAt,
    )}`,
  );
  return 0;
};

process.exit(await main());
