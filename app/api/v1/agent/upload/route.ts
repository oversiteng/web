import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { uploadBufferToS3 } from "@/lib/aws/s3";
import { processAndCompressMedia } from "@/lib/middleware/mediaCompression";

export const runtime = "nodejs";

const handleAgentUpload = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const formData = await req.formData();
      const file = (formData.get("file") ||
        formData.get("image") ||
        formData.get("photo") ||
        formData.get("document") ||
        formData.get("avatar")) as File | null;

      const rawFolder = String(formData.get("folder") || "evidence")
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "");
      const folder = (rawFolder || "evidence") as "evidence" | "kyc" | "tax" | "avatar";

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided in form data" },
          { status: 400 }
        );
      }

      // Run Media Validation & Compression Middleware
      let compressed;
      try {
        compressed = await processAndCompressMedia(file, {
          category: folder,
          allowPdf: folder !== "avatar",
        });
      } catch (validationErr: any) {
        return NextResponse.json(
          { success: false, error: validationErr?.message || "Invalid media file" },
          { status: 400 }
        );
      }

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).slice(2, 7);
      const objectKey = `agent/${user.sub}/${folder}/${timestamp}-${randomSuffix}.${compressed.extension}`;

      // Direct server-side upload of compressed buffer to AWS S3
      const { publicUrl } = await uploadBufferToS3(
        compressed.buffer,
        objectKey,
        compressed.contentType
      );

      const resData = {
        url: publicUrl,
        publicUrl,
        public_url: publicUrl,
        imageUrl: publicUrl,
        image_url: publicUrl,
        fileUrl: publicUrl,
        file_url: publicUrl,
        objectKey,
        object_key: objectKey,
        contentType: compressed.contentType,
        fileName: file.name,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        wasCompressed: compressed.wasCompressed,
      };

      return NextResponse.json({
        success: true,
        message: "File compressed and uploaded successfully",
        ...resData,
        data: resData,
      });
    } catch (error: any) {
      console.error("Agent media upload error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "Failed to upload file to AWS S3",
        },
        { status: 500 }
      );
    }
  },
  { roles: ["AGENT", "USER", "ADMIN", "SUPER_ADMIN"] }
);

export const POST = handleAgentUpload;
export const PUT = handleAgentUpload;
