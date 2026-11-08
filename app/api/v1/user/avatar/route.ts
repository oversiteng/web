import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { uploadBufferToS3 } from "@/lib/aws/s3";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];

const handleAvatarUpload = withAuth(async (req: NextRequest, { user }) => {
  try {
    const formData = await req.formData();
    const file = (formData.get("avatar") || formData.get("file") || formData.get("image") || formData.get("photo") || formData.get("picture")) as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided in form data" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image file exceeds the 10MB limit" },
        { status: 400 }
      );
    }

    const contentType = file.type || "image/jpeg";
    if (!ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, WEBP, and GIF images are supported" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || contentType.split("/")[1] || "jpg";
    const timestamp = Date.now();
    const objectKey = `profiles/${user.sub}-${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Direct server-side upload to AWS S3 (eu-west-2)
    const { publicUrl } = await uploadBufferToS3(buffer, objectKey, contentType);

    // Update user avatar in the database
    const db = await getDbReady();
    await db
      .update(users)
      .set({
        avatarUrl: publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.sub));

    const resData = {
      avatarUrl: publicUrl,
      avatar_url: publicUrl,
      publicUrl,
      public_url: publicUrl,
      url: publicUrl,
      imageUrl: publicUrl,
      image_url: publicUrl,
      objectKey,
      object_key: objectKey,
    };

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      ...resData,
      data: resData,
    });
  } catch (error: any) {
    console.error("Server-side avatar upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to upload avatar to AWS S3",
      },
      { status: 500 }
    );
  }
});

export const POST = handleAvatarUpload;
export const PUT = handleAvatarUpload;
