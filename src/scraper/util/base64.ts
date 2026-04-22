/**
 * Enum for supported MIME types.
 */
export const MimeType = {
  JPEG: "image/jpeg",
  PNG: "image/png",
} as const;

type MimeTypeType = (typeof MimeType)[keyof typeof MimeType];

/**
 * Converts an image buffer to a Base64-encoded string with the correct MIME type.
 * Verifies the buffer signature to ensure it matches the specified MIME type.
 * @param buffer - The image buffer to convert.
 * @param mimeType - The MIME type of the image (e.g., MimeType.JPEG, MimeType.PNG).
 * @returns An object containing the MIME type and Base64-encoded data URL string.
 */
export const convertImageBufferToBase64 = (
  buffer: Buffer,
  mimeType: MimeTypeType,
): { mimeType: MimeTypeType; base64String: string } => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Invalid buffer provided. Expected a Buffer object.");
  }

  const jpegSignature = Buffer.from([0xff, 0xd8]);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  if (mimeType === MimeType.JPEG && !buffer.subarray(0, 2).equals(jpegSignature)) {
    throw new Error("Buffer does not match JPEG signature.");
  }

  if (mimeType === MimeType.PNG && !buffer.subarray(0, 8).equals(pngSignature)) {
    throw new Error("Buffer does not match PNG signature.");
  }

  const base64String = buffer.toString("base64");
  return {
    mimeType,
    base64String,
  };
};
