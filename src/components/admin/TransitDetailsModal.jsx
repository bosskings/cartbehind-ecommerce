"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  Edit3,
  Hash,
  MapPin,
  Package,
  Plus,
  Truck,
  X,
} from "lucide-react"
import { getAdminToken } from "@/lib/cloudinary"
import {
  fetchAdminTransit,
  getApiErrorMessage,
  isAdminAuthError,
  updateAdminTransit,
} from "@/lib/orders"
import { Field, inputClass } from "@/components/admin/formUi"
import {
  formatOrderDate,
  getTransitFromResponse,
} from "@/components/admin/transitUtils"

export default function TransitDetailsModal({
  order,
  onClose,
  onAuthExpired,
  onOpenTransitEditor,
}) {
  const [transitDetails, setTransitDetails] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingTransitId, setEditingTransitId] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!order?.id) return undefined

    let cancelled = false

    const loadDetails = async () => {
      const token = getAdminToken()
      if (!token) {
        onAuthExpired?.()
        return
      }

      setLoading(true)
      setEditingTransitId(null)

      // If the order already carries transit details from the orders list, preload them
      if (order.transit) {
        const initialTransit = getTransitFromResponse(order.transit) || order.transit
        setTransitDetails(initialTransit)
        setSnapshot(initialTransit ? structuredClone(initialTransit) : null)
      } else {
        setTransitDetails(null)
        setSnapshot(null)
      }

      try {
        const response = await fetchAdminTransit(token, order.id)
        if (cancelled) return
        const transit = getTransitFromResponse(response)
        if (transit) {
          setTransitDetails(transit)
          setSnapshot(structuredClone(transit))
        }
      } catch (error) {
        if (cancelled) return
        if (isAdminAuthError(error)) {
          onAuthExpired?.()
          return
        }
        console.warn("Transit record not found or error loading transit:", error?.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDetails()

    return () => {
      cancelled = true
    }
  }, [order?.id, order?.transit, onAuthExpired])

  const cancelLocationEdit = () => {
    if (snapshot) {
      setTransitDetails(structuredClone(snapshot))
    }
    setEditingTransitId(null)
  }

  const startLocationEdit = (locationId) => {
    if (transitDetails) {
      setSnapshot(structuredClone(transitDetails))
    }
    setEditingTransitId(locationId)
  }

  const persistLocation = async (locationEntryId) => {
    if (!transitDetails || isUpdating) return

    const token = getAdminToken()
    if (!token) {
      onAuthExpired?.()
      return
    }

    const locationEntry = transitDetails.currentLocation?.find(
      (entry) => entry._id === locationEntryId,
    )
    if (
      !transitDetails.carrier ||
      !locationEntry?.location?.trim() ||
      !locationEntry.description?.trim()
    ) {
      toast.error("Location and description are required.")
      return
    }

    setIsUpdating(true)
    try {
      const response = await updateAdminTransit(token, locationEntryId, {
        transitId: transitDetails._id,
        location: locationEntry.location.trim(),
        description: locationEntry.description.trim(),
        carrier: transitDetails.carrier,
        status: transitDetails.status || "IN_TRANSIT",
      })
      const updatedTransit = getTransitFromResponse(response)
      if (updatedTransit) {
        setTransitDetails(updatedTransit)
        setSnapshot(structuredClone(updatedTransit))
      }
      setEditingTransitId(null)
      toast.success("Location updated successfully.")
    } catch (error) {
      console.error("Admin transit update failed:", error)
      if (isAdminAuthError(error)) {
        onAuthExpired?.()
        return
      }
      toast.error(getApiErrorMessage(error, "Could not update location."))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateLocation = async (event) => {
    event.preventDefault()
    if (!editingTransitId) return
    await persistLocation(editingTransitId)
  }

  // Resolve delivery details from order or transit
  const delivery =
    order?.deliveryDetails ||
    transitDetails?.deliveryDetails ||
    order?.destination ||
    null

  const hasDeliveryDetails = Boolean(
    delivery?.address ||
    delivery?.city ||
    delivery?.stateOrProvince ||
    delivery?.country ||
    delivery?.postCode ||
    order?.deliveryNote,
  )

  const trackingNumber =
    transitDetails?.trackingNumber ||
    order?.trackingCode ||
    order?.trackingNumber ||
    null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs p-0 transition-opacity sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-white shadow-2xl dark:bg-[#16131f] sm:rounded-2xl">
        {/* Header */}
        <div className="border-b border-gray-100 p-5 dark:border-white/10 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--theme)/10 text-(--theme)">
                  <Truck size={15} />
                </span>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  Transit & Delivery Details
                </h2>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
                Order #{order?.id}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close transit details"
              className="cursor-pointer rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {loading && (
            <p className="rounded-xl bg-[#f7f5fb] px-4 py-8 text-center text-sm text-gray-500 dark:bg-[#12101a]">
              Loading transit & delivery details...
            </p>
          )}

          {/* 1. Tracking Number */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#f7f5fb] p-4.5 dark:border-white/10 dark:bg-[#12101a]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Tracking Number
              </span>
              <p className="mt-0.5 font-mono text-base font-black text-(--theme)">
                {trackingNumber || "Not assigned yet"}
              </p>
            </div>
            {transitDetails?.carrier && (
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Carrier
                </span>
                <p className="mt-0.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                  {transitDetails.carrier}
                </p>
              </div>
            )}
          </div>

          {/* 2. Delivery Details */}
          <section className="rounded-2xl border border-gray-100 bg-[#f7f5fb] p-5 dark:border-white/10 dark:bg-[#12101a]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--theme)/10 text-(--theme)">
                  <MapPin size={18} />
                </span>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white">
                    Delivery Details
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Destination & shipping address
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800">
                {order?.deliveryStatus || transitDetails?.status || "PENDING"}
              </span>
            </div>

            {hasDeliveryDetails ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-white/80 bg-white p-3.5 shadow-xs dark:border-white/5 dark:bg-[#16131f]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Street Address
                  </span>
                  <p className="mt-1 font-bold text-gray-900 dark:text-white">
                    {delivery?.address || "Unavailable"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/80 bg-white p-3.5 shadow-xs dark:border-white/5 dark:bg-[#16131f]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    City
                  </span>
                  <p className="mt-1 font-bold text-gray-900 dark:text-white">
                    {delivery?.city || "Unavailable"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/80 bg-white p-3.5 shadow-xs dark:border-white/5 dark:bg-[#16131f]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    State / Province
                  </span>
                  <p className="mt-1 font-bold text-gray-900 dark:text-white">
                    {delivery?.stateOrProvince || delivery?.state || "Unavailable"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/80 bg-white p-3.5 shadow-xs dark:border-white/5 dark:bg-[#16131f]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Country
                  </span>
                  <p className="mt-1 font-bold text-gray-900 dark:text-white">
                    {delivery?.country || "Unavailable"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/80 bg-white p-3.5 shadow-xs dark:border-white/5 dark:bg-[#16131f]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Postal / Zip Code
                  </span>
                  <p className="mt-1 font-mono font-bold text-gray-900 dark:text-white">
                    {delivery?.postCode || delivery?.postalCode || "Unavailable"}
                  </p>
                </div>

                {order?.deliveryNote && (
                  <div className="rounded-xl border border-white/80 bg-white p-3.5 shadow-xs dark:border-white/5 dark:bg-[#16131f]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Delivery Note
                    </span>
                    <p className="mt-1 font-medium text-gray-700 dark:text-gray-300">
                      {order.deliveryNote}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-xl bg-white p-4 text-center text-xs text-gray-500 dark:bg-[#16131f]">
                No delivery details specified for this order.
              </p>
            )}
          </section>

          {/* 3. Location History */}
          {!loading && (
            <section className="space-y-3">
              <h3 className="font-black text-gray-900 dark:text-white">
                Location History
              </h3>

              {transitDetails?.currentLocation && transitDetails.currentLocation.length > 0 ? (
                transitDetails.currentLocation.map((entry) => {
                  const isEditing = editingTransitId === entry._id
                  return (
                    <form
                      key={entry._id}
                      onSubmit={handleUpdateLocation}
                      className="rounded-xl border border-gray-100 bg-[#f7f5fb] p-4 dark:border-white/10 dark:bg-[#12101a]"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Location">
                          <input
                            className={inputClass()}
                            value={entry.location || ""}
                            readOnly={!isEditing}
                            onChange={(event) =>
                              setTransitDetails((current) => ({
                                ...current,
                                currentLocation: current.currentLocation.map((item) =>
                                  item._id === entry._id
                                    ? { ...item, location: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                          />
                        </Field>
                        <Field label="Description">
                          <textarea
                            className={inputClass("min-h-12 resize-y py-3")}
                            value={entry.description || ""}
                            readOnly={!isEditing}
                            onChange={(event) =>
                              setTransitDetails((current) => ({
                                ...current,
                                currentLocation: current.currentLocation.map((item) =>
                                  item._id === entry._id
                                    ? { ...item, description: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                          />
                        </Field>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-400">
                          {entry.timestamp ? formatOrderDate(entry.timestamp) : "No timestamp"}
                        </p>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={cancelLocationEdit}
                              className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-bold dark:border-white/10"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isUpdating}
                              className="h-9 rounded-lg bg-(--theme) px-3 text-xs font-bold text-(--theme-second) disabled:opacity-50"
                            >
                              {isUpdating ? "Updating..." : "Update"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startLocationEdit(entry._id)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                        )}
                      </div>
                    </form>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f7f5fb] p-6 text-center dark:border-white/10 dark:bg-[#12101a]">
                  <Truck className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                    No location entries recorded yet
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {transitDetails
                      ? "No tracking checkpoints have been added for this transit."
                      : "No transit record has been created for this order yet."}
                  </p>
                  {!transitDetails && onOpenTransitEditor && (
                    <button
                      type="button"
                      onClick={() => onOpenTransitEditor(order)}
                      className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-(--theme) px-4 py-2 text-xs font-bold text-(--theme-second) transition hover:opacity-90"
                    >
                      <Plus size={14} />
                      Create Transit Now
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-[#f7f5fb] p-4 dark:border-white/10 dark:bg-[#12101a] sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-(--theme) px-5 text-xs font-bold text-(--theme-second) transition hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
