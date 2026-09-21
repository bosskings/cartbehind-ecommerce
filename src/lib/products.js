const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
const DEFAULT_LIMIT = 50
const CACHE_TTL_MS = 30 * 1000 // 30 seconds fresh cache TTL

// In-memory cache state
let cachedProducts = null
let cacheTimestamp = 0
let inFlightFetchPromise = null

/**
 * Returns currently cached products synchronously if still fresh, or null if none/expired.
 */
export function getCachedProducts() {
  const isExpired = Date.now() - cacheTimestamp > CACHE_TTL_MS
  if (cachedProducts && !isExpired) {
    return cachedProducts
  }
  return null
}

/**
 * Explicitly invalidate the in-memory product cache (e.g. on admin product create/update/delete).
 */
export function clearProductCache() {
  console.log("[Products Cache] In-memory product cache cleared.")
  cachedProducts = null
  cacheTimestamp = 0
  inFlightFetchPromise = null

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event("cartbehind_products_cache_cleared"))
      window.localStorage.setItem("cartbehind_cache_cleared", String(Date.now()))
    } catch {
      // ignore
    }
  }
}

export function normalizeProduct(apiProduct) {
  const category = apiProduct.category
    ? apiProduct.category.charAt(0).toUpperCase() + apiProduct.category.slice(1)
    : ""

  // Resolve primary image URL: prioritize explicitly set image/url over nested array
  const rawUrl =
    (typeof apiProduct.url === "string" && apiProduct.url.trim() ? apiProduct.url.trim() : null) ||
    apiProduct.image?.url ||
    (typeof apiProduct.image === "string" && apiProduct.image.trim() ? apiProduct.image.trim() : null) ||
    apiProduct.images?.[0]?.url ||
    (typeof apiProduct.images?.[0] === "string" && apiProduct.images[0].trim() ? apiProduct.images[0].trim() : null) ||
    "/thumbnail.webp"

  const primaryImage = rawUrl

  // Ensure images array has primaryImage first so gallery and previews stay synchronized
  const rawImages = Array.isArray(apiProduct.images) ? [...apiProduct.images] : []
  let resolvedImages = rawImages
  if (primaryImage && primaryImage !== "/thumbnail.webp") {
    const firstUrl = rawImages[0]?.url || (typeof rawImages[0] === "string" ? rawImages[0] : null)
    if (!firstUrl) {
      resolvedImages = [{ url: primaryImage }]
    } else if (firstUrl !== primaryImage) {
      resolvedImages = [{ url: primaryImage }, ...rawImages.slice(1)]
    }
  }

  // Robust hotDeal normalization (handling boolean, string "true", or root status)
  const isHotDeal =
    apiProduct.hotDeal?.status === true ||
    apiProduct.hotDeal?.status === "true" ||
    apiProduct.status === true ||
    apiProduct.status === "true" ||
    false

  const hotDealPercent =
    Number(apiProduct.hotDeal?.percentage) ||
    Number(apiProduct.hotDeal?.discountPercent) ||
    Number(apiProduct.percentage) ||
    Number(apiProduct.discountPercent) ||
    0

  return {
    id: apiProduct.id ?? apiProduct._id,
    title: apiProduct.title ?? apiProduct.name ?? "Untitled product",
    description: apiProduct.description ?? "",
    price: apiProduct.price,
    category,
    brand: apiProduct.brand ?? category,
    stock: apiProduct.stock ?? 0,
    deliveryTime: apiProduct.deliveryTime != null ? String(apiProduct.deliveryTime) : "1",
    image: primaryImage,
    url: primaryImage,
    images: resolvedImages,
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt || apiProduct.createdAt,
    status: isHotDeal,
    hotDeal: {
      status: isHotDeal,
      percentage: hotDealPercent,
    },
    discountPercent: hotDealPercent,
  }
}

async function fetchProductsPage(page = 1, limit = DEFAULT_LIMIT) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  const response = await fetch(
    `${API_URL}/api/v1/users/products?page=${page}&limit=${limit}`,
    { cache: "no-store" },
  )

  if (!response.ok) {
    throw new Error("Failed to fetch products.")
  }

  const data = await response.json()
  const list = Array.isArray(data.products) ? data.products : []

  return {
    products: list.map(normalizeProduct),
    page: data.page ?? page,
    limit: data.limit ?? limit,
    totalPages: data.totalPages ?? data.pagination?.totalPages ?? null,
    total: data.total ?? data.pagination?.total ?? data.count ?? null,
  }
}

export async function fetchProducts({ page, limit = DEFAULT_LIMIT, forceRefresh = false } = {}) {
  // If a specific page is requested, fetch and return directly without storing full catalog
  if (page !== undefined) {
    const result = await fetchProductsPage(page, limit)
    return result.products
  }

  // 1. Check in-memory cache
  const isCacheValid = cachedProducts && (Date.now() - cacheTimestamp < CACHE_TTL_MS)
  if (isCacheValid && !forceRefresh) {
    const ageSec = Math.round((Date.now() - cacheTimestamp) / 1000)
    console.log(`[Products Cache] Cache HIT: returning ${cachedProducts.length} products (${ageSec}s old)`)
    return cachedProducts
  }

  // 2. Prevent duplicate concurrent fetches
  if (inFlightFetchPromise) {
    console.log("[Products Cache] In-flight request in progress. Awaiting existing promise...")
    return inFlightFetchPromise
  }

  console.log(`[Products Cache] ${cachedProducts ? "Cache expired" : "Cache MISS"}. Fetching catalog (limit=${limit})...`)

  inFlightFetchPromise = (async () => {
    try {
      const startTime = Date.now()
      // First page with higher batch limit (50)
      const firstPage = await fetchProductsPage(1, limit)
      const allProducts = [...firstPage.products]
      const totalPages = firstPage.totalPages || 1

      // Parallelize any remaining pages instead of slow sequential while() loop
      if (totalPages > 1) {
        console.log(`[Products API] Catalog has ${totalPages} pages. Fetching pages 2..${totalPages} in parallel...`)
        const pagePromises = []
        for (let p = 2; p <= totalPages; p++) {
          pagePromises.push(fetchProductsPage(p, limit))
        }
        const remainingPages = await Promise.all(pagePromises)
        for (const pageRes of remainingPages) {
          allProducts.push(...pageRes.products)
        }
      }

      cachedProducts = allProducts
      cacheTimestamp = Date.now()
      const durationMs = Date.now() - startTime
      console.log(`[Products Cache] Cache populated: ${allProducts.length} products fetched in ${durationMs}ms.`)

      return allProducts
    } catch (err) {
      console.error("[Products API] Error loading products:", err)
      if (cachedProducts) {
        console.warn("[Products Cache] Fallback to stale cached products after network error.")
        return cachedProducts
      }
      throw err
    } finally {
      inFlightFetchPromise = null
    }
  })()

  return inFlightFetchPromise
}

