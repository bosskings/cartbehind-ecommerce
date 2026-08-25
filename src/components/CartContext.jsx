"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { useAuth } from "@/components/AuthContext"

const CartContext = createContext(null)
const CART_SYNC_DEBOUNCE_MS = 800

function readStoredCart() {
  if (typeof window === "undefined") {
    return []
  }

  const stored = window.localStorage.getItem("cartbehind-cart")
  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    window.localStorage.removeItem("cartbehind-cart")
    return []
  }
}

function parseImage(image) {
  if (!image) return "/thumbnail.webp"

  if (typeof image === "object") {
    return image.url || "/thumbnail.webp"
  }

  if (typeof image !== "string") {
    return "/thumbnail.webp"
  }

  try {
    const parsed = JSON.parse(image)
    return parsed?.url || image
  } catch {
    return image
  }
}

function normalizeServerCartItem(item) {
  const product = item.product || item.productId || item
  const id =
    typeof product === "object"
      ? product._id || product.id || item.productId || item.id
      : product || item.productId || item.id

  if (!id) return null

  const category = product?.category || item.category || ""

  return {
    id,
    title: product?.name || product?.title || item.name || item.title || "Product",
    description: product?.description || item.description || "",
    price: Number(product?.price ?? item.price ?? 0),
    category,
    brand: product?.brand || item.brand || category,
    stock: product?.stock ?? item.stock ?? 0,
    image: parseImage(product?.image || item.image),
    createdAt: product?.createdAt || item.createdAt,
    quantity: Math.max(1, Number(item.quantity) || 1),
  }
}

function mergeCartItems(localItems, serverItems) {
  const merged = new Map()

  for (const item of serverItems) {
    if (!item?.id) continue
    merged.set(item.id, item)
  }

  for (const item of localItems) {
    if (!item?.id) continue
    const existing = merged.get(item.id)
    if (!existing) {
      merged.set(item.id, item)
      continue
    }

    merged.set(item.id, {
      ...existing,
      ...item,
      quantity: Math.max(existing.quantity || 1, item.quantity || 1),
    })
  }

  return Array.from(merged.values())
}

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL
}

export function CartProvider({ children }) {
  const { isUserAuthenticated, userSession } = useAuth()
  const [items, setItems] = useState(readStoredCart)
  const itemsRef = useRef(items)
  const debounceTimersRef = useRef(new Map())
  const authToken = userSession?.authToken
  const canSyncCart = Boolean(isUserAuthenticated && authToken && getBackendUrl())

  const applyItems = useCallback((nextItems) => {
    itemsRef.current = nextItems
    setItems(nextItems)
  }, [])

  const getHeaders = useCallback(() => {
    if (!authToken) return null
    return {
      Authorization: `Bearer ${authToken}`,
    }
  }, [authToken])

  const syncCartAdd = useCallback(
    async (productId, quantity) => {
      if (!canSyncCart) return

      try {
        await axios.post(
          `${getBackendUrl()}/api/v1/users/cart/add`,
          { productId, quantity },
          { headers: getHeaders() },
        )
      } catch (error) {
        console.error("Failed to sync cart add.", error)
      }
    },
    [canSyncCart, getHeaders],
  )

  const syncCartUpdate = useCallback(
    async (productId, quantity) => {
      if (!canSyncCart) return

      try {
        const response = await axios.patch(
          `${getBackendUrl()}/api/v1/users/cart/update`,
          { productId, quantity },
          { headers: getHeaders() },
        )
        console.log("Cart update response:", response.data)
      } catch (error) {
        console.error("Failed to sync cart quantity.", error)
      }
    },
    [canSyncCart, getHeaders],
  )

  const syncCartDelete = useCallback(
    async (productId) => {
      if (!canSyncCart) return

      try {
        await axios.delete(`${getBackendUrl()}/api/v1/users/cart/delete`, {
          data: { productId },
          headers: getHeaders(),
        })
      } catch (error) {
        console.error("Failed to sync cart delete.", error)
      }
    },
    [canSyncCart, getHeaders],
  )

  const debounceCartUpdate = useCallback(
    (productId, quantity) => {
      if (!canSyncCart) return

      const existingTimer = debounceTimersRef.current.get(productId)
      if (existingTimer) {
        window.clearTimeout(existingTimer)
      }

      const timer = window.setTimeout(() => {
        debounceTimersRef.current.delete(productId)
        syncCartUpdate(productId, quantity)
      }, CART_SYNC_DEBOUNCE_MS)

      debounceTimersRef.current.set(productId, timer)
    },
    [canSyncCart, syncCartUpdate],
  )

  useEffect(() => {
    window.localStorage.setItem("cartbehind-cart", JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (canSyncCart) return

    for (const timer of debounceTimersRef.current.values()) {
      window.clearTimeout(timer)
    }

    debounceTimersRef.current.clear()
  }, [canSyncCart])

  useEffect(() => {
    const debounceTimers = debounceTimersRef.current

    return () => {
      for (const timer of debounceTimers.values()) {
        window.clearTimeout(timer)
      }

      debounceTimers.clear()
    }
  }, [])

  useEffect(() => {
    if (!canSyncCart) return

    let cancelled = false

    async function loadServerCart() {
      try {
        const response = await axios.get(`${getBackendUrl()}/api/v1/users/cart`, {
          headers: getHeaders(),
        })
        console.log("Cart fetch response:", response.data)
        if (cancelled) return

        const serverItems = Array.isArray(response.data?.items)
          ? response.data.items.map(normalizeServerCartItem).filter(Boolean)
          : []
        const localItems = itemsRef.current
        const mergedItems = mergeCartItems(localItems, serverItems)

        applyItems(mergedItems)

        const serverIds = new Set(serverItems.map((item) => item.id))
        for (const item of mergedItems) {
          const serverItem = serverItems.find((candidate) => candidate.id === item.id)
          if (!serverIds.has(item.id)) {
            syncCartAdd(item.id, item.quantity)
          } else if (serverItem?.quantity !== item.quantity) {
            syncCartUpdate(item.id, item.quantity)
          }
        }
      } catch (error) {
        if (cancelled) return
        console.error("Failed to load saved cart.", error)
        toast.error("Could not load your saved cart.")
      }
    }

    loadServerCart()

    return () => {
      cancelled = true
    }
  }, [applyItems, canSyncCart, getHeaders, syncCartAdd, syncCartUpdate])

  const addToCart = (product) => {
    const current = itemsRef.current
    const existing = current.find((item) => item.id === product.id)
    const nextQuantity = existing ? existing.quantity + 1 : 1
    const nextItems = existing
      ? current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: nextQuantity }
            : item,
        )
      : [...current, { ...product, quantity: nextQuantity }]

    applyItems(nextItems)
    syncCartAdd(product.id, nextQuantity)
  }

  const updateQuantity = (id, quantity) => {
    const nextQuantity = Math.max(1, quantity)
    const nextItems = itemsRef.current.map((item) =>
      item.id === id ? { ...item, quantity: nextQuantity } : item,
    )

    applyItems(nextItems)
    debounceCartUpdate(id, nextQuantity)
  }

  const removeFromCart = (id) => {
    const existingTimer = debounceTimersRef.current.get(id)
    if (existingTimer) {
      window.clearTimeout(existingTimer)
      debounceTimersRef.current.delete(id)
    }

    applyItems(itemsRef.current.filter((item) => item.id !== id))
    syncCartDelete(id)
  }

  const clearCart = () => {
    const currentItems = itemsRef.current
    applyItems([])

    for (const item of currentItems) {
      syncCartDelete(item.id)
    }
  }

  const cartCount = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }

  return context
}





