import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { createUploadUrl } from "@/lib/aws/s3";

export const runtime = "nodejs";

const handleAgentPresign = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }

      const rawFolder = String(body.folder || "evidence")
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "");
      const folder = rawFolder || "evidence";

      const rawType =
        body.contentType ||
        body.mimeType ||
        body.type ||
        body.content_type ||
        body.mime_type;
      const ext =
        (
          body.fileExtension ||
          body.ext ||
          body.extension ||
          body.file_extension ||
          ""
        ).replace(/^\./, "") || "jpg";

      const contentType =
        rawType &&
        typeof rawType === "string" &&
        (rawType.startsWith("image/") || rawType === "application/pdf")
          ? rawType
          : ext === "png"
          ? "image/png"
          : ext === "webp"
          ? "image/webp"
          : ext === "pdf"
          ? "application/pdf"
          : "image/jpeg";

      const timestamp = Date.now();
      const objectKey = `agent/${user.sub}/${folder}/${timestamp}.${ext}`;

      const presignedData = await createUploadUrl(objectKey, contentType);
      const { url, publicUrl, bucket } = presignedData;

      const resData = {
        url,
        uploadUrl: url,
        upload_url: url,
        presignedUrl: url,
        presigned_url: url,
        publicUrl,
        public_url: publicUrl,
        fileUrl: publicUrl,
        file_url: publicUrl,
        imageUrl: publicUrl,
        image_url: publicUrl,
        key: objectKey,
        objectKey,
        object_key: objectKey,
        bucket,
        expiresIn: 300,
      };

      return NextResponse.json(
        {
          success: true,
          ...resData,
          data: resData,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Agent upload presign error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "Failed to generate upload URL",
        },
        { status: 500 }
      );
    }
  },
  { roles: ["AGENT", "USER", "ADMIN", "SUPER_ADMIN"] }
);

export const POST = handleAgentPresign;
export const PUT = handleAgentPresign;

