/**
 * uploadToR2.js — Admin Panel version
 *
 * Usage:
 *   import { uploadToR2 } from '../utils/uploadToR2';
 *
 *   // file = File object from <input type="file">
 *   const publicUrl = await uploadToR2({
 *     file,
 *     type: 'thumbnail',          // banner | thumbnail | video | profile | series-cover
 *     onProgress: (pct) => ...    // optional
 *   });
 */

const BASE_URL = 'http://localhost:3000/api';

/**
 * @param {object}   options
 * @param {File}     options.file         - File object from file input
 * @param {string}   options.type         - upload category
 * @param {Function} [options.onProgress] - progress callback (0–100)
 * @returns {Promise<string>} publicUrl
 */
export async function uploadToR2({ file, type, onProgress }) {
  // 1. Get presigned URL
  const presignRes = await fetch(`${BASE_URL}/upload/presign`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      filename:    file.name,
      contentType: file.type,
    }),
  });

  const presignData = await presignRes.json();
  if (!presignRes.ok || !presignData.success) {
    throw new Error(presignData.message || 'Failed to get presigned URL');
  }

  const { uploadUrl, publicUrl } = presignData;

  // 2. PUT file directly to R2
  if (onProgress) {
    await uploadWithProgress(uploadUrl, file, onProgress);
  } else {
    const uploadRes = await fetch(uploadUrl, {
      method:  'PUT',
      headers: { 'Content-Type': file.type },
      body:    file,
    });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
  }

  return publicUrl;
}

function uploadWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload  = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

/**
 * Delete uploaded file by public URL
 */
export async function deleteUploadedFile(publicUrl) {
  const res = await fetch(`${BASE_URL}/upload`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: publicUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Delete failed');
  return data;
}
