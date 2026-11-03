import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getMediaBucket(): string {
  const bucket =
    process.env.AWS_S3_MEDIA_BUCKET ||
    process.env.AWS_S3_BUCKET ||
    process.env.S3_BUCKET_NAME ||
    process.env.S3_BUCKET;

  if (!bucket) {
    throw new Error(
      "AWS_S3_MEDIA_BUCKET is required. Please configure AWS_S3_MEDIA_BUCKET in your environment variables."
    );
  }
  return bucket;
}

function s3Client() {
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;

  return new S3Client({
    region,
    ...(accessKeyId && secretAccessKey
      ? {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }
      : {}),
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  });
}

export async function createUploadUrl(objectKey: string, contentType: string) {
  const bucket = getMediaBucket();
  const client = s3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 300 });
  const region = process.env.AWS_REGION || "us-east-1";
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;

  const publicUrl = endpoint
    ? `${endpoint.replace(/\/$/, "")}/${bucket}/${objectKey}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;

  return { url, publicUrl, bucket, objectKey, expiresIn: 300 };
}

export async function createDownloadUrl(objectKey: string) {
  const bucket = getMediaBucket();
  const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  return getSignedUrl(s3Client(), command, { expiresIn: 300 });
}
