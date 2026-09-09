"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  ChevronRight,
  Edit3,
  Image as ImageIcon,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  PackagePlus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sun,
  Truck,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react"
import { useTheme } from "@/components/ThemeContext"
import { useAuth } from "@/components/AuthContext"
import TransitEditorModal from "@/components/admin/TransitEditorModal"
import TransitDetailsModal from "@/components/admin/TransitDetailsModal"
import MultiImageUpload from "@/components/admin/MultiImageUpload"
import UsersSection from "@/components/admin/UsersSection"
import { Field, inputClass } from "@/components/admin/formUi"
import { formatOrderDate } from "@/components/admin/transitUtils"
import { getAdminToken, uploadToCloudinary } from "@/lib/cloudinary"
import { fetchAdminOrders, fetchAdminOverview, getApiErrorMessage, isAdminAuthError } from "@/lib/orders"
import { fetchProductCategories, fetchProducts, normalizeCategory } from "@/lib/products"
import { fetchAdminUsers } from "@/lib/adminUsers"
import { ADMIN_LOGIN_PATH } from "@/lib/adminRoutes"

const createEmptyImageSlot = () => ({
  file: null,
  preview: "",
  url: "",
  publicID: "",
  fileType: "",
})

const createEmptyForm = () => ({
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "",
  deliveryTime: "1",
  images: [createEmptyImageSlot(), createEmptyImageSlot(), createEmptyImageSlot()],
})

const emptyForm = createEmptyForm()

const sections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "upload", label: "Upload Product", icon: PackagePlus },
  { id: "categoryImages", label: "Category Images", icon: ImageIcon },
  { id: "products", label: "Products", icon: Boxes },
  { id: "users", label: "Users", icon: Users },
]


const RECENT_PRODUCTS_LIMIT = 5

