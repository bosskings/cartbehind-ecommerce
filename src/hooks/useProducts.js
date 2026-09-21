"use client"

import { useEffect, useState } from "react"
import { fetchProducts, getCachedProducts } from "@/lib/products"

export function useProducts({ forceRefresh = false } = {}) {
  // Synchronously initialize from memory if available
  const [products, setProducts] = useState(() => {
    const cached = getCachedProducts()
    return cached || []
  })
  const [loading, setLoading] = useState(() => {
    const cached = getCachedProducts()
    return !cached || cached.length === 0
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadProducts(shouldForce = false) {
      const cached = getCachedProducts()
      const hasValidCache = Boolean(cached && cached.length > 0)

      // Only show blocking loading skeleton if there is NO cached data to show at all
      if (!hasValidCache) {
        setLoading(true)
      }
      setError(null)

      try {
        // Fetch products (background revalidation if cache already exists)
        const data = await fetchProducts({ forceRefresh: shouldForce || forceRefresh })
        if (!cancelled && data) {
          setProducts(data)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[useProducts Hook] Fetch failed:", err)
          if (!hasValidCache) {
            setError(err.message || "Failed to load products.")
            setProducts([])
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    // Always revalidate in background on mount so new uploads/deals show up
    loadProducts(forceRefresh)

    // Listen for local and cross-tab cache invalidations (e.g. admin uploads/edits)
    const handleInvalidation = () => {
      console.log("[useProducts Hook] Cache cleared event received. Fetching latest catalog...")
      loadProducts(true)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("cartbehind_products_cache_cleared", handleInvalidation)
      window.addEventListener("storage", (e) => {
        if (e.key === "cartbehind_cache_cleared") {
          handleInvalidation()
        }
      })
    }

    return () => {
      cancelled = true
      if (typeof window !== "undefined") {
        window.removeEventListener("cartbehind_products_cache_cleared", handleInvalidation)
      }
    }
  }, [forceRefresh])

  return { products, loading, error }
}
