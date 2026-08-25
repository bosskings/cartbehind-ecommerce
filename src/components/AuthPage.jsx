"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { LockKeyhole, LogIn, Mail, ShieldCheck, ShoppingBag, User, UserPlus, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/components/AuthContext"
import { useTheme } from "@/components/ThemeContext"
import { FaRegMoon, FaRegSun } from "react-icons/fa"
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from "@/lib/adminRoutes"

function Field({ label, icon: Icon, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-gray-800 transition focus-within:border-(--theme) focus-within:shadow-[0_0_0_3px_rgba(var(--theme-rgb),0.12)] dark:border-white/10 dark:bg-[#12101a] dark:text-gray-100">
        <Icon size={18} className="shrink-0 text-(--theme)" />
        {children}
      </span>
    </label>
  )
}

function getSafeNextPath(next) {
  if (typeof next !== "string") return null
  if (!next.startsWith("/") || next.startsWith("//")) return null
  return next
}

export default function AuthPage({ mode }) {
  const [email, setEmail] = useState("")
  const [accessId, setAccessId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get("next"))
  const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""
  const { signupUser, loginUser, loginAdmin } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()
  const isSignup = mode === "signup"
  const isAdmin = mode === "admin"
  const isDark = mounted && theme === "dark"

  const copy = isAdmin
    ? {
      eyebrow: "Admin Access",
      title: "CartBehind",
      body: "Sign in with your admin credential to manage the catalog.",
      action: "Enter Admin",
      icon: ShieldCheck,
    }
    : isSignup
      ? {
        eyebrow: "Create Account",
        title: "Join CartBehind",
        body: "Create a shopper account with your email, then verify it with the OTP we send.",
        action: "Create Account",
        icon: UserPlus,
      }
      : {
        eyebrow: "Welcome Back",
        title: "CartBehind Login",
        body: "Sign in with your email and password to continue shopping.",
        action: "Login",
        icon: LogIn,
      }

  const HeroIcon = copy.icon
  const IdentifierIcon = isAdmin ? User : Mail
  const identifierLabel = isAdmin ? "Access ID" : "Email"

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    const result = isAdmin
      ? await loginAdmin(accessId, password)
      : isSignup
        ? await signupUser(email, password)
        : await loginUser(email, password)

    if (!result.ok) {
      toast.error(result.message)
      setIsSubmitting(false)
      return
    }

    toast.success(result.message)

    if (isAdmin) {
      router.replace(ADMIN_BASE_PATH)
      return
    }

    if (isSignup) {
      router.replace(`/verify-email${nextQuery}`)
      return
    }

    router.replace(nextPath || "/")
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f5fb] px-4 py-10 text-gray-950 dark:bg-background dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.12),transparent_55%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#16131f] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-[320px] flex-col justify-between bg-(--theme) p-7 text-white sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <Link href={isAdmin ? ADMIN_LOGIN_PATH : `/login${nextQuery}`} className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--theme-second) text-[#280E89]">
                <ShoppingBag size={21} />
              </span>
              <span className="text-lg font-black tracking-tight">CartBehind</span>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              {isDark ? <FaRegSun size={18} /> : <FaRegMoon size={18} />}
            </button>
          </div>

          <div className="mt-14 max-w-sm">
            <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-(--theme-second)">
              <HeroIcon size={26} />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-(--theme-second)">{copy.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 text-sm leading-7 text-white/75">{copy.body}</p>
          </div>
        </section>

        <section className="p-6 sm:p-9 lg:p-10">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--theme)">
                {isAdmin ? "Seeded credential" : isSignup ? "Shopper signup" : "Shopper login"}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{copy.action}</h2>
            </div>

            <Field label={identifierLabel} icon={IdentifierIcon}>
              <input
                value={isAdmin ? accessId : email}
                onChange={(event) => (isAdmin ? setAccessId(event.target.value) : setEmail(event.target.value))}
                type={isAdmin ? "text" : "email"}
                autoComplete={isAdmin ? "username" : "email"}
                placeholder={isAdmin ? "access@cartbehind.admin" : "you@example.com"}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </Field>

            <Field label="Password" icon={LockKeyhole}>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="password"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="shrink-0 text-gray-400 transition hover:text-(--theme) dark:text-gray-500 dark:hover:text-(--theme)"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--theme) px-6 text-sm font-black text-(--theme-second) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HeroIcon size={18} />
              {isSubmitting ? "Please wait" : copy.action}
            </button>

            {!isAdmin && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {isSignup ? "Already have an account?" : "Need an account?"}{" "}
                <Link
                  href={isSignup ? `/login${nextQuery}` : `/signup${nextQuery}`}
                  className="font-bold text-(--theme) transition hover:opacity-70"
                >
                  {isSignup ? "Login" : "Sign up"}
                </Link>
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
