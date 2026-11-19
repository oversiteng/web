import sharp from "sharp";

/**
 * Streamlined Media Upload & Compression Policy Constants
 * - MAX_RAW_UPLOAD_BYTES (10 MB): Maximum raw file accepted from camera/device before compression
 * - MAX_DOCUMENT_BYTES (5 MB): Maximum final size for PDFs and compressed KYC/evidence documents
 * - MAX_AVATAR_BYTES (2 MB): Maximum final size for profile avatars and passport photos
 */
export const MAX_RAW_UPLOAD_MB = 10;
export const MAX_RAW_UPLOAD_BYTES = MAX_RAW_UPLOAD_MB * 1024 * 1024; // 10 MB

export const MAX_DOCUMENT_MB = 5;
export const MAX_DOCUMENT_BYTES = MAX_DOCUMENT_MB * 1024 * 1024; // 5 MB

export const MAX_AVATAR_MB = 2;
export const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024; // 2 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export const ALLOWED_MEDIA_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  "application/pdf",
];

export interface CompressedMediaResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

export interface MediaCompressionOptions {
  category?: "avatar" | "kyc" | "evidence" | "tax";
  allowPdf?: boolean;
}

/**
 * Server-side Media Validation & Compression Middleware utility.
 * - Validates MIME type and streamlined size limits
 * - Auto-rotates based on EXIF orientation
 * - Resizes oversized camera photos while preserving document legibility
 * - Compresses images using MozJPEG / WebP via sharp
 */
export async function processAndCompressMedia(
  file: File,
  options: MediaCompressionOptions = {}
): Promise<CompressedMediaResult> {
  const { category = "kyc", allowPdf = true } = options;
  const contentType = (file.type || "image/jpeg").toLowerCase();
  const originalSize = file.size;

  // 1. Validate MIME type
  const allowedList = allowPdf ? ALLOWED_MEDIA_MIME_TYPES : ALLOWED_IMAGE_MIME_TYPES;
  if (!allowedList.includes(contentType)) {
    throw new Error(
      allowPdf
        ? "Unsupported file format. Only JPEG, PNG, WEBP, HEIC images or PDF documents are allowed."
        : "Unsupported image format. Only JPEG, PNG, WEBP, or GIF images are allowed."
    );
  }

  // 2. Validate raw incoming size ceiling
  if (originalSize > MAX_RAW_UPLOAD_BYTES) {
    throw new Error(`File size (${(originalSize / (1024 * 1024)).toFixed(1)}MB) exceeds the ${MAX_RAW_UPLOAD_MB}MB maximum upload limit.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  // 3. Handle PDF documents (enforce strict 5MB document limit)
  if (contentType === "application/pdf") {
    if (originalSize > MAX_DOCUMENT_BYTES) {
      throw new Error(`PDF document exceeds the ${MAX_DOCUMENT_MB}MB maximum limit.`);
    }
    return {
      buffer: rawBuffer,
      contentType: "application/pdf",
      extension: "pdf",
      originalSize,
      compressedSize: rawBuffer.length,
      wasCompressed: false,
    };
  }

  // 4. Compress & optimize image via sharp
  const isAvatar = category === "avatar";
  const maxDimension = isAvatar ? 800 : 1920;
  const targetMaxBytes = isAvatar ? MAX_AVATAR_BYTES : MAX_DOCUMENT_BYTES;

  try {
    let quality = isAvatar ? 80 : 82;
    let compressedBuffer = await sharp(rawBuffer)
      .rotate() // Auto-orient from EXIF
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true, progressive: true })
      .toBuffer();

    // Step down quality if still above target threshold
    if (compressedBuffer.length > targetMaxBytes && quality > 65) {
      quality = 68;
      compressedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true, progressive: true })
        .toBuffer();
    }

    return {
      buffer: compressedBuffer,
      contentType: "image/jpeg",
      extension: "jpg",
      originalSize,
      compressedSize: compressedBuffer.length,
      wasCompressed: true,
    };
  } catch (err) {
    // Graceful fallback if raw image buffer cannot be re-encoded by sharp
    if (rawBuffer.length > targetMaxBytes) {
      throw new Error(
        `Image exceeds the ${isAvatar ? MAX_AVATAR_MB : MAX_DOCUMENT_MB}MB limit and could not be compressed.`
      );
    }
    const fallbackExt =
      file.name.split(".").pop()?.toLowerCase() ||
      contentType.split("/")[1] ||
      "jpg";
    return {
      buffer: rawBuffer,
      contentType,
      extension: fallbackExt,
      originalSize,
      compressedSize: rawBuffer.length,
      wasCompressed: false,
    };
  }
}
