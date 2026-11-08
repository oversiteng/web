import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { createUploadUrl } from "@/lib/aws/s3";

export const runtime = "nodejs";

const handlePresign = withAuth(async (req: NextRequest, { user }) => {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawType = body.contentType || body.mimeType || body.type || body.content_type || body.mime_type;
    const ext = (body.fileExtension || body.ext || body.extension || body.file_extension || "").replace(/^\./, "") || "jpg";
    const contentType = (rawType && typeof rawType === "string" && rawType.startsWith("image/"))
      ? rawType
      : (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");

    const timestamp = Date.now();
    const objectKey = `profiles/${user.sub}-${timestamp}.${ext}`;

    const presignedData = await createUploadUrl(objectKey, contentType);
    const { url, publicUrl, bucket } = presignedData;

    const payload = {
      success: true,
      url,
      uploadUrl: url,
      upload_url: url,
      presignedUrl: url,
      presigned_url: url,
      publicUrl,
      public_url: publicUrl,
      avatarUrl: publicUrl,
      avatar_url: publicUrl,
      fileUrl: publicUrl,
      file_url: publicUrl,
      imageUrl: publicUrl,
      image_url: publicUrl,
      key: objectKey,
      objectKey,
      object_key: objectKey,
      bucket,
      expiresIn: 300,
      data: {
        url,
        uploadUrl: url,
        upload_url: url,
        presignedUrl: url,
        presigned_url: url,
        publicUrl,
        public_url: publicUrl,
        avatarUrl: publicUrl,
        avatar_url: publicUrl,
        fileUrl: publicUrl,
        file_url: publicUrl,
        imageUrl: publicUrl,
        image_url: publicUrl,
        key: objectKey,
        objectKey,
        object_key: objectKey,
        bucket,
        expiresIn: 300,
      },
    };

    return NextResponse.json(payload, { status: 200 });
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

export const POST = handlePresign;
export const PUT = handlePresign;
