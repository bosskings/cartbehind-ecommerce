"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FileText, Check } from "lucide-react"

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString("en-NG")}`
}

const QUICK_NOTES = [
  "Call before delivery",
  "Gift packaging",
  "Handle with care",
]

export default function AddCartNoteModal({
  product,
  isOpen,
  onClose,
  onConfirm,
}) {
  const [note, setNote] = useState("")
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setNote(product?.deliveryNote || product?.note || "")
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, product])

  if (!isOpen || !product) return null

  const handleConfirm = () => {
    onConfirm?.(product, note.trim())
  }

  const handleSkip = () => {
    onConfirm?.(product, "")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose?.()
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleConfirm()
    }
  }

  const quantity = Math.max(1, Number(product.quantity) || 1)
  const price = (Number(product.price) || 0) * quantity
  const productName = product.title || product.name || "Item"

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        onKeyDown={handleKeyDown}
      >
        {/* Backdrop click to dismiss */}
        <div
          className="absolute inset-0"
          onClick={onClose}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="relative z-10 w-[calc(100vw-32px)] max-w-[430px] overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xl dark:border-white/15 dark:bg-[#15131f]"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--theme)/10 text-(--theme)">
                  <FileText size={15} />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  Delivery Note
                </h3>
              </div>
              <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                {productName} &bull; {formatNaira(price)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 -mt-1 cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Textarea Input */}
          <div className="mt-4">
            <textarea
              id="cart-item-note"
              ref={textareaRef}
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Call before delivery, handle with care, gate code..."
              className="h-24 w-full resize-none rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-sm leading-relaxed text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-(--theme) focus:bg-white focus:ring-2 focus:ring-(--theme)/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-transparent"
            />
            <div className="mt-1.5 flex items-center justify-end">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {note.length}/200
              </span>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_NOTES.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setNote((prev) => {
                    const trimmed = prev.trim()
                    return trimmed ? `${trimmed}, ${suggestion}` : suggestion
                  })
                }}
                className="cursor-pointer rounded-full border border-gray-200/90 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-(--theme) hover:bg-(--theme)/5 hover:text-(--theme) dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-(--theme) dark:hover:text-white"
              >
                + {suggestion}
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3.5 dark:border-white/10">
            <button
              type="button"
              onClick={handleSkip}
              className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              Skip Note
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-(--theme) px-4 py-2 text-xs font-bold text-(--theme-second) shadow-sm transition hover:opacity-95 active:scale-95"
            >
              <Check size={14} />
              {note.trim() ? "Add with Note" : "Add to Cart"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
