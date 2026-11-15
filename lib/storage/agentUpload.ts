"use client";

import { getStoredToken } from "./clientStorage";

export interface UploadedAgentMedia {
  url: string;
  previewUrl: string;
  objectKey?: string;
  fileName: string;
  contentType: string;
  storedOnServer: boolean;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

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
  options: { allowPdf?: boolean } = {}
): string | null {
  const isImage = file.type.startsWith("image/");
  const isPdf = options.allowPdf && file.type === "application/pdf";

  if (!isImage && !isPdf) {
    return options.allowPdf
      ? "Please select a valid image (JPG, PNG, WEBP) or PDF file."
      : "Please select a valid image file (JPG, PNG, WEBP, GIF).";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "File size must be less than 10MB.";
  }

  return null;
}

/**
 * Uploads an image or document for the agent workflow modeled on the user avatar S3 pipeline:
 * 1) Direct multipart upload to /api/v1/agent/upload
 * 2) Presigned S3 URL fallback via /api/v1/agent/upload/presign
 * 3) Graceful local Data URL preview fallback when running without live AWS credentials
 */
export async function uploadAgentMedia(
  file: File,
  folder: "evidence" | "kyc" | "tax" | "avatar" = "evidence"
): Promise<UploadedAgentMedia> {
  const previewUrl = await readFileAsDataUrl(file);
  const token = await getStoredToken();

  // 1. Direct server-side upload to S3
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
  };
}

