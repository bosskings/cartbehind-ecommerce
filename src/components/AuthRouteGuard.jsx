"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/AuthContext"

const OPEN_ROUTES = new Set(["/login", "/signup", "/verify-email", "/admin/login"])

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5fb] px-4 text-gray-950 dark:bg-background dark:text-white">
      <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white px-5 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#16131f]">
        <Loader2 size={18} className="animate-spin text-(--theme)" />
      </div>
    </main>
  )
}

export default function AuthRouteGuard({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { authReady, isUserAuthenticated, isAdminAuthenticated } = useAuth()

  const isOpenRoute = OPEN_ROUTES.has(pathname)
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")
  const isAdminLogin = pathname === "/admin/login"
  const isUserAuthRoute = pathname === "/login" || pathname === "/signup" || pathname === "/verify-email"
  const shouldBlockAdmin = !isOpenRoute && isAdminRoute && !isAdminAuthenticated
  const shouldBlockUser = !isOpenRoute && !isAdminRoute && !isUserAuthenticated
  const shouldLeaveAdminLogin = isAdminLogin && isAdminAuthenticated
  const shouldLeaveUserAuth = isUserAuthRoute && isUserAuthenticated

  useEffect(() => {
    if (!authReady) return

    if (shouldLeaveAdminLogin) {
      router.replace("/admin")
      return
    }

    if (shouldLeaveUserAuth) {
      router.replace("/")
      return
    }

    if (shouldBlockAdmin) {
      router.replace("/admin/login")
      return
    }

    if (shouldBlockUser) {
      router.replace("/login")
    }
  }, [authReady, router, shouldBlockAdmin, shouldBlockUser, shouldLeaveAdminLogin, shouldLeaveUserAuth])

  if (!authReady || shouldLeaveAdminLogin || shouldLeaveUserAuth || shouldBlockAdmin || shouldBlockUser) {
    return <LoadingScreen />
  }

  return children
}
