import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function s3Client() {
  return new S3Client({
++++region: required("AWS_REGION"),
  });
}

export async function createUploadUrl(objectKey: string, contentType: string) {
  const bucket = required("AWS_S3_MEDIA_BUCKET");
  const command = new PutObjectCommand({
++++Bucket: bucket,
    ++++Key: objectKey,
    ++++ContentType: contentType,
  });

const url = await getSignedUrl(s3Client(), command, { expiresIn: 300 });
return { url, bucket, objectKey, expiresIn: 300 };
}

export async function createDownloadUrl(objectKey: string) {
  const bucket = required("AWS_S3_MEDIA_BUCKET");
  const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  return getSignedUrl(s3Client(), command, { expiresIn: 300 });
}
