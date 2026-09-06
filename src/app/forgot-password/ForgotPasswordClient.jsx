"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft, KeyRound, Mail, MailCheck, ShoppingBag } from "lucide-react"
import { FaRegMoon, FaRegSun } from "react-icons/fa"
import { useAuth } from "@/components/AuthContext"
import { useTheme } from "@/components/ThemeContext"

function safeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null
}

function otpBoxClass(state) {
  if (state === "success") return "border-emerald-500 bg-emerald-50 text-emerald-700"
  if (state === "error") return "border-red-500 bg-red-50 text-red-700"
  return "border-gray-200 bg-white text-gray-900 focus:border-(--theme) dark:border-white/10 dark:bg-[#12101a] dark:text-gray-100"
}

export default function ForgotPasswordClient() {
  const router = useRouter()
  const params = useSearchParams()
  const nextPath = safeNext(params.get("next"))
  const nextQuery = nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""
  const loginHref = `/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
  const { requestPasswordReset, verifyResetCode } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()
  const [email, setEmail] = useState("")
  const [step, setStep] = useState("email")
  const [digits, setDigits] = useState(["", "", "", "", "", ""])
  const [otpState, setOtpState] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const refs = useRef([])
  const isDark = mounted && theme === "dark"

  const focus = (index) => refs.current[index]?.focus()

  async function submitEmail(event) {
    event.preventDefault()
    if (!email.trim()) return toast.error("Enter your email address.")
    setSubmitting(true)
    const result = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (!result.ok) return toast.error(result.message)
    toast.success(result.message)
    setStep("otp")
    setTimeout(() => focus(0), 0)
  }

  function setDigit(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1)
    setDigits((current) => current.map((item, position) => position === index ? digit : item))
    setOtpState("")
    if (digit && index < 5) focus(index + 1)
  }

  function handleKey(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) focus(index - 1)
    if (event.key === "ArrowLeft" && index > 0) focus(index - 1)
    if (event.key === "ArrowRight" && index < 5) focus(index + 1)
  }

  function pasteOtp(event) {
    event.preventDefault()
    const value = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!value) return
    setDigits(value.padEnd(6, "").split(""))
    setOtpState("")
    focus(Math.min(value.length, 5))
  }

  async function submitOtp(event) {
    event.preventDefault()
    const otp = digits.join("")
    if (otp.length !== 6) {
      setOtpState("error")
      return toast.error("Enter the 6-digit code.")
    }
    setSubmitting(true)
    const result = await verifyResetCode(email.trim(), otp)
    setSubmitting(false)
    if (!result.ok) {
      setOtpState("error")
      return toast.error(result.message)
    }
    setOtpState("success")
    toast.success(result.message)
    setTimeout(() => router.replace(`/reset-password?email=${encodeURIComponent(email.trim())}${nextQuery}`), 450)
  }

  async function resendOtp() {
    if (!email.trim() || submitting) return
    setSubmitting(true)
    const result = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (!result.ok) return toast.error(result.message)
    setDigits(["", "", "", "", "", ""])
    setOtpState("")
    toast.success(result.message)
    setTimeout(() => focus(0), 0)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5fb] px-4 py-10 text-gray-950 dark:bg-background dark:text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#16131f] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-[320px] flex-col justify-between bg-(--theme) p-7 text-white sm:p-9">
          <div className="flex items-center justify-between"><Link href={loginHref} className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--theme-second) text-[#280E89]"><ShoppingBag size={21} /></span><span className="text-lg font-black">CartBehind</span></Link><button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">{isDark ? <FaRegSun size={18} /> : <FaRegMoon size={18} />}</button></div>
          <div className="mt-14 max-w-sm"><KeyRound size={28} className="mb-5 text-(--theme-second)" /><p className="text-xs font-black uppercase tracking-[0.32em] text-(--theme-second)">Account recovery</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">{step === "email" ? "Forgot password?" : "Check your email"}</h1><p className="mt-4 text-sm leading-7 text-white/75">{step === "email" ? "We will send a six-digit reset code to your email address." : `Enter the code sent to ${email}.`}</p></div>
        </section>
        <section className="p-6 sm:p-9 lg:p-10">
          {step === "email" ? <form onSubmit={submitEmail} className="mx-auto flex max-w-md flex-col gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-(--theme)">Reset access</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Send reset code</h2></div><label className="space-y-2"><span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Email</span><span className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 dark:border-white/10 dark:bg-[#12101a]"><Mail size={18} className="text-(--theme)" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100" /></span></label><button type="submit" disabled={submitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-(--theme) text-sm font-black text-(--theme-second) disabled:opacity-60"><MailCheck size={18} />{submitting ? "Sending..." : "Send reset code"}</button><Link href={loginHref} className="inline-flex justify-center gap-2 text-sm font-bold text-(--theme)"><ArrowLeft size={16} />Back to login</Link></form> : <form onSubmit={submitOtp} className="mx-auto flex max-w-md flex-col gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-(--theme)">Email verification</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Enter reset code</h2></div><div className="flex justify-center gap-2 sm:gap-3" onPaste={pasteOtp}>{digits.map((digit, index) => <input key={index} ref={(element) => { refs.current[index] = element }} value={digit} onChange={(event) => setDigit(index, event.target.value)} onKeyDown={(event) => handleKey(index, event)} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={`OTP digit ${index + 1}`} className={`h-12 w-10 rounded-xl border-2 text-center text-xl font-black outline-none sm:h-14 sm:w-12 ${otpBoxClass(otpState)}`} />)}</div><button type="submit" disabled={submitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-(--theme) text-sm font-black text-(--theme-second) disabled:opacity-60"><KeyRound size={18} />{submitting ? "Verifying..." : "Verify code"}</button><button type="button" onClick={resendOtp} disabled={submitting} className="text-sm font-bold text-(--theme) disabled:opacity-50">Resend OTP</button><button type="button" onClick={() => { setStep("email"); setDigits(["", "", "", "", "", ""]); setOtpState("") }} className="text-sm font-bold text-gray-500 hover:text-(--theme)">Use a different email</button></form>}
        </section>
      </div>
    </main>
  )
}
