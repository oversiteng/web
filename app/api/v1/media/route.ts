import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { withAuth } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION || "eu-west-2";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials missing in environment");
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    let key = searchParams.get("key") || searchParams.get("url") || "";

    // If a full S3 URL was passed, extract the object key
    if (key.includes(".amazonaws.com/")) {
      key = key.split(".amazonaws.com/")[1];
    }

    if (!key || key.includes("..")) {
      return NextResponse.json(
        { error: "Missing or invalid key parameter" },
        { status: 400 }
      );
    }

    const bucket =
      searchParams.get("bucket") ||
      process.env.AWS_S3_MEDIA_BUCKET ||
      "oversite-storage-bucket";

    const s3 = getS3Client();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const contentType = response.ContentType || "image/jpeg";
    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch media" },
      { status: 500 }
    );
  }
});
