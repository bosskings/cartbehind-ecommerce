"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/AuthContext"
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH, isAdminPath } from "@/lib/adminRoutes"

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5fb] px-4 text-gray-950 dark:bg-background dark:text-white">
      <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white px-5 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#16131f]">
        <Loader2 size={18} className="animate-spin text-(--theme)" />
      </div>
    </main>
  )
}

function getSafeNextPath(next) {
  if (typeof next !== "string") return "/"
  if (!next.startsWith("/") || next.startsWith("//")) return "/"
  return next
}

export default function AuthRouteGuard({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isUserAuthenticated, isAdminAuthenticated } = useAuth()
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    setAuthReady(true)
  }, [])

  const isAdminRoute = isAdminPath(pathname)
  const isAdminLogin = pathname === ADMIN_LOGIN_PATH
  const isUserAuthRoute = pathname === "/login" || pathname === "/signup" || pathname === "/verify-email"
  const shouldBlockAdmin = isAdminRoute && !isAdminLogin && !isAdminAuthenticated
  const shouldLeaveAdminLogin = isAdminLogin && isAdminAuthenticated
  const shouldLeaveUserAuth = isUserAuthRoute && isUserAuthenticated

  useEffect(() => {
    if (!authReady) return

    if (shouldLeaveAdminLogin) {
      router.replace(ADMIN_BASE_PATH)
      return
    }

    if (shouldLeaveUserAuth) {
      const params = new URLSearchParams(window.location.search)
      router.replace(getSafeNextPath(params.get("next")))
      return
    }

    if (shouldBlockAdmin) {
      router.replace(ADMIN_LOGIN_PATH)
    }
  }, [authReady, router, shouldBlockAdmin, shouldLeaveAdminLogin, shouldLeaveUserAuth])

  if (!authReady || shouldLeaveAdminLogin || shouldLeaveUserAuth || shouldBlockAdmin) {
    return <LoadingScreen />
  }

  return children
}
