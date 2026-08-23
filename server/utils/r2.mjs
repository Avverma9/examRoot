import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 — S3-compatible client
 *
 * Required env vars:
 *   R2_ACCOUNT_ID       — Cloudflare account ID
 *   R2_ACCESS_KEY_ID    — R2 API token Access Key ID
 *   R2_SECRET_ACCESS_KEY— R2 API token Secret Access Key
 *   R2_BUCKET_NAME      — bucket name (e.g. "examroot")
 *   R2_PUBLIC_URL       — public base URL (e.g. https://pub-xxx.r2.dev  OR custom domain)
 */

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = () => process.env.R2_BUCKET_NAME || "examroot";

function getPublicBaseUrl() {
  const raw = (process.env.R2_PUBLIC_URL || "").trim().replace(/\/$/, "");
  if (!raw) throw new Error("R2_PUBLIC_URL is missing. Use the bucket's public https://pub-<token>.r2.dev URL or a custom domain.");

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("R2_PUBLIC_URL is invalid. Use the bucket's public https://pub-<token>.r2.dev URL or a custom domain.");
  }

  const accountId = process.env.R2_ACCOUNT_ID || "";
  const bucketHost = `${BUCKET()}.${accountId}.r2.dev`;
  if (parsed.protocol !== "https:" || parsed.hostname === bucketHost || parsed.hostname === `${accountId}.r2.dev`) {
    throw new Error("R2_PUBLIC_URL is not a public bucket URL. In Cloudflare R2, enable Public access and set the generated https://pub-<token>.r2.dev URL (or a custom domain).");
  }

  return raw;
}

/**
 * Generate a presigned PUT URL so the client can upload directly to R2.
 *
 * @param {string} key        - object path in bucket, e.g. "banners/abc.jpg"
 * @param {string} contentType- MIME type, e.g. "image/jpeg"
 * @param {number} expiresIn  - seconds until URL expires (default 300 = 5 min)
 * @returns {{ uploadUrl: string, publicUrl: string }}
 */
export async function getPresignedUploadUrl(key, contentType, expiresIn = 300) {
  try {
    const command = new PutObjectCommand({
      Bucket:      BUCKET(),
      Key:         key,
      ContentType: contentType,
    });

    const uploadUrl  = await getSignedUrl(r2Client, command, { expiresIn });
    const publicUrl  = `${getPublicBaseUrl()}/${key}`;

    return { uploadUrl, publicUrl };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

export async function putObjectToR2(key, body, contentType) {
  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `${getPublicBaseUrl()}/${key}`;
}

/**
 * Delete an object from R2 by key.
 * @param {string} key - object key in bucket
 */
export async function deleteFromR2(key) {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}

/**
 * Extract the R2 object key from a full public URL.
 * e.g. "https://pub.r2.dev/examroot/banners/abc.jpg" → "banners/abc.jpg"
 */
export function keyFromUrl(url) {
  if (!url) return null;
  const base = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  return url.startsWith(base) ? url.slice(base.length + 1) : null;
}
