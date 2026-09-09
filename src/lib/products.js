const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
const DEFAULT_LIMIT = 10

export function normalizeProduct(apiProduct) {
  const category = apiProduct.category
    ? apiProduct.category.charAt(0).toUpperCase() + apiProduct.category.slice(1)
    : ""

  const primaryImage =
    apiProduct.images?.[0]?.url ||
    (typeof apiProduct.images?.[0] === "string" ? apiProduct.images[0] : null) ||
    apiProduct.image?.url ||
    (typeof apiProduct.image === "string" ? apiProduct.image : null) ||
    apiProduct.url ||
    "/thumbnail.webp"

  return {
    id: apiProduct._id,
    title: apiProduct.name,
    description: apiProduct.description ?? "",
    price: apiProduct.price,
    category,
    brand: category,
    stock: apiProduct.stock ?? 0,
    image: primaryImage,
    images: Array.isArray(apiProduct.images) ? apiProduct.images : [],
    createdAt: apiProduct.createdAt,
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

export async function fetchProducts({ page, limit = DEFAULT_LIMIT } = {}) {
  if (page !== undefined) {
    const result = await fetchProductsPage(page, limit)
    return result.products
  }

  const allProducts = []
  let currentPage = 1

  while (true) {
    const result = await fetchProductsPage(currentPage, limit)
    allProducts.push(...result.products)

    if (result.totalPages && currentPage >= result.totalPages) {
      break
    }

    if (result.total && allProducts.length >= result.total) {
      break
    }

    if (result.products.length < limit) {
      break
    }

    if (result.products.length === 0) {
      break
    }

    currentPage += 1
  }

  return allProducts
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
  const name = apiCategory.name || apiCategory.category || "Untitled category"
  const image = apiCategory.image?.url || apiCategory.image?.secure_url || apiCategory.image || "/thumbnail.webp"

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

  const response = await fetch(`${API_URL}/api/v1/admin/categories`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

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
      : Array.isArray(data)
        ? data
        : []

  return list.map(normalizeCategory)
}