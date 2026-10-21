import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
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
  const bucket = required("AWS_S3_MEDIA_BUCKET");
  const client = s3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 300 });
  const region = process.env.AWS_REGION || "us-east-1";
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;

  // Compute public/persistent read URL
  const publicUrl = endpoint
    ? `${endpoint.replace(/\/$/, "")}/${bucket}/${objectKey}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;

  return { url, publicUrl, bucket, objectKey, expiresIn: 300 };
}

export async function createDownloadUrl(objectKey: string) {
  const bucket = required("AWS_S3_MEDIA_BUCKET");
  const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  return getSignedUrl(s3Client(), command, { expiresIn: 300 });
}
