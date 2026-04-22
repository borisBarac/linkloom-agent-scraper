import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { existsSync, writeFileSync } from "node:fs";
import { utimes } from "node:fs/promises";
import { join } from "node:path";
import { TEMP_DIR_PATH } from "../../app_config";
import { cleanTempDir, saveToTempDir } from "./file_manager";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock timers
const DateMock = mock(() => Date.now());
const originalDateNow = Date.now;

beforeEach(() => {
  // Clear temp directory before each test
  if (existsSync(TEMP_DIR_PATH)) {
    writeFileSync(join(TEMP_DIR_PATH, "testfile.txt"), "test");
  }
});

afterEach(() => {
  Date.now = originalDateNow;
});

test("saveToTempDir should save file", () => {
  const testData = "test content";
  const fileName = "testfile.txt";

  const filePath = saveToTempDir(testData, fileName);
  expect(filePath).toEndWith(fileName);
  expect(existsSync(filePath)).toBe(true);
});

test("cleanTempDir should remove old files", async () => {
  // Create test files
  const oldFile = join(TEMP_DIR_PATH, "oldfile.txt");
  const newFile = join(TEMP_DIR_PATH, "newfile.txt");

  // Create old file with explicit old mtime

  await Bun.write(oldFile, "old content");
  const newAccessTime = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const newModificationTime = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

  // Change the times using async utimes
  await utimes(oldFile, newAccessTime, newModificationTime);

  // Create new file with current time
  await Bun.write(newFile, "new content");

  await cleanTempDir(7); // Remove files older than 7 days
  await sleep(200); // Wait for the file system to catch up
  expect(existsSync(oldFile)).toBe(false);
  expect(existsSync(newFile)).toBe(true);
});

test("cleanTempDir should keep recent files", () => {
  const recentFile = join(TEMP_DIR_PATH, "recent.txt");
  writeFileSync(recentFile, "recent content");

  // Mock date: 6 days in future
  DateMock.mockReturnValue(Date.now() + 6 * 24 * 60 * 60 * 1000);

  cleanTempDir(7);
  expect(existsSync(recentFile)).toBe(true);
});
