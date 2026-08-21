"use client"

const ADMIN_SESSION_KEY = "cartbehind-admin-session"

export function getAdminToken() {
  if (typeof window === "undefined") return null

  try {
    const stored = window.localStorage.getItem(ADMIN_SESSION_KEY)
    return stored ? JSON.parse(stored)?.authToken || null : null
  } catch {
    return null
  }
}

export async function uploadToCloudinary(file) {
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  const token = getAdminToken()

  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  if (!token) {
    throw new Error("Admin token is missing. Please log in again.")
  }

  const signatureRes = await fetch(`${API_URL}/api/v1/admin/cloudinary-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const signature = await signatureRes.json()
  console.log(signature)

  if (!signatureRes.ok) {
    throw new Error(signature?.message || "Failed to get Cloudinary signature.")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", signature.apiKey)
  formData.append("timestamp", signature.timestamp)
  formData.append("signature", signature.signature)
  formData.append("folder", signature.folder)

  const cloudinaryRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  )

  const uploaded = await cloudinaryRes.json()
  console.log(uploaded)

  if (!cloudinaryRes.ok) {
    throw new Error(uploaded?.error?.message || "Cloudinary upload failed.")
  }

  return uploaded
}
