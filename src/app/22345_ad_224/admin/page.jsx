"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Edit3,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  PackagePlus,
  Search,
  ShoppingBag,
  Sun,
  Truck,
  UploadCloud,
  Users,
  X,
} from "lucide-react"
import { products as seededProducts } from "@/data/products"
import { useTheme } from "@/components/ThemeContext"
import { useAuth } from "@/components/AuthContext"
import { getAdminToken, uploadToCloudinary } from "@/lib/cloudinary"

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "",
  imageFile: null,
  imagePreview: "",
  url: "",
  publicId: "",
  fileType: "",
}

const sections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "upload", label: "Upload Product", icon: PackagePlus },
  { id: "products", label: "Products", icon: Boxes },
]

function normalizeProduct(product, index = 0) {
  return {
    id: product.id ?? Date.now() + index,
    brand: product.brand || "CartBehind",
    title: product.title || "Untitled product",
    rating: product.rating ?? 4.5,
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || 0,
    discountPercent: Number(product.discountPercent) || 0,
    image: product.image || "/thumbnail.webp",
    category: product.category || "General",
    description: product.description || "",
    tags: product.tags || [],
    stock: Number(product.stock) || 0,
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-NG").format(value)
}

function formatNaira(value) {
  return `NGN ${formatNumber(Number(value) || 0)}`
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

function Field({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-(--theme) focus:shadow-[0_0_0_3px_rgba(var(--theme-rgb),0.12)] dark:border-white/10 dark:bg-[#12101a] dark:text-gray-100 ${extra}`
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
  const [products, setProducts] = useState(() => seededProducts.map(normalizeProduct))
  const [form, setForm] = useState(emptyForm)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingImageFile, setEditingImageFile] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingProduct, setIsUploadingProduct] = useState(false)
  const [query, setQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme, mounted } = useTheme()
  const { logoutAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    window.localStorage.removeItem("cartbehind-admin-products")
  }, [])

  const hasUploadedImage = Boolean(form.url && form.publicId && form.fileType)

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: "1,248",
        meta: "Mock active shoppers",
        icon: Users,
        tone: "bg-[#280E89]/10 text-(--theme)",
      },
      {
        label: "Products",
        value: formatNumber(products.length),
        meta: "Local admin catalog",
        icon: ShoppingBag,
        tone: "bg-yellow-200 text-[#280E89]",
      },
      {
        label: "Delivered Items",
        value: "836",
        meta: "Mock completed orders",
        icon: PackageCheck,
        tone: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Items In Transit",
        value: "64",
        meta: "Mock moving parcels",
        icon: Truck,
        tone: "bg-blue-100 text-blue-700",
      },
    ],
    [products.length],
  )

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return products

    return products.filter((product) =>
      [product.title, product.brand, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    )
  }, [products, query])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateEditingProduct = (field, value) => {
    setEditingProduct((current) => ({ ...current, [field]: value }))
  }

  const handleUploadImage = async () => {
    if (!form.imageFile) {
      toast.error("Please choose a product image first.")
      return
    }

    setIsUploadingImage(true)

    try {
      const data = await uploadToCloudinary(form.imageFile)

      setForm((current) => ({
        ...current,
        url: data.secure_url || data.url || "",
        publicId: data.public_id || "",
        fileType: data.format || "",
        imagePreview: data.secure_url || data.url || current.imagePreview,
      }))

      toast.success("Product image uploaded successfully.")
    } catch (error) {
      toast.error(error.message || "Image upload failed. Please try again.")
    } finally {
      setIsUploadingImage(false)
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

    if (!hasUploadedImage) {
      toast.error("Please upload the product image first.")
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
    const token = getAdminToken()

    if (!API_URL) {
      toast.error("NEXT_PUBLIC_BACKEND_URL is missing.")
      return
    }

    if (!token) {
      toast.error("Admin token is missing. Please log in again.")
      return
    }

    setIsUploadingProduct(true)

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/upload-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category: form.category.trim(),
          stock: Number(form.stock),
          url: form.url,
          publicId: form.publicId,
          fileType: form.fileType,
        }),
      })

      const data = await response.json()
      console.log(data)

      if (!response.ok) {
        throw new Error(data?.message || "Product upload failed.")
      }

      setForm(emptyForm)
      toast.success(data?.message || "Product uploaded successfully.")
    } catch (error) {
      toast.error(error.message || "Product upload failed. Please try again.")
    } finally {
      setIsUploadingProduct(false)
    }
  }

  const openEditProduct = (product) => {
    setEditingImageFile(null)
    setEditingProduct(product)
  }

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

    setIsUploadingProduct(true)

    try {
      let imageUrl = editingProduct.image

      if (editingImageFile) {
        const data = await uploadToCloudinary(editingImageFile)
        imageUrl = data.secure_url || data.url
      }

      const updatedProduct = normalizeProduct({
        ...editingProduct,
        image: imageUrl,
      })

      setProducts((current) =>
        current.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
      )
      setEditingProduct(null)
      setEditingImageFile(null)
      toast.success("Product updated successfully.")
    } catch (error) {
      toast.error(error.message || "Image upload failed. Please try again.")
    } finally {
      setIsUploadingProduct(false)
    }
  }

  const isDark = mounted && theme === "dark"
  const isBusy = isUploadingImage || isUploadingProduct

  const handleAdminLogout = () => {
    logoutAdmin()
    toast.success("Admin logged out successfully.")
    router.replace("/admin/login")
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
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <article
                      key={stat.label}
                      className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] max-[390px]:p-4 dark:border-white/10 dark:bg-[#16131f]"
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
                      <p className="mt-3 text-xs font-medium text-gray-400">{stat.meta}</p>
                    </article>
                  )
                })}
              </section>

              <section className="grid min-w-0 gap-6 max-[390px]:gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] max-[390px]:p-4 dark:border-white/10 dark:bg-[#16131f]">
                  <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3 max-[390px]:mb-4 max-[390px]:gap-2">
                    <div>
                      <h2 className="text-xl font-black max-[390px]:text-lg">Catalog Overview</h2>
                      <p className="text-sm text-gray-500 max-[390px]:text-xs dark:text-gray-400">A quick read on the local product set.</p>
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

                  <div className="grid min-w-0 gap-3 max-[390px]:gap-2 sm:grid-cols-3">
                    {["Beauty", "Home", "General"].map((category) => {
                      const count = products.filter((product) => product.category === category).length
                      return (
                        <div key={category} className="min-w-0 rounded-xl bg-[#f7f5fb] p-4 max-[390px]:p-3 dark:bg-[#12101a]">
                          <p className="truncate text-sm font-bold max-[390px]:text-xs">{category}</p>
                          <p className="mt-2 text-2xl font-black text-(--theme) max-[390px]:text-xl">{count}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] max-[390px]:p-4 dark:border-white/10 dark:bg-[#16131f]">
                  <h2 className="text-xl font-black max-[390px]:text-lg">Recent Products</h2>
                  <div className="mt-5 min-w-0 space-y-3 max-[390px]:mt-4 max-[390px]:space-y-2">
                    {products.slice(0, 4).map((product) => (
                      <div key={product.id} className="flex min-w-0 items-center gap-3 overflow-hidden rounded-xl bg-[#f7f5fb] p-3 max-[390px]:gap-2 max-[390px]:p-2 dark:bg-[#12101a]">
                        <ProductImage src={product.image} title={product.title} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{product.title}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{formatNaira(product.price)}</p>
                        </div>
                        <CheckCircle2 size={17} className="shrink-0 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
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
                  <input
                    className={inputClass()}
                    value={form.category}
                    onChange={(event) => updateForm("category", event.target.value)}
                    placeholder="decoration"
                  />
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
                  <ImageUploadField
                    label="Product image"
                    preview={form.imagePreview || form.url}
                    onFileSelect={(file, previewUrl) => {
                      setForm((current) => ({
                        ...current,
                        imageFile: file,
                        imagePreview: previewUrl,
                        url: "",
                        publicId: "",
                        fileType: "",
                      }))
                    }}
                  />
                  {hasUploadedImage && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">Image ready for product upload.</p>
                  )}
                </div>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row lg:col-span-2">
                  <button
                    type="button"
                    disabled={isBusy || !form.imageFile}
                    onClick={handleUploadImage}
                    className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 text-sm font-black text-gray-700 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-200"
                  >
                    <UploadCloud size={18} />
                    {isUploadingImage ? "Uploading image..." : "Upload product image"}
                  </button>
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
                    onClick={() => setForm(emptyForm)}
                    className="h-12 cursor-pointer rounded-xl border border-gray-200 px-6 text-sm font-bold text-gray-600 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-300"
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeSection === "products" && (
            <section className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black">Uploaded Products</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Edit the local product catalog before backend wiring.</p>
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
                          <button
                            type="button"
                            onClick={() => openEditProduct(product)}
                            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200"
                          >
                            <Edit3 size={16} />
                            Edit
                          </button>
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
                      <button type="button" onClick={() => openEditProduct(product)} className="cursor-pointer rounded-full bg-white p-2 text-(--theme) shadow-sm dark:bg-[#16131f]">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

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



