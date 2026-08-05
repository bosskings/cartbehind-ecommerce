"use client"

import { X } from "lucide-react"

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-(--theme) focus:bg-white"

export default function CheckoutModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-[#f5f5f5] shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-black/5 bg-[#f4f4f4] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--theme)/10 text-(--theme)">
              <span className="text-lg">📦</span>
            </div>
            <div>
              <h2 className="text-[28px] font-black text-gray-900">Checkout Simulation</h2>
              <p className="text-sm text-gray-600">Step 1 of 2: Shipping &amp; Details</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-600 transition hover:bg-white hover:text-gray-900"
            aria-label="Close checkout"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-5 p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-700">
              <span className="font-semibold">Full Name</span>
              <input className={fieldClass} defaultValue="Alex Johnson" />
            </label>

            <label className="space-y-2 text-sm text-gray-700">
              <span className="font-semibold">Email Address</span>
              <input className={fieldClass} defaultValue="alex.johnson@example.com" />
            </label>
          </div>

          <label className="block space-y-2 text-sm text-gray-700">
            <span className="font-semibold">Street Address</span>
            <input className={fieldClass} defaultValue="742 Evergreen Terrace" />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-700">
              <span className="font-semibold">City</span>
              <input className={fieldClass} defaultValue="Springfield" />
            </label>

            <label className="space-y-2 text-sm text-gray-700">
              <span className="font-semibold">Postal / Zip Code</span>
              <input className={fieldClass} defaultValue="97477" />
            </label>
          </div>

          <div className="rounded-2xl border border-[#f0d7a7] bg-[#fff8eb] px-4 py-4 text-sm text-gray-700">
            <div className="flex items-center gap-3 text-[15px] font-semibold text-(--theme)">
              <span>🚚</span>
              <span>Free Express Shipping</span>
            </div>
            <p className="mt-1 pl-7 text-gray-600">Estimated delivery within 2–3 business days.</p>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={onClose}
              className="flex items-center gap-2 rounded-full bg-(--theme) px-10 py-3 text-base font-bold text-(--theme-second) shadow-[0_10px_30px_rgba(39,14,137,0.25)]"
            >
              Continue to Payment
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
