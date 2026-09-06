"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, ShoppingBag } from "lucide-react"
import { FaRegMoon, FaRegSun } from "react-icons/fa"
import { useAuth } from "@/components/AuthContext"
import { useTheme } from "@/components/ThemeContext"

function safeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null
}

export default function ResetPasswordClient() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get("email") || ""
  const next = safeNext(params.get("next"))
  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`
  const { resetPassword } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isDark = mounted && theme === "dark"

  async function submit(event) {
    event.preventDefault()
    if (!email) return toast.error("Verified email is missing. Please start again.")
    if (!newPassword || !newPasswordConfirm) return toast.error("Enter and confirm your new password.")
    if (newPassword !== newPasswordConfirm) return toast.error("Passwords do not match.")
    setSubmitting(true)
    const result = await resetPassword(email, newPassword, newPasswordConfirm)
    setSubmitting(false)
    if (!result.ok) return toast.error(result.message)
    toast.success(result.message)
    router.replace(loginHref)
  }

  const inputText = "text-gray-900 dark:text-gray-100"
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f5fb] px-4 py-10 text-gray-950 dark:bg-background dark:text-white"><div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#16131f] lg:grid-cols-[0.95fr_1.05fr]"><section className="flex min-h-[320px] flex-col justify-between bg-(--theme) p-7 text-white sm:p-9"><div className="flex items-center justify-between"><Link href={loginHref} className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--theme-second) text-[#280E89]"><ShoppingBag size={21} /></span><span className="text-lg font-black">CartBehind</span></Link><button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">{isDark ? <FaRegSun size={18} /> : <FaRegMoon size={18} />}</button></div><div className="mt-14 max-w-sm"><KeyRound size={28} className="mb-5 text-(--theme-second)" /><p className="text-xs font-black uppercase tracking-[0.32em] text-(--theme-second)">Account recovery</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Set new password</h1><p className="mt-4 text-sm leading-7 text-white/75">Choose a new password for your CartBehind account.</p></div></section><section className="p-6 sm:p-9 lg:p-10"><form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-(--theme)">Password reset</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Create a new password</h2><p className="mt-2 truncate text-sm text-gray-500">{email || "Verified email unavailable"}</p></div><label className="space-y-2"><span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">New password</span><span className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 dark:border-white/10 dark:bg-[#12101a]"><LockKeyhole size={18} className="text-(--theme)" /><input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="new-password" className={`h-full min-w-0 flex-1 bg-transparent text-sm outline-none ${inputText}`} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility" className="text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label><label className="space-y-2"><span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Confirm password</span><span className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 dark:border-white/10 dark:bg-[#12101a]"><LockKeyhole size={18} className="text-(--theme)" /><input value={newPasswordConfirm} onChange={(event) => setNewPasswordConfirm(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="new-password" className={`h-full min-w-0 flex-1 bg-transparent text-sm outline-none ${inputText}`} /></span></label><button type="submit" disabled={submitting || !email} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-(--theme) text-sm font-black text-(--theme-second) disabled:opacity-60"><KeyRound size={18} />{submitting ? "Resetting..." : "Reset password"}</button><Link href={loginHref} className="inline-flex justify-center gap-2 text-sm font-bold text-(--theme)"><ArrowLeft size={16} />Back to login</Link></form></section></div></main>
}
