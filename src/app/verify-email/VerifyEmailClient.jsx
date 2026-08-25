"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { KeyRound, Mail, MailCheck, ShoppingBag } from "lucide-react"
import { FaRegMoon, FaRegSun } from "react-icons/fa"
import { useAuth } from "@/components/AuthContext"
import { useTheme } from "@/components/ThemeContext"

function getSafeNextPath(next) {
  if (typeof next !== "string") return null
  if (!next.startsWith("/") || next.startsWith("//")) return null
  return next
}

export default function VerifyEmailClient() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get("next"))
  const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""
  const { verifyUserEmail } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()
  const isDark = mounted && theme === "dark"

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    const result = await verifyUserEmail(email, otp)

    if (!result.ok) {
      toast.error(result.message)
      setIsSubmitting(false)
      return
    }

    toast.success(result.message)
    router.replace(`/login${nextQuery}`)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f5fb] px-4 py-10 text-gray-950 dark:bg-background dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.12),transparent_55%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#16131f] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-[320px] flex-col justify-between bg-(--theme) p-7 text-white sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <Link href={`/login${nextQuery}`} className="inline-flex items-center gap-3">
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
              <MailCheck size={26} />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-(--theme-second)">Verify Email</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Enter OTP</h1>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Enter the email you signed up with and the one-time code we sent. Then log in to continue.
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-9 lg:p-10">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--theme)">Email verification</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Confirm your code</h2>
            </div>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Email
              </span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-gray-800 transition focus-within:border-(--theme) focus-within:shadow-[0_0_0_3px_rgba(var(--theme-rgb),0.12)] dark:border-white/10 dark:bg-[#12101a] dark:text-gray-100">
                <Mail size={18} className="shrink-0 text-(--theme)" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                OTP
              </span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-gray-800 transition focus-within:border-(--theme) focus-within:shadow-[0_0_0_3px_rgba(var(--theme-rgb),0.12)] dark:border-white/10 dark:bg-[#12101a] dark:text-gray-100">
                <KeyRound size={18} className="shrink-0 text-(--theme)" />
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter OTP"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--theme) px-6 text-sm font-black text-(--theme-second) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MailCheck size={18} />
              {isSubmitting ? "Please wait" : "Verify Email"}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Already verified?{" "}
              <Link href={`/login${nextQuery}`} className="font-bold text-(--theme) transition hover:opacity-70">
                Go to login
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}
