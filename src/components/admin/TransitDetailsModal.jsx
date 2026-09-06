"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Edit3, X } from "lucide-react"
import { getAdminToken } from "@/lib/cloudinary"
import {
  fetchAdminTransit,
  getApiErrorMessage,
  updateAdminTransit,
} from "@/lib/orders"
import { Field, inputClass } from "@/components/admin/formUi"
import {
  formatOrderDate,
  getTransitFromResponse,
  transitStatusOptions,
} from "@/components/admin/transitUtils"

export default function TransitDetailsModal({ order, onClose }) {
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
        toast.error("Admin token is missing. Please log in again.")
        onClose()
        return
      }

      setLoading(true)
      setTransitDetails(null)
      setSnapshot(null)
      setEditingTransitId(null)

      try {
        const response = await fetchAdminTransit(token, order.id)
        if (cancelled) return
        console.log("Admin transit details response:", response)
        const transit = getTransitFromResponse(response)
        setTransitDetails(transit)
        setSnapshot(transit ? structuredClone(transit) : null)
      } catch (error) {
        if (cancelled) return
        toast.error(getApiErrorMessage(error, "Could not load transit details."))
        onClose()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDetails()

    return () => {
      cancelled = true
    }
  }, [order?.id, onClose])

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
      toast.error("Admin token is missing. Please log in again.")
      return
    }

    const locationEntry = transitDetails.currentLocation?.find(
      (entry) => entry._id === locationEntryId,
    )
    if (
      !transitDetails.status ||
      !transitDetails.carrier ||
      !locationEntry?.location?.trim() ||
      !locationEntry.description?.trim()
    ) {
      toast.error("Status, carrier, location, and description are required.")
      return
    }

    setIsUpdating(true)
    try {
      const response = await updateAdminTransit(token, locationEntryId, {
        transitId: transitDetails._id,
        location: locationEntry.location.trim(),
        description: locationEntry.description.trim(),
        carrier: transitDetails.carrier,
        status: transitDetails.status,
      })
      console.log("Admin transit update response:", response)
      const updatedTransit = getTransitFromResponse(response)
      if (updatedTransit) {
        setTransitDetails(updatedTransit)
        setSnapshot(structuredClone(updatedTransit))
      }
      setEditingTransitId(null)
      toast.success("Transit details updated successfully.")
    } catch (error) {
      console.error("Admin transit update failed:", error)
      toast.error(getApiErrorMessage(error, "Could not update transit details."))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateLocation = async (event) => {
    event.preventDefault()
    if (!editingTransitId) return
    await persistLocation(editingTransitId)
  }

  const saveStatus = async () => {
    const firstLocationId = transitDetails?.currentLocation?.[0]?._id
    if (!firstLocationId) {
      toast.error("Add a location step before updating status.")
      return
    }
    await persistLocation(firstLocationId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-[#16131f] sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Transit details</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Order ID: {order.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transit details"
            className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {loading && (
          <p className="rounded-xl bg-[#f7f5fb] px-4 py-8 text-center text-sm text-gray-500 dark:bg-[#12101a]">
            Loading transit details...
          </p>
        )}

        {!loading && transitDetails && (
          <>
            <div className="grid gap-4 rounded-xl bg-[#f7f5fb] p-4 text-sm dark:bg-[#12101a] sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-400">Transit ID</p>
                <p className="mt-1 break-all font-semibold">{transitDetails._id || "Unavailable"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Order ID</p>
                <p className="mt-1 break-all font-semibold">
                  {transitDetails.orderId || order.id || "Unavailable"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tracking number</p>
                <p className="mt-1 break-all font-semibold">
                  {transitDetails.trackingNumber || "Unavailable"}
                </p>
              </div>
              <Field label="Carrier">
                <input
                  className={inputClass("cursor-not-allowed bg-gray-100 dark:bg-white/5")}
                  value={transitDetails.carrier || "Unavailable"}
                  readOnly
                />
              </Field>
              <div className="space-y-2">
                <Field label="Status">
                  <select
                    className={inputClass()}
                    value={transitDetails.status || ""}
                    onChange={(event) =>
                      setTransitDetails((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select status</option>
                    {transitStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  type="button"
                  onClick={saveStatus}
                  disabled={isUpdating || !transitDetails.status || !transitDetails.currentLocation?.length}
                  className="h-9 cursor-pointer rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-(--theme) hover:text-(--theme) disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-200"
                >
                  {isUpdating ? "Saving..." : "Save status"}
                </button>
              </div>
              <div>
                <p className="text-xs text-gray-400">Shipped date</p>
                <p className="mt-1 font-semibold">
                  {transitDetails.shippedDate
                    ? formatOrderDate(transitDetails.shippedDate)
                    : "Unavailable"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Delivered date</p>
                <p className="mt-1 font-semibold">
                  {transitDetails.deliveredDate
                    ? formatOrderDate(transitDetails.deliveredDate)
                    : "Not delivered"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Last updated</p>
                <p className="mt-1 font-semibold">
                  {transitDetails.updatedAt
                    ? formatOrderDate(transitDetails.updatedAt)
                    : "Unavailable"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="font-black">Current location history</h3>
              {(transitDetails.currentLocation || []).map((entry) => {
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
              })}
              {!transitDetails.currentLocation?.length && (
                <p className="rounded-xl bg-[#f7f5fb] px-4 py-6 text-center text-sm text-gray-500 dark:bg-[#12101a]">
                  No location entries found.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
