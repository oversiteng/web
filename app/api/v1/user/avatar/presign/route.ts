import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { createUploadUrl } from "@/lib/aws/s3";

export const runtime = "nodejs";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const rawType = body.contentType || body.mimeType || body.type;
    const ext = (body.fileExtension || body.ext || "").replace(/^\./, "") || "jpg";
    const contentType = (rawType && typeof rawType === "string" && rawType.startsWith("image/"))
      ? rawType
      : (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");

    const timestamp = Date.now();
    const objectKey = `profiles/${user.sub}-${timestamp}.${ext}`;

    const presignedData = await createUploadUrl(objectKey, contentType);

    return NextResponse.json({
      success: true,
      data: presignedData,
    });
  } catch (error: any) {
    console.error("Avatar presign error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate upload URL",
      },
      { status: 500 }
    );
  }
});
