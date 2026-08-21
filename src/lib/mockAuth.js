"use client"

const USER_SESSION_KEY = "cartbehind-user-session"
const ADMIN_SESSION_KEY = "cartbehind-admin-session"

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback

  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    window.localStorage.removeItem(key)
    return fallback
  }
}

export function getUserSession() {
  return readJson(USER_SESSION_KEY, null)
}

export function getAdminSession() {
  return readJson(ADMIN_SESSION_KEY, null)
}

export function logoutUser() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(USER_SESSION_KEY)
}

export function logoutAdmin() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}
