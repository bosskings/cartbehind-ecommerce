import axios from "axios"

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL
}

function getBackendUrlOrThrow() {
  const backendUrl = getBackendUrl()
  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }
  return backendUrl
}

export function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== "object") return null

  const id = rawUser._id || rawUser.id || ""
  return {
    ...rawUser,
    id,
    _id: id,
    email: rawUser.email || "No email",
    active: rawUser.active !== false,
    isVerified: Boolean(rawUser.isVerified),
    verificationToken: rawUser.verificationToken || null,
    createdAt: rawUser.createdAt || rawUser.created_at || null,
  }
}

export async function fetchAdminUsers(authToken) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) {
    throw new Error("Admin authentication is required to view users.")
  }

  const response = await axios.get(`${backendUrl}/api/v1/admin/users`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  const rawUsers =
    (Array.isArray(response.data) && response.data) ||
    (Array.isArray(response.data?.users) && response.data.users) ||
    (Array.isArray(response.data?.data) && response.data.data) ||
    []

  return rawUsers.map(normalizeUser).filter(Boolean)
}

export async function blockAdminUser(authToken, userId) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) {
    throw new Error("Admin authentication is required to block a user.")
  }
  if (!userId) {
    throw new Error("User ID is required.")
  }

  const response = await axios.patch(
    `${backendUrl}/api/v1/admin/users/block/${encodeURIComponent(userId)}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  )

  return response.data
}
