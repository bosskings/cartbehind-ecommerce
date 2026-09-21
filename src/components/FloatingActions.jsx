"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { ArrowUp } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"

const WHATSAPP_NUMBER = "2348108286186"
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

export default function FloatingActions() {
  const pathname = usePathname()
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  if (!mounted) return null

  // Do not render on admin dashboard
  if (pathname.startsWith("/22345_ad_224")) {
    return null
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* WhatsApp Button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat with us on WhatsApp"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#25D366",
          color: "#ffffff",
          boxShadow: "0 4px 16px rgba(37, 211, 102, 0.4)",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)"
          e.currentTarget.style.boxShadow = "0 6px 22px rgba(37, 211, 102, 0.55)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(37, 211, 102, 0.4)"
        }}
      >
        <FaWhatsapp size={26} />
      </a>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-(--theme) text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#280E89] hover:text-[var(--theme-second)] cursor-pointer"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  )
}
