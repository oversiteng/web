import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { createUploadUrl } from "@/lib/aws/s3";

export const runtime = "nodejs";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { contentType, fileExtension } = body as {
      contentType?: string;
      fileExtension?: string;
    };

    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "A valid image content type is required" },
        { status: 400 }
      );
    }

    const ext = fileExtension
      ? fileExtension.replace(/^\./, "")
      : contentType.split("/")[1] || "jpg";

    const timestamp = Date.now();
    const objectKey = `avatars/${user.sub}-${timestamp}.${ext}`;

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