/**
 * Fast product lookup by ID.
 * Returns immediately (0ms) if product is already cached in memory.
 */
export async function fetchProductById(id) {
  if (!id) return null

  // Check cache first
  if (cachedProducts && cachedProducts.length > 0) {
    const found = cachedProducts.find((p) => String(p.id) === String(id))
    if (found) {
      console.log(`[Products Cache] fetchProductById("${id}") resolved from in-memory cache instantly.`)
      return found
    }
  }

  // If not cached, fetch all and search
  console.log(`[Products Cache] fetchProductById("${id}") cache miss, warming product catalog...`)
  const products = await fetchProducts()
  return products.find((p) => String(p.id) === String(id)) || null
}

export async function searchProducts(query) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  const response = await fetch(
    `${API_URL}/api/v1/users/products/search?search=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  )

  if (!response.ok) {
    throw new Error("Failed to search products.")
  }

  const data = await response.json()
  const list = Array.isArray(data.products)
    ? data.products
    : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : []

  return list.map(normalizeProduct)
}

export function groupProductsByCategory(products) {
  const groups = new Map()

  for (const product of products) {
    const category = product.category || "Other"
    if (!groups.has(category)) {
      groups.set(category, [])
    }
    groups.get(category).push(product)
  }

  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    products: items,
  }))
}

export function normalizeCategory(apiCategory) {
  const name = apiCategory.name || apiCategory.category || apiCategory.title || "Untitled category"
  const image =
    apiCategory.image?.url ||
    apiCategory.image?.secure_url ||
    (typeof apiCategory.image === "string" ? apiCategory.image : null) ||
    apiCategory.url ||
    apiCategory.imageUrl ||
    "/thumbnail.webp"

  return {
    id: apiCategory._id || apiCategory.id || name,
    name,
    image,
    publicId: apiCategory.image?.publicId || apiCategory.image?.public_id || "",
    fileType: apiCategory.image?.fileType || apiCategory.image?.format || "",
    createdAt: apiCategory.createdAt || "",
    updatedAt: apiCategory.updatedAt || "",
  }
}

export async function fetchProductCategories({ token } = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  let response = await fetch(`${API_URL}/api/v1/admin/categories`, {
    cache: "no-store",
    headers,
  })

  if (!response.ok && (response.status === 404 || response.status === 401)) {
    try {
      const userRes = await fetch(`${API_URL}/api/v1/users/categories`, {
        cache: "no-store",
        headers,
      })
      if (userRes.ok) {
        response = userRes
      }
    } catch {
      // keep original
    }
  }

  if (!response.ok) {
    const error = new Error("Failed to fetch categories.")
    error.status = response.status
    throw error
  }

  const data = await response.json()
  const list = Array.isArray(data.categories)
    ? data.categories
    : Array.isArray(data.category)
      ? data.category
      : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : []

  return list.map(normalizeCategory)
}

export async function fetchAdminProducts({ token } = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  console.log("[Admin API] Fetching:", `${API_URL}/api/v1/admin/products`, { hasToken: Boolean(token) })
  const response = await fetch(`${API_URL}/api/v1/admin/products`, {
    cache: "no-store",
    headers,
  })
  console.log("[Admin API] GET /api/v1/admin/products response status:", response.status)

  if (!response.ok) {
    const error = new Error("Failed to fetch admin products.")
    error.status = response.status
    throw error
  }

  const data = await response.json()
  console.log("[Admin API] GET /api/v1/admin/products payload:", data)

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.data)
        ? data.data
        : []

  return {
    products: list.map(normalizeProduct),
    totalPages: data.totalPages ?? data.pagination?.totalPages ?? null,
    total: data.total ?? data.pagination?.total ?? data.count ?? list.length,
    raw: data,
  }
}

export async function searchAdminProducts(query, { token } = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const searchUrl = `${API_URL}/api/v1/admin/products/search?search=${encodeURIComponent(query)}`

  console.log("[Admin API] Searching:", searchUrl, { hasToken: Boolean(token) })
  const response = await fetch(searchUrl, {
    cache: "no-store",
    headers,
  })
  console.log(`[Admin API] GET /api/v1/admin/products/search?search=${query} status:`, response.status)

  if (!response.ok) {
    const error = new Error("Failed to search admin products.")
    error.status = response.status
    throw error
  }

  const data = await response.json()
  console.log(`[Admin API] GET /api/v1/admin/products/search?search=${query} payload:`, data)

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.data)
        ? data.data
        : []

  return list.map(normalizeProduct)
}