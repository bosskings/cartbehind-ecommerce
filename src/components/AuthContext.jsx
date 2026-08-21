"use client"

import { createContext, useContext, useMemo, useState } from "react"
import axios from "axios"
import { Toaster } from "react-hot-toast"
import {
  getAdminSession,
  getUserSession,
  logoutAdmin as logoutAdminHelper,
  logoutUser as logoutUserHelper,
} from "@/lib/mockAuth"

const AuthContext = createContext(null)

const USER_SESSION_KEY = "cartbehind-user-session"
const ADMIN_SESSION_KEY = "cartbehind-admin-session"

function writeAdminSession(session) {
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

function writeUserSession(session) {
  window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session))
}

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL
}

function getApiErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback
}

export function AuthProvider({ children }) {
  const [userSession, setUserSession] = useState(getUserSession)
  const [adminSession, setAdminSession] = useState(getAdminSession)
  const [authReady] = useState(() => typeof window !== "undefined")

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

      console.log(response.data)

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

      console.log(response.data)

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

      console.log(response.data)

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

      console.log(response.data)

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

  const logoutUser = () => {
    logoutUserHelper()
    setUserSession(null)
  }

  const logoutAdmin = () => {
    logoutAdminHelper()
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
      logoutUser,
      logoutAdmin,
    }),
    [userSession, adminSession, authReady],
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
