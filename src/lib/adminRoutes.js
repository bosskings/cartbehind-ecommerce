"use client"

export const ADMIN_BASE_PATH = "/22345_ad_224/admin"
export const ADMIN_LOGIN_PATH = `${ADMIN_BASE_PATH}/login`

export function isAdminPath(pathname) {
  return pathname === ADMIN_BASE_PATH || pathname.startsWith(`${ADMIN_BASE_PATH}/`)
}
