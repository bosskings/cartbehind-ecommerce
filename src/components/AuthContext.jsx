"use client"

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react"
import axios from "axios"
import { Toaster } from "react-hot-toast"

const AuthContext = createContext(null)

const USER_SESSION_KEY = "cartbehind-user-session"
const ADMIN_SESSION_KEY = "cartbehind-admin-session"

function readSession(key) {
  if (typeof window === "undefined") return null

  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

function readUserSession() {
  return readSession(USER_SESSION_KEY)
}

function readAdminSession() {
  return readSession(ADMIN_SESSION_KEY)
}

function writeAdminSession(session) {
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

function writeUserSession(session) {
  window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session))
}

function clearUserSession() {
  window.localStorage.removeItem(USER_SESSION_KEY)
}

function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL
}

export function isUserAuthError(error) {
  const status = error?.response?.status || error?.status
  const message = String(
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    ""
  ).toLowerCase()

  return (
    status === 401 ||
    status === 403 ||
    message.includes("expired") ||
    message.includes("invalid token") ||
    message.includes("jwt") ||
    message.includes("unauthorized")
  )
}

function getApiErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback
}

export function AuthProvider({ children }) {
  const [userSession, setUserSession] = useState(readUserSession)
  const [adminSession, setAdminSession] = useState(readAdminSession)
  const [authReady] = useState(() => typeof window !== "undefined")

  const handleUserAuthExpired = useCallback((nextPath) => {
    clearUserSession()
    setUserSession(null)
    if (typeof window !== "undefined") {
      const currentPath = nextPath || `${window.location.pathname}${window.location.search || ""}`
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = `/login?next=${encodeURIComponent(currentPath)}`
      }
    }
  }, [])

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = String(error?.config?.url || "")
        const isAuthEndpoint =
          url.includes("/login") ||
          url.includes("/signup") ||
          url.includes("/verifyEmail") ||
          url.includes("/forgot-password") ||
          url.includes("/reset-password") ||
          url.includes("/verify-reset-code")

        if (!isAuthEndpoint && isUserAuthError(error)) {
          const isUserRequest = url.includes("/api/v1/users/") || Boolean(userSession?.authToken)
          if (isUserRequest && !url.includes("/api/v1/admin/")) {
            handleUserAuthExpired()
          }
        }
        return Promise.reject(error)
      },
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [handleUserAuthExpired, userSession?.authToken])

  const signupUser = async (email, password) => {
    try {
      const backendUrl = getBackendUrl()
      if (!backendUrl) {
        return { ok: false, message: "NEXT_PUBLIC_BACKEND_URL is missing." }
      }

      const response = await axios.post(`${backendUrl}/api/v1/users/signup`, {
        email,
        password,
      })

      return {
        ok: true,
        message: response.data?.message || "Account created. Please verify your email.",
        data: response.data,
      }
    } catch (error) {
      console.error(error)
      return {
        ok: false,
        message: getApiErrorMessage(error, "Signup request failed."),
      }
    }
  }

  const verifyUserEmail = async (email, otp) => {
    try {
      const backendUrl = getBackendUrl()
      if (!backendUrl) {
        return { ok: false, message: "NEXT_PUBLIC_BACKEND_URL is missing." }
      }

      const response = await axios.post(`${backendUrl}/api/v1/users/verifyEmail`, {
        email,
        otp,
      })

      if (response.data?.status === "ERROR") {
        return {
          ok: false,
          message: response.data?.message || "Email verification failed.",
        }
      }

      return {
        ok: true,
        message: response.data?.message || "Email verified successfully. Please log in.",
        data: response.data,
      }
    } catch (error) {
      console.error(error)
      return {
        ok: false,
        message: getApiErrorMessage(error, "Email verification failed."),
      }
    }
  }

  const loginUser = async (email, password) => {
    try {
      const backendUrl = getBackendUrl()
      if (!backendUrl) {
        return { ok: false, message: "NEXT_PUBLIC_BACKEND_URL is missing." }
      }

      const response = await axios.post(`${backendUrl}/api/v1/users/login`, {
        email,
        password,
      })

      const session = {
        email: response.data?.user?.email || email,
        role: "user",
        authToken: response.data?.token,
        user: response.data?.user ?? null,
      }

      writeUserSession(session)
      setUserSession(session)

      return {
        ok: true,
        message: response.data?.message || "Login successful.",
        session,
        data: response.data,
      }
    } catch (error) {
      console.error(error)
      return {
        ok: false,
        message: getApiErrorMessage(error, "Login request failed."),
      }
    }
  }

  const loginAdmin = async (accessId, password) => {
    try {
      const backendUrl = getBackendUrl()
      if (!backendUrl) {
        return {
          ok: false,
          message: "NEXT_PUBLIC_BACKEND_URL is missing.",
        }
      }

      const response = await axios.post(`${backendUrl}/api/v1/admin/login`, {
        accessId,
        password,
      })

      const session = {
        role: "admin",
        authToken: response.data?.token,
        admin: response.data?.admin ?? null,
      }

      writeAdminSession(session)
      setAdminSession(session)

      return {
        ok: true,
        message: response.data?.message || "Admin login successful.",
        session,
        data: response.data,
      }
    } catch (error) {
      console.error(error)
      return {
        ok: false,
        message: getApiErrorMessage(error, "Admin login request failed."),
      }
    }
  }

  const requestPasswordReset = async (email) => {
    try {
      const backendUrl = getBackendUrl()
      if (!backendUrl) return { ok: false, message: "NEXT_PUBLIC_BACKEND_URL is missing." }
      const response = await axios.post(`${backendUrl}/api/v1/users/forgot-password`, { email })
      const ok = response.data?.status !== "ERROR"
      return { ok, message: response.data?.message || (ok ? "Reset code sent to your email." : "Could not send reset code."), data: response.data }
    } catch (error) {
      console.error(error)
      return { ok: false, message: getApiErrorMessage(error, "Could not send reset code.") }
    }
  }

  const verifyResetCode = async (email, otp) => {
    try {
      const backendUrl = getBackendUrl()
      if (!backendUrl) return { ok: false, message: "NEXT_PUBLIC_BACKEND_URL is missing." }
      const response = await axios.post(`${backendUrl}/api/v1/users/verify-reset-code`, { email, otp })
      const ok = response.data?.status !== "ERROR"
      return { ok, message: response.data?.message || (ok ? "OTP verified. You may reset your password." : "Invalid reset code."), data: response.data }
    } catch (error) {
      console.error(error)
      return { ok: false, message: getApiErrorMessage(error, "Could not verify reset code.") }
    }
  }

  const resetPassword = async (email, newPassword, newPasswordConfirm) => {
    try {
      const backendUrl = getBackendUrl()
      if (!backendUrl) return { ok: false, message: "NEXT_PUBLIC_BACKEND_URL is missing." }
      const response = await axios.post(`${backendUrl}/api/v1/users/reset-password`, { email, newPassword, newPasswordConfirm })
      const ok = response.data?.status !== "ERROR"
      return { ok, message: response.data?.message || (ok ? "Password reset successfully." : "Could not reset password."), data: response.data }
    } catch (error) {
      console.error(error)
      return { ok: false, message: getApiErrorMessage(error, "Could not reset password.") }
    }
  }

  const logoutUser = () => {
    clearUserSession()
    setUserSession(null)
  }

  const logoutAdmin = () => {
    clearAdminSession()
    setAdminSession(null)
  }

  const value = useMemo(
    () => ({
      userSession,
      adminSession,
      authReady,
      isUserAuthenticated: Boolean(userSession?.authToken),
      isAdminAuthenticated: Boolean(adminSession?.authToken),
      signupUser,
      verifyUserEmail,
      loginUser,
      loginAdmin,
      requestPasswordReset,
      verifyResetCode,
      resetPassword,
      logoutUser,
      logoutAdmin,
      handleUserAuthExpired,
    }),
    [userSession, adminSession, authReady, handleUserAuthExpired],
  )

  return (
    <AuthContext.Provider value={value}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2400,
          style: {
            borderRadius: "14px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.16)",
          },
          success: {
            iconTheme: {
              primary: "var(--theme)",
              secondary: "var(--theme-second)",
            },
          },
        }}
      />
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
