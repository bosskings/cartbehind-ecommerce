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

    async function loadProducts() {
      const cached = getCachedProducts()
      const hasValidCache = Boolean(cached && cached.length > 0)

      console.log("[useProducts Hook] Initialized. In-memory cache status:", {
        hasValidCache,
        cachedCount: cached?.length || 0,
        forceRefresh,
      })

      // Only show blocking loading skeleton if there is NO cached data to show
      if (!hasValidCache) {
        setLoading(true)
      }
      setError(null)

      try {
        const data = await fetchProducts({ forceRefresh })
        if (!cancelled) {
          setProducts(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load products.")
          // If no cache, clear products
          if (!hasValidCache) {
            setProducts([])
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [forceRefresh])

  return { products, loading, error }
}
