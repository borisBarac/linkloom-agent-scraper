import { existsSync, mkdirSync } from "node:fs";
import fsPromises from "node:fs/promises";
import { join } from "node:path";
import axios from "axios";
import { PDF_DOWNLOAD_TIMEOUT, TEMP_DIR_PATH } from "../../app_config";

// Ensure temp directory exists
if (!existsSync(TEMP_DIR_PATH)) {
  mkdirSync(TEMP_DIR_PATH, { recursive: true });
}

export const saveToTempDir = (data: string | Buffer, filename: string): string => {
  const filePath = join(TEMP_DIR_PATH, filename);
  Bun.write(filePath, data);
  return filePath;
};

export const downloadFileAsBuffer = async (url: string): Promise<Buffer | undefined> => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer", // Crucial to get ArrayBuffer back
      timeout: PDF_DOWNLOAD_TIMEOUT,
    });

    // Axios's `response.data` will directly be the ArrayBuffer
    const arrayBuffer = response.data;
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Downloaded file from ${url} and converted to Buffer (using Axios).`);
    console.log(`Buffer size: ${buffer.length} bytes`);

    return buffer;
  } catch {
    // we do not really care if the download fails.
    // we should just log a instrumentation error to know if it a incident, or just shity website
    console.error(`Failed to download file from ${url} using Axios.`);
    return undefined;
  }
};

export const cleanTempDir = async (maxAgeDays: number): Promise<void> => {
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  const files = await fsPromises.readdir(TEMP_DIR_PATH);

  await Promise.all(
    files.map(async (file) => {
      const filePath = join(TEMP_DIR_PATH, file);
      const stats = await fsPromises.stat(filePath);
      // Calculate file age in days
      const fileAge = now - stats.mtimeMs;
      if (fileAge > maxAgeMs) {
        try {
          await fsPromises.unlink(filePath);
          console.log(`Deleted old file: ${filePath}`);
        } catch (error) {
          console.error(`Failed to delete file ${filePath}:`, error);
        }
      }
    }),
  );
};

export const saveImageBuffer = (buffer: Buffer | ArrayBuffer | Uint8Array, filePath: string): Promise<string> =>
  Bun.write(filePath, buffer).then(() => filePath);
