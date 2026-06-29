/**
 * uploadToR2.js — Admin Panel version
 */

import { BASE_URL } from '../utils/baseUrl'

export async function uploadToR2({ file, type, onProgress }) {
  const presignRes = await fetch(`${BASE_URL}/upload/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      filename: file.name,
      contentType: file.type,
    }),
  })

  const presignData = await presignRes.json()
  if (!presignRes.ok || !presignData.success) {
    throw new Error(presignData.message || 'Failed to get presigned URL')
  }

  const { uploadUrl, publicUrl } = presignData

  if (onProgress) {
    await uploadWithProgress(uploadUrl, file, onProgress)
  } else {
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
  }

  return publicUrl
}

function uploadWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(file)
  })
}

export async function deleteUploadedFile(publicUrl) {
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: publicUrl }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Delete failed')
  return data
}