function normalizeProduct(product, index = 0) {
  const primaryImage =
    product.images?.[0]?.url ||
    (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
    product.image?.url ||
    (typeof product.image === "string" ? product.image : null) ||
    product.url ||
    "/thumbnail.webp"

  return {
    id: product.id ?? product._id ?? Date.now() + index,
    brand: product.brand || product.category || "CartBehind",
    title: product.title || product.name || "Untitled product",
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || 0,
    discountPercent: Number(product.discountPercent) || 0,
    image: primaryImage,
    images: Array.isArray(product.images) ? product.images : [],
    category: product.category || "General",
    description: product.description || "",
    tags: product.tags || [],
    stock: Number(product.stock) || 0,
    deliveryTime: product.deliveryTime != null ? String(product.deliveryTime) : "1",
    createdAt: product.createdAt || product.created_at || "",
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-NG").format(value)
}

function formatNaira(value) {
  return `NGN ${formatNumber(Number(value) || 0)}`
}

function formatOverviewValue(value, overview, loading) {
  return loading ? "..." : overview ? formatNumber(value) : "--"
}

function ProductImage({ src, title }) {
  return (
    <div
      className="h-12 w-12 shrink-0 rounded-xl border border-black/5 bg-gray-100 bg-cover bg-center dark:border-white/10 dark:bg-white/10"
      style={{ backgroundImage: `url("${src || "/thumbnail.webp"}")` }}
      aria-label={title}
      role="img"
    />
  )
}

function ImageUploadField({ label, preview, onFileSelect }) {
  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.")
      event.target.value = ""
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Please choose an image under 3MB.")
      event.target.value = ""
      return
    }

    const previewUrl = URL.createObjectURL(file)
    onFileSelect(file, previewUrl)
    event.target.value = ""
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <label className="flex min-h-36 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-white p-4 transition hover:border-(--theme) hover:bg-[#f7f5fb] dark:border-white/15 dark:bg-[#12101a] dark:hover:bg-white/5">
        <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
        <span
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-[#f7f5fb] bg-cover bg-center text-(--theme) dark:border-white/10 dark:bg-[#16131f]"
          style={preview ? { backgroundImage: `url("${preview}")` } : undefined}
        >
          {!preview && <ImagePlus size={24} />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black text-gray-800 dark:text-gray-100">
            {preview ? "Change product image" : "Choose product image"}
          </span>
        </span>
      </label>
    </div>
  )
}

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("overview")
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingImageFile, setEditingImageFile] = useState(null)
  const [productPendingDelete, setProductPendingDelete] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState("")
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overviewError, setOverviewError] = useState("")
  const [transitEditorOrder, setTransitEditorOrder] = useState(null)
  const [transitDetailsOrder, setTransitDetailsOrder] = useState(null)
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState(null)
  const [isUploadingAllImages, setIsUploadingAllImages] = useState(false)
  const [isUploadingProduct, setIsUploadingProduct] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState(null)
  const [query, setQuery] = useState("")
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState("")
  const [categoryImages, setCategoryImages] = useState({})
  const [uploadingCategoryId, setUploadingCategoryId] = useState(null)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme, mounted } = useTheme()
  const { logoutAdmin } = useAuth()
  const router = useRouter()

  const redirectToAdminLogin = useCallback(() => {
    logoutAdmin()
    router.replace(ADMIN_LOGIN_PATH)
  }, [logoutAdmin, router])

  const loadOrders = useCallback(async () => {
    const token = getAdminToken()
    if (!token) {
      redirectToAdminLogin()
      return
    }

    setOrdersLoading(true)
    setOrdersError("")
    try {
      setOrders(await fetchAdminOrders(token))
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      setOrdersError(getApiErrorMessage(error, "Could not load admin orders."))
    } finally {
      setOrdersLoading(false)
    }
  }, [redirectToAdminLogin])

  const loadOverview = useCallback(async () => {
    const token = getAdminToken()
    if (!token) {
      redirectToAdminLogin()
      return
    }

    setOverviewLoading(true)
    setOverviewError("")
    try {
      setOverview(await fetchAdminOverview(token))
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      setOverviewError(getApiErrorMessage(error, "Could not load admin overview."))
    } finally {
      setOverviewLoading(false)
    }
  }, [redirectToAdminLogin])

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    setProductsError("")
    try {
      const backendProducts = await fetchProducts()
      setProducts(backendProducts.map(normalizeProduct))
    } catch (error) {
      setProducts([])
      setProductsError(error.message || "Could not load products.")
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    const token = getAdminToken()
    if (!token) {
      redirectToAdminLogin()
      return
    }

    setCategoriesLoading(true)
    setCategoriesError("")
    try {
      setCategories(await fetchProductCategories({ token }))
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      setCategories([])
      setCategoriesError(error.message || "Could not load categories.")
    } finally {
      setCategoriesLoading(false)
    }
  }, [redirectToAdminLogin])

  const loadUsers = useCallback(async () => {
    const token = getAdminToken()
    if (!token) {
      redirectToAdminLogin()
      return
    }

    setUsersLoading(true)
    setUsersError("")
    try {
      const data = await fetchAdminUsers(token)
      setUsers(data)
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      setUsersError(getApiErrorMessage(error, "Could not load users."))
    } finally {
      setUsersLoading(false)
    }
  }, [redirectToAdminLogin])

  const handleUserBlocked = useCallback((userId) => {
    setUsers((current) =>
      current.map((u) => (u.id === userId ? { ...u, active: false } : u))
    )
  }, [])

  const closeTransitEditor = useCallback(() => setTransitEditorOrder(null), [])
  const closeTransitDetails = useCallback(() => setTransitDetailsOrder(null), [])

  useEffect(() => {
    if (activeSection !== "overview") return undefined
    const timer = window.setTimeout(loadOverview, 0)
    return () => window.clearTimeout(timer)
  }, [activeSection, loadOverview])

  useEffect(() => {
    if (activeSection !== "orders") return undefined
    const timer = window.setTimeout(loadOrders, 0)
    return () => window.clearTimeout(timer)
  }, [activeSection, loadOrders])

  useEffect(() => {
    if (activeSection !== "overview" && activeSection !== "products") return undefined
    const timer = window.setTimeout(loadProducts, 0)
    return () => window.clearTimeout(timer)
  }, [activeSection, loadProducts])

  useEffect(() => {
    if (activeSection !== "upload" && activeSection !== "categoryImages") return undefined
    const timer = window.setTimeout(loadCategories, 0)
    return () => window.clearTimeout(timer)
  }, [activeSection, loadCategories])

  useEffect(() => {
    if (activeSection !== "users") return undefined
    const timer = window.setTimeout(loadUsers, 0)
    return () => window.clearTimeout(timer)
  }, [activeSection, loadUsers])

  const uploadedImages = useMemo(
    () => form.images.filter((img) => Boolean(img.url && (img.publicID || img.publicId))),
    [form.images],
  )
  const hasUploadedImage = uploadedImages.length > 0
  const pendingImagesCount = useMemo(
    () => form.images.filter((img) => Boolean(img.file && (!img.url || !(img.publicID || img.publicId)))).length,
    [form.images],
  )

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: formatOverviewValue(overview?.totalUsers, overview, overviewLoading),
        meta: "Registered users",
        icon: Users,
        tone: "bg-[#280E89]/10 text-(--theme)",
      },
      {
        label: "Products",
        value: formatOverviewValue(overview?.totalProducts, overview, overviewLoading),
        meta: "Products in catalog",
        icon: ShoppingBag,
        tone: "bg-yellow-200 text-[#280E89]",
      },
      {
        label: "Total Orders",
        value: formatOverviewValue(overview?.totalOrders, overview, overviewLoading),
        meta: overview
          ? `${formatNumber(overview.totalOrdersPending)} pending, ${formatNumber(overview.totalOrdersDelivered)} delivered`
          : overviewLoading ? "Loading overview..." : "Overview unavailable",
        icon: PackageCheck,
        tone: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Total Transits",
        value: formatOverviewValue(overview?.totalTransits, overview, overviewLoading),
        meta: overview
          ? `${formatNumber(overview.totalTransitsInTransit)} currently in transit`
          : overviewLoading ? "Loading overview..." : "Overview unavailable",
        icon: Truck,
        tone: "bg-blue-100 text-blue-700",
      },
    ],
    [overview, overviewLoading],
  )


  const recentProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, RECENT_PRODUCTS_LIMIT),
    [products],
  )

  const productCategories = useMemo(() => {
    const counts = new Map()
    for (const product of products) {
      const category = product.category || "General"
      counts.set(category, (counts.get(category) || 0) + 1)
    }

    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }))
  }, [products])
  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return products

    return products.filter((product) =>
      [product.title, product.brand, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    )
  }, [products, query])

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return orders
    return orders.filter((order) => {
      const userEmail =
        order.email ||
        order.userEmail ||
        (order.userId && users.find((u) => String(u.id || u._id) === String(order.userId))?.email) ||
        ""
      return [order.id, order.userId, userEmail, order.deliveryStatus, order.paymentStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [orders, query, users])

  const getOrderUserEmail = (order) => {
    if (order.email) return order.email
    if (order.userEmail) return order.userEmail
    if (order.customerEmail) return order.customerEmail
    if (order.userId) {
      if (typeof order.userId === "string" && order.userId.includes("@")) return order.userId
      const matchedUser = users.find((u) => String(u.id || u._id) === String(order.userId))
      if (matchedUser?.email) return matchedUser.email
    }
    return order.userId || `Order #${order.id}`
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateEditingProduct = (field, value) => {
    setEditingProduct((current) => ({ ...current, [field]: value }))
  }

  const isUploadingImage = uploadingSlotIndex !== null || isUploadingAllImages

  const handleSelectSlotImage = (index, file, previewUrl) => {
    setForm((current) => {
      const newImages = [...current.images]
      newImages[index] = {
        file,
        preview: previewUrl,
        url: "",
        publicID: "",
        publicId: "",
        public_id: "",
        fileType: "",
      }
      return { ...current, images: newImages }
    })
  }

  const handleRemoveSlotImage = (index) => {
    setForm((current) => {
      const newImages = [...current.images]
      newImages[index] = createEmptyImageSlot()
      return { ...current, images: newImages }
    })
  }

  const handleUploadSlot = async (index) => {
    const slot = form.images[index]
    if (!slot?.file) {
      toast.error("Please choose an image for this slot first.")
      return
    }

    setUploadingSlotIndex(index)
    try {
      const data = await uploadToCloudinary(slot.file)
      setForm((current) => {
        const newImages = [...current.images]
        newImages[index] = {
          ...newImages[index],
          url: data.secure_url || data.url || "",
          publicID: data.public_id || "",
          publicId: data.public_id || "",
          public_id: data.public_id || "",
          fileType: data.format || "",
          preview: data.secure_url || data.url || newImages[index].preview,
        }
        return { ...current, images: newImages }
      })
      toast.success(`Image ${index + 1} uploaded successfully.`)
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      toast.error(error.message || `Failed to upload image ${index + 1}. Please try again.`)
    } finally {
      setUploadingSlotIndex(null)
    }
  }

  const handleUploadAllPendingImages = async () => {
    const pendingSlots = form.images
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot.file && (!slot.url || !(slot.publicID || slot.publicId)))

    if (pendingSlots.length === 0) {
      toast.error("No pending images to upload.")
      return
    }

    setIsUploadingAllImages(true)
    let count = 0

    try {
      for (const { slot, index } of pendingSlots) {
        setUploadingSlotIndex(index)
        const data = await uploadToCloudinary(slot.file)
        setForm((current) => {
          const newImages = [...current.images]
          newImages[index] = {
            ...newImages[index],
            url: data.secure_url || data.url || "",
            publicID: data.public_id || "",
            publicId: data.public_id || "",
            public_id: data.public_id || "",
            fileType: data.format || "",
            preview: data.secure_url || data.url || newImages[index].preview,
          }
          return { ...current, images: newImages }
        })
        count++
      }
      toast.success(`Uploaded ${count} image${count > 1 ? "s" : ""} to Cloudinary.`)
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      toast.error(error.message || "Image upload failed. Please try again.")
    } finally {
      setUploadingSlotIndex(null)
      setIsUploadingAllImages(false)
    }
  }

  const handleUploadProduct = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
      toast.error("Please fill in name, description, and category.")
      return
    }

    if (!Number(form.price) || Number(form.price) <= 0) {
      toast.error("Please enter a valid product price.")
      return
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      toast.error("Please enter a valid stock amount.")
      return
    }

    if (!form.deliveryTime) {
      toast.error("Please select a delivery time.")
      return
    }

    const payloadImages = form.images
      .filter((img) => Boolean(img.url && (img.publicID || img.publicId)))
      .map((img) => {
        const pid = img.publicID || img.publicId || img.public_id || ""
        return {
          url: img.url,
          publicID: pid,
          publicId: pid,
          public_id: pid,
          fileType: img.fileType || "jpg",
        }
      })

    if (payloadImages.length === 0) {
      toast.error("Please upload at least one product image first.")
      return
    }

    if (pendingImagesCount > 0) {
      toast.error("You have selected image(s) that are not yet uploaded. Please click 'Upload all pending' first.")
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
    const token = getAdminToken()

    if (!API_URL) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing.")
      return
    }

    if (!token) {
      redirectToAdminLogin()
      return
    }

    setIsUploadingProduct(true)

    const primaryImage = payloadImages[0] || {}
    const requestBody = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      stock: Number(form.stock),
      deliveryTime: String(form.deliveryTime),
      images: payloadImages,
      url: primaryImage.url || "",
      publicId: primaryImage.publicId || "",
      publicID: primaryImage.publicID || "",
      fileType: primaryImage.fileType || "",
    }

    console.log("Submitting /admin/upload-item payload:", requestBody)

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/upload-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log("Response from /admin/upload-item:", data)

      if (!response.ok) {
        const error = new Error(data?.message || "Product upload failed.")
        error.status = response.status
        throw error
      }

      setForm(createEmptyForm())
      toast.success(data?.message || "Product uploaded successfully.")
      await loadProducts()
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      toast.error(error.message || "Product upload failed. Please try again.")
    } finally {
      setIsUploadingProduct(false)
    }
  }

  const handleRefreshProducts = () => {
    loadProducts()
  }

  const requestDeleteProduct = (product) => {
    if (!product?.id) return
    setProductPendingDelete(product)
  }

  const closeDeleteProductModal = () => {
    if (deletingProductId) return
    setProductPendingDelete(null)
  }

  const handleDeleteProduct = async () => {
    const product = productPendingDelete
    if (!product?.id) return

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
    const token = getAdminToken()

    if (!API_URL) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing.")
      return
    }

    if (!token) {
      redirectToAdminLogin()
      return
    }

    setDeletingProductId(product.id)

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/delete-item/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const error = new Error(data?.message || "Product delete failed.")
        error.status = response.status
        throw error
      }

      setProducts((current) => current.filter((item) => item.id !== product.id))
      setProductPendingDelete(null)
      toast.success(data?.message || "Product deleted successfully.")
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      toast.error(error.message || "Product delete failed. Please try again.")
    } finally {
      setDeletingProductId(null)
    }
  }

  const handleCategoryImageChange = (category, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      event.target.value = ""
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setCategoryImages((current) => ({
      ...current,
      [category.id]: { file, preview: previewUrl },
    }))
    event.target.value = ""
  }

  const handleUploadCategoryImage = async (category) => {
    const selectedImage = categoryImages[category.id]
    if (!selectedImage?.file) return

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
    const token = getAdminToken()

    if (!API_URL) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing.")
      return
    }

    if (!token) {
      redirectToAdminLogin()
      return
    }

    setUploadingCategoryId(category.id)

    try {
      const uploaded = await uploadToCloudinary(selectedImage.file)
      const response = await fetch(`${API_URL}/api/v1/admin/update-category-img/${encodeURIComponent(category.id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: category.name,
          url: uploaded.secure_url || uploaded.url || "",
          publicId: uploaded.public_id || "",
          fileType: uploaded.format || "",
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const error = new Error(data?.message || "Category image upload failed.")
        error.status = response.status
        throw error
      }

      const updatedCategory = data?.category ? normalizeCategory(data.category) : {
        ...category,
        image: uploaded.secure_url || uploaded.url || selectedImage.preview,
        publicId: uploaded.public_id || "",
        fileType: uploaded.format || "",
      }

      setCategories((current) =>
        current.map((item) => (item.id === category.id ? updatedCategory : item)),
      )
      setCategoryImages((current) => {
        const next = { ...current }
        delete next[category.id]
        return next
      })
      toast.success(data?.message || "Category image updated successfully.")
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      toast.error(error.message || "Category image upload failed. Please try again.")
    } finally {
      setUploadingCategoryId(null)
    }
  }
  const openEditProduct = (product) => {
    setEditingImageFile(null)
    setEditingProduct(product)
  }

  // const handleSaveEdit = async (event) => {
  //   event.preventDefault()
  //   if (!editingProduct) return

  //   if (!editingProduct.title.trim()) {
  //     toast.error("Please enter a product name.")
  //     return
  //   }

  //   if (!Number(editingProduct.price) || Number(editingProduct.price) <= 0) {
  //     toast.error("Please enter a valid product price.")
  //     return
  //   }

  //   setIsUploadingProduct(true)

  //   try {
  //     let imageUrl = editingProduct.image

  //     if (editingImageFile) {
  //       const data = await uploadToCloudinary(editingImageFile)
  //       imageUrl = data.secure_url || data.url
  //     }

  //     const updatedProduct = normalizeProduct({
  //       ...editingProduct,
  //       image: imageUrl,
  //     })

  //     setProducts((current) =>
  //       current.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
  //     )
  //     setEditingProduct(null)
  //     setEditingImageFile(null)
  //     toast.success("Product updated successfully.")
  //   } catch (error) {
  //     if (isAdminAuthError(error)) {
  //       redirectToAdminLogin()
  //       return
  //     }
  //     toast.error(error.message || "Image upload failed. Please try again.")
  //   } finally {
  //     setIsUploadingProduct(false)
  //   }
  // }

  const handleSaveEdit = async (event) => {
    event.preventDefault()
    if (!editingProduct) return

    if (!editingProduct.title.trim()) {
      toast.error("Please enter a product name.")
      return
    }

    if (!Number(editingProduct.price) || Number(editingProduct.price) <= 0) {
      toast.error("Please enter a valid product price.")
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
    const token = getAdminToken()

    if (!API_URL) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing.")
      return
    }

    if (!token) {
      redirectToAdminLogin()
      return
    }

    setIsUploadingProduct(true)

    try {
      let imageUrl = editingProduct.image
      let publicId = editingProduct.publicId || ""
      let fileType = editingProduct.fileType || ""

      if (editingImageFile) {
        const uploaded = await uploadToCloudinary(editingImageFile)
        imageUrl = uploaded.secure_url || uploaded.url || imageUrl
        publicId = uploaded.public_id || publicId
        fileType = uploaded.format || fileType
      }

      const response = await fetch(
        `${API_URL}/api/v1/admin/update-item/${encodeURIComponent(editingProduct.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editingProduct.title.trim(),
            description: editingProduct.description || "",
            price: Number(editingProduct.price),
            category: editingProduct.category || "",
            stock: Number(editingProduct.stock) || 0,
            deliveryTime: String(editingProduct.deliveryTime || "1"),
            url: imageUrl,
            publicId,
            fileType,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const error = new Error(data?.message || "Product update failed.")
        error.status = response.status
        throw error
      }

      const updatedProduct = normalizeProduct(
        data?.product ? data.product : { ...editingProduct, image: imageUrl, publicId, fileType }
      )

      setProducts((current) =>
        current.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
      )
      setEditingProduct(null)
      setEditingImageFile(null)
      toast.success(data?.message || "Product updated successfully.")
    } catch (error) {
      if (isAdminAuthError(error)) {
        redirectToAdminLogin()
        return
      }
      toast.error(error.message || "Product update failed. Please try again.")
    } finally {
      setIsUploadingProduct(false)
    }
  }



  const isDark = mounted && theme === "dark"
  const isBusy = isUploadingImage || isUploadingProduct

  const handleAdminLogout = () => {
    logoutAdmin()
    toast.success("Admin logged out successfully.")
    router.replace(ADMIN_LOGIN_PATH)
  }

  return (
    <main className="min-h-screen bg-[#f7f5fb] text-gray-950 dark:bg-background dark:text-white">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close admin menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 cursor-pointer bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-black/5 bg-white/95 shadow-[18px_0_60px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-[#16131f]/95 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-black/5 px-6 dark:border-white/10">
          <Link href="/" className="flex cursor-pointer items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--theme) text-(--theme-second)">
              <ShoppingBag size={21} />
            </span>
            <span>
              <span className="block text-lg font-black leading-none tracking-tight">CartBehind</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Admin Studio</span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setSidebarOpen(false)}
            className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {sections.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveSection(section.id)
                  setSidebarOpen(false)
                }}
                className={`flex h-12 w-full cursor-pointer items-center justify-between rounded-xl px-4 text-sm font-bold transition ${active
                  ? "bg-(--theme) text-(--theme-second)"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                  }`}
              >
                <span className="flex cursor-pointer items-center gap-3">
                  <Icon size={18} />
                  {section.label}
                </span>
                {active && <ChevronRight size={17} />}
              </button>
            )
          })}
        </nav>

        <div className="grid grid-cols-2 gap-2 border-t border-black/5 p-4 dark:border-white/10">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={handleAdminLogout}
            aria-label="Logout admin"
            title="Logout"
            className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <section className="relative min-h-screen lg:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f5fb]/85 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-background/85 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex cursor-pointer items-center gap-3">
              <button
                type="button"
                aria-label="Open admin menu"
                onClick={() => setSidebarOpen(true)}
                className="cursor-pointer rounded-full bg-white p-2 text-gray-700 shadow-sm dark:bg-[#16131f] dark:text-gray-200 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--theme)">Admin Dashboard</p>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {sections.find((section) => section.id === activeSection)?.label}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white px-4 py-2 text-sm font-semibold text-gray-500 shadow-sm dark:border-white/10 dark:bg-[#16131f] dark:text-gray-300 sm:flex">
              <BarChart3 size={16} className="text-(--theme)" />
              Mock admin workspace
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 overflow-hidden px-4 py-6 max-[390px]:px-3 sm:px-6 lg:px-8">
          {activeSection === "overview" && (
            <>
              {overviewError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {overviewError}
                </div>
              )}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  const isClickable = stat.label === "Total Users"
                  return (
                    <article
                      key={stat.label}
                      onClick={isClickable ? () => setActiveSection("users") : undefined}
                      className={`min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] max-[390px]:p-4 dark:border-white/10 dark:bg-[#16131f] ${
                        isClickable ? "cursor-pointer transition hover:border-(--theme)/50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{stat.label}</p>
                          <p className="mt-3 text-3xl font-black tracking-tight">{stat.value}</p>
                        </div>
                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                          <Icon size={22} />
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-medium text-gray-400">
                        {stat.meta} {isClickable && "· Click to manage"}
                      </p>
                    </article>
                  )
                })}
              </section>

              <section className="grid min-w-0 gap-6 max-[390px]:gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] max-[390px]:p-4 dark:border-white/10 dark:bg-[#16131f]">
                  <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3 max-[390px]:mb-4 max-[390px]:gap-2">
                    <div>
                      <h2 className="text-xl font-black max-[390px]:text-lg">Catalog Overview</h2>
                      <p className="text-sm text-gray-500 max-[390px]:text-xs dark:text-gray-400">A quick read on the live product catalog.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection("upload")}
                      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-(--theme) px-4 text-sm font-bold text-(--theme-second) transition hover:opacity-90 max-[390px]:h-9 max-[390px]:px-3 max-[390px]:text-xs"
                    >
                      <UploadCloud size={16} />
                      Upload
                    </button>
                  </div>

                  {productsLoading ? (
                    <p className="rounded-xl bg-[#f7f5fb] px-4 py-6 text-center text-sm text-gray-500 dark:bg-[#12101a]">Loading products...</p>
                  ) : productsError ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
                      <span>{productsError}</span>
                      <button type="button" onClick={loadProducts} className="font-bold underline">Try again</button>
                    </div>
                  ) : productCategories.length ? (
                    <div className="grid min-w-0 gap-3 max-[390px]:gap-2 sm:grid-cols-3">
                      {productCategories.slice(0, 6).map(({ category, count }) => (
                        <div key={category} className="min-w-0 rounded-xl bg-[#f7f5fb] p-4 max-[390px]:p-3 dark:bg-[#12101a]">
                          <p className="truncate text-sm font-bold max-[390px]:text-xs">{category}</p>
                          <p className="mt-2 text-2xl font-black text-(--theme) max-[390px]:text-xl">{count}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-[#f7f5fb] px-4 py-6 text-center text-sm text-gray-500 dark:bg-[#12101a]">No products available yet.</p>
                  )}
                </div>

                <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] max-[390px]:p-4 dark:border-white/10 dark:bg-[#16131f]">
                  <h2 className="text-xl font-black max-[390px]:text-lg">Recent Products</h2>
                  <div className="mt-5 min-w-0 space-y-3 max-[390px]:mt-4 max-[390px]:space-y-2">
                    {productsLoading ? (
                      <p className="rounded-xl bg-[#f7f5fb] px-4 py-6 text-center text-sm text-gray-500 dark:bg-[#12101a]">Loading products...</p>
                    ) : productsError ? (
                      <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
                        <span>{productsError}</span>
                        <button type="button" onClick={handleRefreshProducts} className="font-bold underline">Try again</button>
                      </div>
                    ) : recentProducts.length ? (
                      recentProducts.map((product) => (
                        <div key={product.id} className="flex min-w-0 items-center gap-3 overflow-hidden rounded-xl bg-[#f7f5fb] p-3 max-[390px]:gap-2 max-[390px]:p-2 dark:bg-[#12101a]">
                          <ProductImage src={product.image} title={product.title} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{product.title}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{formatNaira(product.price)}</p>
                          </div>
                          <CheckCircle2 size={17} className="shrink-0 text-emerald-500" />
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl bg-[#f7f5fb] px-4 py-6 text-center text-sm text-gray-500 dark:bg-[#12101a]">No products available yet.</p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {activeSection === "orders" && (
            <section className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black">Recent Orders</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage delivery transit using backend order IDs.</p>
                </div>
                <div className="flex w-full gap-2 lg:w-auto">
                  <div className="relative min-w-0 flex-1 lg:w-80">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search orders..."
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f5fb] pl-10 pr-4 text-sm outline-none transition focus:border-(--theme) dark:border-white/10 dark:bg-[#12101a]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadOrders}
                    disabled={ordersLoading}
                    aria-label="Refresh orders"
                    title="Refresh orders"
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-300"
                  >
                    <RefreshCw size={17} className={ordersLoading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {ordersLoading && <p className="rounded-xl bg-[#f7f5fb] px-4 py-8 text-center text-sm text-gray-500 dark:bg-[#12101a]">Loading orders...</p>}
              {ordersError && (
                <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>{ordersError}</span>
                  <button type="button" onClick={loadOrders} className="font-bold underline">Try again</button>
                </div>
              )}
              {!ordersLoading && !ordersError && !filteredOrders.length && (
                <p className="rounded-xl bg-[#f7f5fb] px-4 py-8 text-center text-sm text-gray-500 dark:bg-[#12101a]">No orders found.</p>
              )}

              {!ordersLoading && !ordersError && filteredOrders.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/10">
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-[#f7f5fb] text-xs uppercase tracking-[0.16em] text-gray-500 dark:bg-[#12101a] dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-4">Order</th>
                          <th className="px-4 py-4">Purchase date</th>
                          <th className="px-4 py-4">Payment</th>
                          <th className="px-4 py-4">Delivery</th>
                          <th className="px-4 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-4">
                              <p className="font-bold text-gray-900 dark:text-white truncate max-w-xs">{getOrderUserEmail(order)}</p>
                              <p className="mt-1 text-xs text-gray-500 font-mono">Order #{order.id}</p>
                            </td>
                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{formatOrderDate(order.datePurchased)}</td>
                            <td className="px-4 py-4 font-semibold">{order.paymentStatus || "Unknown"}</td>
                            <td className="px-4 py-4 font-semibold">{order.deliveryStatus || "PENDING"}</td>
                            <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setTransitEditorOrder(order)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-bold text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200">
                                <Truck size={16} />Create transit
                              </button>
                              <button type="button" onClick={() => setTransitDetailsOrder(order)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-(--theme) px-3 text-sm font-bold text-(--theme-second) transition hover:opacity-90"><Search size={16} />View transit details
                              </button>
                            </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-3 p-3 lg:hidden">
                    {filteredOrders.map((order) => (
                      <article key={order.id} className="rounded-xl border border-gray-100 bg-[#f7f5fb] p-4 dark:border-white/10 dark:bg-[#12101a]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-900 dark:text-white">{getOrderUserEmail(order)}</p>
                            <p className="mt-1 text-xs text-gray-500 font-mono">Order #{order.id}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800">{order.deliveryStatus || "PENDING"}</span>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">{formatOrderDate(order.datePurchased)}</p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setTransitEditorOrder(order)} className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 dark:border-white/10 dark:text-gray-200"><Truck size={16} />Create transit</button><button type="button" onClick={() => setTransitDetailsOrder(order)} className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--theme) text-sm font-bold text-(--theme-second)"><Search size={16} />View details</button></div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === "upload" && (
            <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--theme) text-(--theme-second)">
                  <ImagePlus size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-black">Upload Product</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload the image first, then submit the product details to the backend.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUploadProduct} className="grid gap-4 lg:grid-cols-2">
                <Field label="Name">
                  <input
                    className={inputClass()}
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Rose flower"
                  />
                </Field>
                <Field label="Category">
                  <select
                    className={inputClass()}
                    value={form.category}
                    onChange={(event) => updateForm("category", event.target.value)}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Price">
                  <input
                    type="number"
                    min="0"
                    className={inputClass()}
                    value={form.price}
                    onChange={(event) => updateForm("price", event.target.value)}
                    placeholder="2500"
                  />
                </Field>
                <Field label="Stock">
                  <input
                    type="number"
                    min="0"
                    className={inputClass()}
                    value={form.stock}
                    onChange={(event) => updateForm("stock", event.target.value)}
                    placeholder="200"
                  />
                </Field>
                <div className="lg:col-span-2">
                  <Field label="Delivery Time">
                    <select
                      className={inputClass()}
                      value={form.deliveryTime}
                      onChange={(event) => updateForm("deliveryTime", event.target.value)}
                    >
                      <option value="1">Same day delivery</option>
                      <option value="7">7 days delivery</option>
                    </select>
                  </Field>
                </div>
                <div className="lg:col-span-2">
                  <Field label="Description">
                    <textarea
                      className={inputClass("min-h-28 resize-none py-4")}
                      value={form.description}
                      onChange={(event) => updateForm("description", event.target.value)}
                      placeholder="1 strand of rose flower"
                    />
                  </Field>
                </div>
                <div className="lg:col-span-2">
                  <MultiImageUpload
                    images={form.images}
                    onSelectImage={handleSelectSlotImage}
                    onRemoveImage={handleRemoveSlotImage}
                    onUploadSlot={handleUploadSlot}
                    onUploadAllPending={handleUploadAllPendingImages}
                    uploadingSlotIndex={uploadingSlotIndex}
                    isUploadingAll={isUploadingAllImages}
                    disabled={isBusy}
                  />
                </div>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row lg:col-span-2">
                  <button
                    type="submit"
                    disabled={isBusy || !hasUploadedImage}
                    className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--theme) px-6 text-sm font-black text-(--theme-second) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PackagePlus size={18} />
                    {isUploadingProduct ? "Uploading product..." : "Upload Product"}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setForm(createEmptyForm())}
                    className="h-12 cursor-pointer rounded-xl border border-gray-200 px-6 text-sm font-bold text-gray-600 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-300"
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeSection === "categoryImages" && (
            <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--theme) text-(--theme-second)">
                  <ImageIcon size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-black">Category Images</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add or replace the display image for each storefront category.
                  </p>
                </div>
              </div>

              {categoriesLoading ? (
                <p className="rounded-xl bg-[#f7f5fb] px-4 py-8 text-center text-sm text-gray-500 dark:bg-[#12101a]">Loading categories...</p>
              ) : categoriesError ? (
                <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>{categoriesError}</span>
                  <button type="button" onClick={loadCategories} className="font-bold underline">Try again</button>
                </div>
              ) : categories.length ? (
                <div className="grid gap-3">
                  {categories.map((category) => {
                    const pendingImage = categoryImages[category.id]
                    const preview = pendingImage?.preview || category.image
                    const isUploadingCategory = uploadingCategoryId === category.id
                    return (
                      <article
                        key={category.id}
                        className="flex min-w-0 items-center gap-4 rounded-xl border border-gray-100 bg-[#f7f5fb] p-3 dark:border-white/10 dark:bg-[#12101a]"
                      >
                        <div
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 bg-white bg-cover bg-center text-(--theme) dark:border-white/15 dark:bg-[#16131f] sm:h-20 sm:w-20"
                          style={preview ? { backgroundImage: `url("${preview}")` } : undefined}
                        >
                          {!preview && <ImagePlus size={22} />}
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-black text-gray-900 dark:text-gray-100 sm:text-base">
                          {category.name}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-black text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200 sm:px-4">
                            <Edit3 size={15} />
                            <span className="hidden sm:inline">Edit picture</span>
                            <span className="sm:hidden">Edit</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) => handleCategoryImageChange(category, event)}
                            />
                          </label>
                          <button
                            type="button"
                            disabled={!pendingImage?.file || isUploadingCategory}
                            onClick={() => handleUploadCategoryImage(category)}
                            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-(--theme) px-3 text-xs font-black text-(--theme-second) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                          >
                            {isUploadingCategory ? "Uploading..." : "Upload"}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-[#f7f5fb] px-4 py-8 text-center text-sm text-gray-500 dark:bg-[#12101a]">No categories found.</p>
              )}
            </section>
          )}
          {activeSection === "products" && (
            <section className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black">Products</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Products fetched from the live store catalog.</p>
                </div>
                <div className="relative w-full lg:w-80">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products..."
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f5fb] pl-10 pr-4 text-sm outline-none transition focus:border-(--theme) dark:border-white/10 dark:bg-[#12101a]"
                  />
                </div>
              </div>


              {productsLoading && <p className="rounded-xl bg-[#f7f5fb] px-4 py-8 text-center text-sm text-gray-500 dark:bg-[#12101a]">Loading products...</p>}
              {productsError && (
                <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>{productsError}</span>
                  <button type="button" onClick={handleRefreshProducts} className="font-bold underline">Try again</button>
                </div>
              )}
              {!productsLoading && !productsError && !filteredProducts.length && (
                <p className="rounded-xl bg-[#f7f5fb] px-4 py-8 text-center text-sm text-gray-500 dark:bg-[#12101a]">No products found.</p>
              )}
              {!productsLoading && !productsError && filteredProducts.length > 0 && (
                <>
                  <div className="hidden overflow-hidden rounded-xl border border-gray-100 dark:border-white/10 lg:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#f7f5fb] text-xs uppercase tracking-[0.18em] text-gray-500 dark:bg-[#12101a] dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-4">Product</th>
                          <th className="px-4 py-4">Category</th>
                          <th className="px-4 py-4">Price</th>
                          <th className="px-4 py-4">Stock</th>
                          <th className="px-4 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {filteredProducts.map((product) => (
                          <tr key={product.id}>
                            <td className="px-4 py-4">
                              <div className="flex cursor-pointer items-center gap-3">
                                <ProductImage src={product.image} title={product.title} />
                                <div className="min-w-0">
                                  <p className="truncate font-bold">{product.title}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{product.category}</td>
                            <td className="px-4 py-4 font-bold">{formatNaira(product.price)}</td>
                            <td className="px-4 py-4">{formatNumber(product.stock)}</td>

                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditProduct(product)}
                                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200"
                                >
                                  <Edit3 size={16} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingProductId === product.id}
                                  onClick={() => requestDeleteProduct(product)}
                                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                >
                                  <Trash2 size={16} />
                                  {deletingProductId === product.id ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 lg:hidden">
                    {filteredProducts.map((product) => (
                      <article key={product.id} className="rounded-xl border border-gray-100 bg-[#f7f5fb] p-4 dark:border-white/10 dark:bg-[#12101a]">
                        <div className="flex items-start gap-3">
                          <ProductImage src={product.image} title={product.title} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{product.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand} / {product.category}</p>
                            <p className="mt-2 text-sm font-black">{formatNaira(product.price)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProduct(product)}
                              aria-label={`Edit ${product.title}`}
                              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition hover:bg-gray-100 dark:bg-[#16131f] dark:text-gray-300 dark:hover:bg-white/10"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={deletingProductId === product.id}
                              onClick={() => requestDeleteProduct(product)}
                              aria-label={`Delete ${product.title}`}
                              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#16131f] dark:text-red-300 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
          {activeSection === "users" && (
            <UsersSection
              users={users}
              loading={usersLoading}
              error={usersError}
              onRefresh={loadUsers}
              onUserBlocked={handleUserBlocked}
              onAuthExpired={redirectToAdminLogin}
            />
          )}
        </div>
      </section>

      {transitEditorOrder && (
        <TransitEditorModal
          order={transitEditorOrder}
          onClose={closeTransitEditor}
          onSuccess={loadOrders}
          onAuthExpired={redirectToAdminLogin}
        />
      )}

      {transitDetailsOrder && (
        <TransitDetailsModal
          order={transitDetailsOrder}
          onClose={closeTransitDetails}
          onAuthExpired={redirectToAdminLogin}
        />
      )}

      {productPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-[#16131f] sm:rounded-2xl sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <Trash2 size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-gray-950 dark:text-white">Delete product?</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  This will remove <span className="font-bold text-gray-800 dark:text-gray-200">{productPendingDelete.title}</span> from the product catalog.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(deletingProductId)}
                onClick={closeDeleteProductModal}
                className="h-11 cursor-pointer rounded-xl border border-gray-200 px-5 text-sm font-bold text-gray-600 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(deletingProductId)}
                onClick={handleDeleteProduct}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={17} />
                {deletingProductId ? "Deleting..." : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      )}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
          <form onSubmit={handleSaveEdit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-[#16131f] sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Edit Product</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update the local product details.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null)
                  setEditingImageFile(null)
                }}
                className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name">
                <input className={inputClass()} value={editingProduct.title} onChange={(event) => updateEditingProduct("title", event.target.value)} />
              </Field>
              <Field label="Price">
                <input type="number" min="0" className={inputClass()} value={editingProduct.price} onChange={(event) => updateEditingProduct("price", event.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Delivery Time">
                  <select
                    className={inputClass()}
                    value={editingProduct.deliveryTime || "1"}
                    onChange={(event) => updateEditingProduct("deliveryTime", event.target.value)}
                  >
                    <option value="1">Same day delivery</option>
                    <option value="7">7 days delivery</option>
                  </select>
                </Field>
              </div>
              <div className="sm:col-span-2">
                <ImageUploadField
                  label="Product image"
                  preview={editingProduct.image}
                  onFileSelect={(file, previewUrl) => {
                    setEditingImageFile(file)
                    updateEditingProduct("image", previewUrl)
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  setEditingProduct(null)
                  setEditingImageFile(null)
                }}
                className="h-11 cursor-pointer rounded-xl border border-gray-200 px-5 text-sm font-bold text-gray-600 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--theme) px-5 text-sm font-black text-(--theme-second) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={17} />
                {isUploadingProduct ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}



