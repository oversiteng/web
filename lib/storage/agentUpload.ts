"use client";

import { getStoredToken } from "./clientStorage";

export interface UploadedAgentMedia {
  url: string;
  previewUrl: string;
  objectKey?: string;
  fileName: string;
  contentType: string;
  storedOnServer: boolean;
  originalSize?: number;
  compressedSize?: number;
}

// Streamlined Client-Side Upload Policy Constants
export const MAX_RAW_UPLOAD_MB = 10;
export const MAX_RAW_UPLOAD_BYTES = MAX_RAW_UPLOAD_MB * 1024 * 1024; // 10MB raw ceiling before compression
export const MAX_DOCUMENT_MB = 5;
export const MAX_DOCUMENT_BYTES = MAX_DOCUMENT_MB * 1024 * 1024; // 5MB max for PDFs / documents
export const MAX_AVATAR_MB = 2;
export const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024; // 2MB max for avatars / passport photos

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read selected file"));
    reader.readAsDataURL(file);
  });
}

export function validateAgentUploadFile(
  file: File,
  options: { allowPdf?: boolean; maxMb?: number } = {}
): string | null {
  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(file.name);
  const isPdf =
    options.allowPdf &&
    (file.type === "application/pdf" || /\.pdf$/i.test(file.name));

  if (!isImage && !isPdf) {
    return options.allowPdf
      ? "Please select a valid image (JPG, PNG, WEBP) or PDF document."
      : "Please select a valid image file (JPG, PNG, WEBP).";
  }

  if (isPdf && file.size > MAX_DOCUMENT_BYTES) {
    return `PDF document (${formatFileSize(file.size)}) exceeds the ${MAX_DOCUMENT_MB}MB maximum limit.`;
  }

  const maxAllowedBytes = options.maxMb
    ? options.maxMb * 1024 * 1024
    : MAX_RAW_UPLOAD_BYTES;

  if (file.size > maxAllowedBytes) {
    return `File size (${formatFileSize(file.size)}) exceeds the ${
      options.maxMb || MAX_RAW_UPLOAD_MB
    }MB maximum limit.`;
  }

  return null;
}

/**
 * Client-side Canvas Image Compression Utility.
 * Compresses large camera photos (up to 10MB) down to crisp, readable JPEGs (< 1MB)
 * before transmitting over the network. Leaves PDFs untouched.
 */
export async function compressClientImageFile(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  const isImage = file.type.startsWith("image/") && !/gif/i.test(file.type);
  if (!isImage || typeof window === "undefined") {
    return file;
  }

  const { maxDimension = 1920, quality = 0.82 } = options;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image decode failed"));
      el.src = dataUrl;
    });

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const cleanName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], cleanName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/**
 * Uploads an image or document for the agent workflow with automatic client + server compression:
 * 1) Client-side canvas compression for images
 * 2) Direct multipart upload to /api/v1/agent/upload (which runs server-side sharp compression middleware)
 * 3) Presigned S3 URL fallback via /api/v1/agent/upload/presign
 * 4) Graceful local Data URL preview fallback when running without live AWS credentials
 */
export async function uploadAgentMedia(
  rawFile: File,
  folder: "evidence" | "kyc" | "tax" | "avatar" = "evidence"
): Promise<UploadedAgentMedia> {
  const originalSize = rawFile.size;
  const file = await compressClientImageFile(rawFile, {
    maxDimension: folder === "avatar" ? 800 : 1920,
    quality: folder === "avatar" ? 0.8 : 0.82,
  });

  const previewUrl = await readFileAsDataUrl(file);
  const token = await getStoredToken();

  // 1. Direct server-side upload to S3 (with server compression middleware)
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const directHeaders: Record<string, string> = {};
    if (token) directHeaders["Authorization"] = `Bearer ${token}`;

    const directRes = await fetch("/api/v1/agent/upload", {
      method: "POST",
      credentials: "include",
      headers: directHeaders,
      body: formData,
    });

    if (directRes.ok) {
      const json = await directRes.json();
      const uploadedUrl = json?.data?.publicUrl || json?.publicUrl || json?.url;
      const objectKey = json?.data?.objectKey || json?.objectKey;
      if (uploadedUrl) {
        return {
          url: uploadedUrl,
          previewUrl,
          objectKey,
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          storedOnServer: true,
          originalSize,
          compressedSize: json?.data?.compressedSize || file.size,
        };
      }
    }
  } catch {
    // Fallback to presigned S3 upload below
  }

  // 2. Presigned S3 upload fallback
  try {
    const presignHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) presignHeaders["Authorization"] = `Bearer ${token}`;

    const presignRes = await fetch("/api/v1/agent/upload/presign", {
      method: "POST",
      credentials: "include",
      headers: presignHeaders,
      body: JSON.stringify({
        folder,
        contentType: file.type || "image/jpeg",
        fileExtension: file.name.split(".").pop() || "jpg",
      }),
    });

    if (presignRes.ok) {
      const { data } = await presignRes.json();
      if (data?.url && data?.publicUrl) {
        const putRes = await fetch(data.url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });
        if (putRes.ok) {
          return {
            url: data.publicUrl,
            previewUrl,
            objectKey: data.objectKey,
            fileName: file.name,
            contentType: file.type || "image/jpeg",
            storedOnServer: true,
            originalSize,
            compressedSize: file.size,
          };
        }
      }
    }
  } catch {
    // Fallback to local Data URL when AWS credentials are unavailable in dev
  }

  return {
    url: previewUrl,
    previewUrl,
    objectKey: `local/${folder}/${Date.now()}-${file.name}`,
    fileName: file.name,
    contentType: file.type || "image/jpeg",
    storedOnServer: false,
    originalSize,
    compressedSize: file.size,
  };
}
