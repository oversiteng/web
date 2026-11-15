import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { uploadBufferToS3 } from "@/lib/aws/s3";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/jpg",
  "image/heic",
  "image/heif",
  "application/pdf",
];

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
      const folder = rawFolder || "evidence";

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided in form data" },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "File exceeds the 10MB limit" },
          { status: 400 }
        );
      }

      const contentType = (file.type || "image/jpeg").toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return NextResponse.json(
          {
            success: false,
            error: "Only JPEG, PNG, WEBP, GIF, HEIC images or PDF files are supported",
          },
          { status: 400 }
        );
      }

      const ext =
        file.name.split(".").pop()?.toLowerCase() ||
        contentType.split("/")[1] ||
        "jpg";
      const timestamp = Date.now();
      const objectKey = `agent/${user.sub}/${folder}/${timestamp}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Direct server-side upload to AWS S3
      const { publicUrl } = await uploadBufferToS3(buffer, objectKey, contentType);

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
        contentType,
        fileName: file.name,
      };

      return NextResponse.json({
        success: true,
        message: "File uploaded successfully",
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

