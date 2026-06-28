/**
 * uploadToR2.js
 * ─────────────────────────────────────────────────────────────
 * Usage:
 *   import { uploadToR2 } from '../utils/uploadToR2';
 *
 *   const publicUrl = await uploadToR2({
 *     token,
 *     fileUri:     result.assets[0].uri,    // local file URI from image picker
 *     contentType: 'image/jpeg',
 *     type:        'banner',                // banner | thumbnail | video | profile | series-cover
 *     filename:    'my-image.jpg',
 *     onProgress:  (pct) => setProgress(pct),  // optional
 *   });
 *   // publicUrl = "https://pub-xxx.r2.dev/banners/uuid.jpg"
 */

import { API_BASE_URL } from './baseUrl';

/**
 * @param {object} options
 * @param {string}   options.token        - JWT auth token
 * @param {string}   options.fileUri      - local file URI (from expo-image-picker or expo-document-picker)
 * @param {string}   options.contentType  - MIME type, e.g. 'image/jpeg'
 * @param {string}   options.type         - upload category: banner | thumbnail | video | profile | series-cover
 * @param {string}   options.filename     - original filename (for extension detection)
 * @param {Function} [options.onProgress] - optional progress callback (0–100)
 * @returns {Promise<string>} publicUrl of the uploaded file
 */
export async function uploadToR2({ token, fileUri, contentType, type, filename, onProgress }) {
  // 1. Get presigned URL from our server
  const presignRes = await fetch(`${API_BASE_URL}/upload/presign`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ type, filename, contentType }),
  });

  const presignData = await presignRes.json();
  if (!presignRes.ok || !presignData.success) {
    throw new Error(presignData.message || 'Failed to get upload URL');
  }

  const { uploadUrl, publicUrl } = presignData;

  // 2. Read file as blob
  const fileRes  = await fetch(fileUri);
  const fileBlob = await fileRes.blob();

  // 3. PUT file directly to R2 via presigned URL
  // Note: React Native fetch doesn't support onUploadProgress natively.
  // For progress tracking on larger files, use XMLHttpRequest instead.
  if (onProgress) {
    await uploadWithProgress(uploadUrl, fileBlob, contentType, onProgress);
  } else {
    const uploadRes = await fetch(uploadUrl, {
      method:  'PUT',
      headers: { 'Content-Type': contentType },
      body:    fileBlob,
    });
    if (!uploadRes.ok) {
      throw new Error(`R2 upload failed with status ${uploadRes.status}`);
    }
  }

  return publicUrl;
}

/**
 * Upload with XMLHttpRequest for progress tracking.
 */
function uploadWithProgress(url, blob, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload  = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(blob);
  });
}

/**
 * Delete a previously uploaded file by its public URL.
 * @param {string} token     - JWT auth token
 * @param {string} publicUrl - public R2 URL to delete
 */
export async function deleteFromR2(token, publicUrl) {
  const res = await fetch(`${API_BASE_URL}/upload`, {
    method:  'DELETE',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ url: publicUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete file');
  return data;
}
