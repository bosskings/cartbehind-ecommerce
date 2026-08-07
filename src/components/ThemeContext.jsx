"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useServerInsertedHTML } from "next/navigation"

const ThemeContext = createContext(null)
const STORAGE_KEY = "cartbehind-theme"

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=s==="dark"||s==="light"?s:d?"dark":"light";document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getPreferredTheme() {
  if (typeof window === "undefined") {
    return "light"
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "dark" || stored === "light") {
    return stored
  }

  return getSystemTheme()
}

function applyThemeClass(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light")
  const [mounted, setMounted] = useState(false)
  const scriptInserted = useRef(false)

  // Inject outside the React tree so React 19 doesn't warn about <script>
  useServerInsertedHTML(() => {
    if (scriptInserted.current) return null
    scriptInserted.current = true
    return (
      <script
        id="cartbehind-theme-init"
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
    )
  })

  useEffect(() => {
    const initial = getPreferredTheme()
    setTheme(initial)
    applyThemeClass(initial)
    setMounted(true)

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onSystemThemeChange = (event) => {
      // Only follow the browser while the user hasn't picked a theme yet
      if (window.localStorage.getItem(STORAGE_KEY)) return

      const next = event.matches ? "dark" : "light"
      setTheme(next)
      applyThemeClass(next)
    }

    media.addEventListener("change", onSystemThemeChange)
    return () => media.removeEventListener("change", onSystemThemeChange)
  }, [])

  useEffect(() => {
    if (!mounted) return
    applyThemeClass(theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark"
      window.localStorage.setItem(STORAGE_KEY, next)
      applyThemeClass(next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
