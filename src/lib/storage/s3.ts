import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME || 'snowfall-attachments';
const region = process.env.AWS_REGION || 'auto';
const endpoint = process.env.S3_ENDPOINT || undefined; // e.g. https://<accountid>.r2.cloudflarestorage.com

let s3Client: S3Client | null = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  filename: string;
  mimeType: string;
}

/**
 * Generates a presigned PUT URL for direct browser-to-bucket uploads
 */
export async function generatePresignedUploadUrl(
  userId: string,
  filename: string,
  mimeType: string = 'application/pdf'
): Promise<PresignedUploadResult> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectKey = `users/${userId || 'guest'}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${safeFilename}`;

  if (!s3Client) {
    // Local dev mock URL if S3 is not configured
    return {
      uploadUrl: `/api/upload-resume?key=${encodeURIComponent(objectKey)}`,
      objectKey,
      filename: safeFilename,
      mimeType,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes

  return {
    uploadUrl,
    objectKey,
    filename: safeFilename,
    mimeType,
  };
}

/**
 * Generates a presigned GET URL for streaming attachments in Inngest SMTP workers
 */
export async function generatePresignedDownloadUrl(objectKey: string, expiresInSeconds: number = 3600): Promise<string | null> {
  if (!s3Client || !objectKey) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error('Error generating presigned download URL:', err);
    return null;
  }
}

/**
 * Deletes an object from S3 / R2
 */
export async function deleteS3Object(objectKey: string): Promise<boolean> {
  if (!s3Client || !objectKey) return false;

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );
    return true;
  } catch (err) {
    console.error('Error deleting S3 object:', err);
    return false;
  }
}
