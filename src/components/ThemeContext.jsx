"use client"

import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext(null)
const STORAGE_KEY = "cartbehind-theme"

function getPreferredTheme() {
  if (typeof window === "undefined") {
    return "light"
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "dark" || stored === "light") {
    return stored
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyThemeClass(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = getPreferredTheme()
    setTheme(initial)
    applyThemeClass(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    applyThemeClass(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
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
