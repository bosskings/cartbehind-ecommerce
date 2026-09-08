"use client"

import { useRef } from "react"
import toast from "react-hot-toast"
import { CheckCircle2, ImagePlus, RefreshCw, Trash2, UploadCloud } from "lucide-react"

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB

export default function MultiImageUpload({
  images = [],
  onSelectImage,
  onRemoveImage,
  onUploadSlot,
  onUploadAllPending,
  uploadingSlotIndex = null,
  isUploadingAll = false,
  disabled = false,
}) {
  const fileInputRefs = [useRef(null), useRef(null), useRef(null)]

  const handleFileChange = (index, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (JPEG, PNG, WEBP).")
      event.target.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image file size must be less than 3MB.")
      event.target.value = ""
      return
    }

    const previewUrl = URL.createObjectURL(file)
    onSelectImage(index, file, previewUrl)
    event.target.value = ""
  }

  const uploadedCount = images.filter((img) => Boolean(img.url && (img.publicID || img.publicId))).length
  const pendingCount = images.filter((img) => Boolean(img.file && (!img.url || !(img.publicID || img.publicId)))).length

  const slotLabels = [
    { title: "Main Image", subtitle: "Primary product photo (required)", required: true },
    { title: "Second Image", subtitle: "Additional angle or detail (optional)", required: false },
    { title: "Third Image", subtitle: "Additional angle or detail (optional)", required: false },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            Product Images (Up to 3)
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select up to 3 images, preview each slot, and upload them to Cloudinary before publishing.
          </p>
        </div>

        {/* Upload all pending images button */}
        {pendingCount > 0 && (
          <button
            type="button"
            disabled={disabled || isUploadingAll || uploadingSlotIndex !== null}
            onClick={onUploadAllPending}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-(--theme) px-4 text-xs font-black text-(--theme-second) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          >
            {isUploadingAll ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Uploading all...</span>
              </>
            ) : (
              <>
                <UploadCloud size={14} />
                <span>Upload all pending ({pendingCount})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 3 Slots Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {images.map((slot, index) => {
          const config = slotLabels[index] || { title: `Image ${index + 1}`, required: false }
          const isSlotUploading = uploadingSlotIndex === index
          const isUploaded = Boolean(slot.url && (slot.publicID || slot.publicId))
          const isPending = Boolean(slot.file && !isUploaded)

          return (
            <div
              key={index}
              className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3 transition ${
                isUploaded
                  ? "border-emerald-300 bg-emerald-50/20 dark:border-emerald-500/30 dark:bg-emerald-950/10"
                  : isPending
                  ? "border-(--theme)/40 bg-[#f7f5fb] dark:border-white/20 dark:bg-[#12101a]"
                  : "border-gray-200 bg-[#f7f5fb] hover:border-(--theme)/50 dark:border-white/10 dark:bg-[#12101a]"
              }`}
            >
              {/* Header of card */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="block truncate text-xs font-black text-gray-800 dark:text-gray-100">
                    {config.title} {config.required && <span className="text-red-500">*</span>}
                  </span>
                  <span className="block truncate text-[10px] text-gray-400">{config.subtitle}</span>
                </div>

                {isUploaded && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <CheckCircle2 size={11} /> Ready
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                    Pending
                  </span>
                )}
              </div>

              {/* Preview or Pick Area */}
              <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-white dark:border-white/10 dark:bg-[#16131f]">
                {slot.preview ? (
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform hover:scale-105"
                    style={{ backgroundImage: `url("${slot.preview}")` }}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => fileInputRefs[index].current?.click()}
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 p-3 text-center text-gray-400 transition hover:bg-gray-50 hover:text-(--theme) dark:hover:bg-white/5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--theme)/10 text-(--theme)">
                      <ImagePlus size={20} />
                    </span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      Choose {config.title}
                    </span>
                    <span className="text-[10px] text-gray-400">PNG, JPG up to 3MB</span>
                  </button>
                )}

                {/* Slot-level uploading spinner */}
                {isSlotUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
                    <RefreshCw size={22} className="animate-spin text-white mb-1" />
                    <span className="text-xs font-bold">Uploading...</span>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRefs[index]}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFileChange(index, e)}
              />

              {/* Card Footer Controls */}
              {slot.preview && (
                <div className="mt-3 flex items-center justify-between gap-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={disabled || isSlotUploading || isUploadingAll}
                      onClick={() => fileInputRefs[index].current?.click()}
                      className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-gray-200 px-2.5 text-[11px] font-bold text-gray-700 transition hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-300"
                    >
                      Change
                    </button>

                    {isPending && (
                      <button
                        type="button"
                        disabled={disabled || isSlotUploading || isUploadingAll}
                        onClick={() => onUploadSlot(index)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-(--theme) px-2.5 text-[11px] font-black text-(--theme-second) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <UploadCloud size={13} />
                        Upload
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={disabled || isSlotUploading || isUploadingAll}
                    onClick={() => onRemoveImage(index)}
                    aria-label="Remove image"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Upload status message */}
      <div className="flex items-center justify-between text-xs">
        {uploadedCount > 0 ? (
          <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>{uploadedCount} of 3 image{uploadedCount > 1 ? "s" : ""} uploaded to Cloudinary and ready.</span>
          </p>
        ) : (
          <p className="text-gray-400">Please choose and upload at least the Main Image.</p>
        )}
      </div>
    </div>
  )
}
