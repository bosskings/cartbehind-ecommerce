"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/components/CartContext"
import CheckoutModal from "@/components/CheckoutModal"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { motion } from "framer-motion"
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react"

const formatNaira = (amount) => `₦${amount.toLocaleString("en-NG")}`

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart()
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  if (!items.length) {
    return (
      <>
        <Navbar />
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-5 rounded-full bg-(--theme)/10 p-4 text-(--theme)">
            <ShoppingBag size={26} />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Your cart is empty</h1>
          <p className="mt-3 max-w-md text-sm text-gray-600">
            Add a few favorite pieces from the store and they’ll show up here.
          </p>
          <Link
            href="/"
            className="mt-8 rounded-full bg-(--theme) px-6 py-3 text-sm font-semibold text-(--theme-second)"
          >
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-28 md:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-(--theme)">Cart</p>
            <h1 className="text-3xl font-black text-gray-900">Review your items</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Keep Shopping
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.7fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:flex-row"
              >
                <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-gray-100 md:w-36">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">{item.brand}</p>
                      <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-full p-1 text-gray-700 hover:bg-white"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-full p-1 text-gray-700 hover:bg-white"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="text-lg font-black text-gray-900">{formatNaira(item.price * item.quantity)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <aside className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-gray-400">Summary</p>
            <div className="mt-4 space-y-3 border-b border-gray-100 pb-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-gray-900">Free</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-lg font-black text-gray-900">
              <span>Total</span>
              <span>{formatNaira(subtotal)}</span>
            </div>

            <button
              onClick={() => setShowCheckoutModal(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-5 py-3 text-sm font-bold text-(--theme-second)"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </button>
          </aside>
        </div>
      </div>

      <Footer />
      <CheckoutModal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} />
    </>
  )
}
