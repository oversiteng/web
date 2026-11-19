import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { uploadBufferToS3 } from "@/lib/aws/s3";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processAndCompressMedia } from "@/lib/middleware/mediaCompression";

export const runtime = "nodejs";

const handleAvatarUpload = withAuth(async (req: NextRequest, { user }) => {
  try {
    const formData = await req.formData();
    const file = (formData.get("avatar") ||
      formData.get("file") ||
      formData.get("image") ||
      formData.get("photo") ||
      formData.get("picture")) as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided in form data" },
        { status: 400 }
      );
    }

    // Run Media Validation & Compression Middleware (strictly image-only, compressed to <= 2MB)
    let compressed;
    try {
      compressed = await processAndCompressMedia(file, {
        category: "avatar",
        allowPdf: false,
      });
    } catch (validationErr: any) {
      return NextResponse.json(
        { success: false, error: validationErr?.message || "Invalid avatar image" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const objectKey = `profiles/${user.sub}-${timestamp}.${compressed.extension}`;

    // Direct server-side upload to AWS S3
    const { publicUrl } = await uploadBufferToS3(
      compressed.buffer,
      objectKey,
      compressed.contentType
    );

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
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
      wasCompressed: compressed.wasCompressed,
    };

    return NextResponse.json({
      success: true,
      message: "Avatar compressed and uploaded successfully",
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
