"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthContext"
import { useCart } from "@/components/CartContext"
import CheckoutModal from "@/components/CheckoutModal"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, ArrowLeft } from "lucide-react"

const formatNaira = (amount) => `₦${amount.toLocaleString("en-NG")}`

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, cartCount } = useCart()
  const { isUserAuthenticated } = useAuth()
  const router = useRouter()
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  const handleProceedToCheckout = () => {
    if (!isUserAuthenticated) {
      router.push("/login?next=/cart")
      return
    }

    setShowCheckoutModal(true)
  }

  if (!items.length) {
    return (
      <>
        <Navbar />
        <main className="relative min-h-screen overflow-hidden bg-[#f7f5fb] dark:bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.08),transparent_55%)]" />
          <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-(--accent)/30 blur-3xl" />

          <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pb-24 pt-32 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex max-w-md flex-col items-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-(--theme)/10 bg-white text-(--theme) shadow-[0_20px_50px_rgba(40,14,137,0.12)]">
                <ShoppingBag size={28} strokeWidth={1.75} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-(--theme)">Cart</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
                Your cart is empty
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
                Add a few favorite pieces from the store and they&apos;ll show up here.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--theme) px-7 py-3.5 text-sm font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89]"
              >
                Continue Shopping
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-[#f7f5fb] dark:bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.07),transparent_50%)]" />
        <div className="pointer-events-none absolute -left-20 top-48 h-64 w-64 rounded-full bg-(--accent)/25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-8 lg:pt-32">
          <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-(--theme) transition-opacity hover:opacity-70"
              >
                <ArrowLeft size={16} />
                Keep shopping
              </Link>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-(--theme)">Cart</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 md:text-4xl dark:text-white">
                Review your items
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {cartCount} {cartCount === 1 ? "item" : "items"} ready for checkout
              </p>
            </div>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.7fr)] lg:gap-10">
            <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_8px_40px_rgba(40,14,137,0.06)] backdrop-blur-sm">
              <div className="hidden border-b border-gray-100 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 md:grid md:grid-cols-[minmax(0,1fr)_120px_140px_40px] md:gap-4 md:px-7">
                <span>Product</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              <ul className="divide-y divide-gray-100">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28 }}
                      className="flex flex-col gap-4 px-5 py-5 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_120px_140px_40px] md:items-center md:gap-4 md:px-7 md:py-6"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-28 sm:w-28">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                            {item.brand}
                          </p>
                          <h2 className="mt-1 truncate text-base font-bold text-gray-950 sm:text-lg">
                            {item.title}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatNaira(item.price)} each
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 md:justify-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 md:hidden">
                          Qty
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-[#f7f5fb] px-1.5 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-white hover:text-(--theme)"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-white hover:text-(--theme)"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 md:hidden">
                          Total
                        </span>
                        <span className="text-lg font-black tabular-nums text-gray-950">
                          {formatNaira(item.price * item.quantity)}
                        </span>
                      </div>

                      <div className="flex justify-end md:justify-center">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remove ${item.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>

            <aside className="lg:sticky lg:top-28">
              <div className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_8px_40px_rgba(40,14,137,0.08)] backdrop-blur-sm sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-gray-400">
                  Order summary
                </p>

                <div className="mt-6 space-y-3.5 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Subtotal ({cartCount})</span>
                    <span className="font-semibold tabular-nums text-gray-900">
                      {formatNaira(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-(--theme)">Free</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-dashed border-gray-200 pt-5">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-600">Total</span>
                    <span className="text-2xl font-black tabular-nums tracking-tight text-gray-950">
                      {formatNaira(subtotal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-5 py-3.5 text-sm font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89]"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </button>

                <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
                  Taxes calculated at checkout. Free delivery on every order.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <CheckoutModal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} />
    </>
  )
}
