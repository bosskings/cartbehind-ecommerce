"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Plus, Trash2, Truck, X } from "lucide-react"
import { getAdminToken } from "@/lib/cloudinary"
import {
  createAdminTransit,
  fetchAdminTransit,
  getApiErrorMessage,
} from "@/lib/orders"
import { Field, inputClass } from "@/components/admin/formUi"
import {
  carrierOptions,
  createTimelineEntry,
  formatDateTimeInput,
  getTransitFromResponse,
  mapTransitEntries,
  transitStatusOptions,
} from "@/components/admin/transitUtils"

function toLocationPayload(entry) {
  return {
    location: entry.currentLocation.trim(),
    description: entry.comment.trim(),
    timestamp: entry.at,
  }
}

export default function TransitEditorModal({ order, onClose, onSuccess }) {
  const [editingOrder, setEditingOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!order?.id) return undefined

    let cancelled = false

    const loadTransit = async () => {
      const token = getAdminToken()
      if (!token) {
        toast.error("Admin token is missing. Please log in again.")
        onClose()
        return
      }

      setLoading(true)
      setError("")
      setEditingOrder({
        ...order,
        deliveryStatus: order.deliveryStatus || order.status || "PENDING",
        carrier: order.carrier || "",
        transitId: "",
        shippedDate: "",
        timeline: [createTimelineEntry()],
      })

      try {
        const response = await fetchAdminTransit(token, order.id)
        if (cancelled) return

        console.log("Admin transit GET response:", response)

        // Matches: { status, message, transit: { currentLocation: [...] } }
        const transit = getTransitFromResponse(response)
        const savedEntries = mapTransitEntries(transit)

        setEditingOrder((current) => ({
          ...current,
          carrier: transit?.carrier || current.carrier,
          deliveryStatus: transit?.status || current.deliveryStatus,
          transitId: transit?._id || "",
          shippedDate: transit?.shippedDate || "",
          timeline: [...savedEntries, createTimelineEntry()],
        }))
      } catch (loadError) {
        if (cancelled) return
        if (loadError?.response?.status === 404) {
          // No transit yet — keep the blank draft for first create
          setEditingOrder((current) => ({
            ...current,
            timeline: [createTimelineEntry()],
          }))
        } else {
          const message = getApiErrorMessage(loadError, "Could not load existing transit details.")
          setError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTransit()

    return () => {
      cancelled = true
    }
  }, [order?.id, onClose])

  const updateEditingOrder = (field, value) => {
    setEditingOrder((current) => ({ ...current, [field]: value }))
  }

  const updateTimelineEntry = (entryId, field, value) => {
    setEditingOrder((current) => ({
      ...current,
      timeline: current.timeline.map((entry) =>
        entry.id === entryId ? { ...entry, [field]: value } : entry,
      ),
    }))
  }

  const removeTimelineEntry = (entryId) => {
    setEditingOrder((current) => ({
      ...current,
      timeline: current.timeline.filter((entry) => entry.id !== entryId || entry.saved),
    }))
  }

  const draftEntries = editingOrder?.timeline?.filter((entry) => !entry.saved) || []
  const formValid = Boolean(
    editingOrder?.deliveryStatus &&
      editingOrder?.carrier &&
      draftEntries.length > 0 &&
      draftEntries.every(
        (entry) => entry.comment.trim() && entry.at && entry.currentLocation.trim(),
      ),
  )

  const handleGenerateTransit = async (event) => {
    event.preventDefault()
    if (!editingOrder || !formValid || isGenerating) return

    const token = getAdminToken()
    if (!token) {
      toast.error("Admin token is missing. Please log in again.")
      return
    }

    // Existing steps already on the server (from transit.currentLocation)
    const existingLocations = editingOrder.timeline
      .filter((entry) => entry.saved)
      .map(toLocationPayload)

    // New steps the admin just filled in
    const newLocations = editingOrder.timeline
      .filter(
        (entry) =>
          !entry.saved &&
          entry.at &&
          entry.currentLocation.trim() &&
          entry.comment.trim(),
      )
      .map(toLocationPayload)

    if (!newLocations.length) {
      toast.error("Add at least one new timeline step.")
      return
    }

    // Append new steps onto the existing currentLocation array
    const currentLocation = [...existingLocations, ...newLocations]

    const payload = {
      orderId: editingOrder.id,
      carrier: editingOrder.carrier,
      status: editingOrder.deliveryStatus,
      shippedDate: editingOrder.shippedDate || currentLocation[0]?.timestamp,
      currentLocation,
    }

    setIsGenerating(true)

    try {
      console.log("Admin transit POST payload:", payload)
      const response = await createAdminTransit(token, payload)
      console.log("Admin transit POST response:", response)

      const refreshed = await fetchAdminTransit(token, editingOrder.id)
      console.log("Admin transit GET after create:", refreshed)
      const transit = getTransitFromResponse(refreshed)

      setEditingOrder((current) => ({
        ...current,
        carrier: transit?.carrier || current.carrier,
        deliveryStatus: transit?.status || current.deliveryStatus,
        transitId: transit?._id || current.transitId,
        shippedDate: transit?.shippedDate || current.shippedDate,
        timeline: [...mapTransitEntries(transit), createTimelineEntry()],
      }))

      await onSuccess?.()
      toast.success(
        existingLocations.length
          ? "Transit step added successfully."
          : "Transit created successfully.",
      )
    } catch (generateError) {
      console.error("Admin transit request failed:", generateError)
      toast.error(getApiErrorMessage(generateError, "Could not generate transit details."))
    } finally {
      setIsGenerating(false)
    }
  }

  if (!editingOrder) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={handleGenerateTransit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-[#16131f] sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">
              {editingOrder.transitId ? "Add transit step" : "Create transit"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Order ID: {editingOrder.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transit editor"
            className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {loading && (
          <p className="mb-5 rounded-xl bg-[#f7f5fb] px-4 py-6 text-center text-sm text-gray-500 dark:bg-[#12101a]">
            Loading existing transit timeline...
          </p>
        )}
        {error && (
          <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className={`grid gap-4 sm:grid-cols-2 ${loading ? "pointer-events-none opacity-50" : ""}`}>
          <Field label="Delivery status">
            <select
              className={inputClass()}
              value={editingOrder.deliveryStatus}
              onChange={(event) => updateEditingOrder("deliveryStatus", event.target.value)}
            >
              {transitStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Carrier">
            <select
              className={inputClass()}
              value={editingOrder.carrier}
              onChange={(event) => updateEditingOrder("carrier", event.target.value)}
            >
              <option value="">Select carrier</option>
              {carrierOptions.map((carrier) => (
                <option key={carrier} value={carrier}>
                  {carrier}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black">Transit timeline</h3>
              <p className="text-xs text-gray-500">
                Existing steps stay. New steps are appended to currentLocation.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateEditingOrder("timeline", [...editingOrder.timeline, createTimelineEntry()])
              }
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200"
            >
              <Plus size={15} />
              Add step
            </button>
          </div>
          <div className="space-y-3">
            {[...editingOrder.timeline]
              .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
              .map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-3 rounded-xl border border-gray-100 bg-[#f7f5fb] p-3 dark:border-white/10 dark:bg-[#12101a] sm:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)_auto] sm:items-end"
                >
                  <Field label={entry.saved ? "Saved comment" : "Comment"}>
                    <textarea
                      readOnly={entry.saved}
                      className={inputClass(
                        `min-h-12 resize-y py-3 ${entry.saved ? "cursor-not-allowed bg-gray-100 dark:bg-white/5" : ""}`,
                      )}
                      value={entry.comment}
                      onChange={(event) => updateTimelineEntry(entry.id, "comment", event.target.value)}
                      placeholder="Arrived at sorting center"
                    />
                  </Field>
                  <Field label={entry.saved ? "Saved date and time" : "Date and time"}>
                    <input
                      readOnly={entry.saved}
                      type="datetime-local"
                      className={inputClass(entry.saved ? "cursor-not-allowed bg-gray-100 dark:bg-white/5" : "")}
                      value={formatDateTimeInput(entry.at)}
                      onChange={(event) =>
                        updateTimelineEntry(
                          entry.id,
                          "at",
                          event.target.value ? new Date(event.target.value).toISOString() : "",
                        )
                      }
                    />
                  </Field>
                  <Field label={entry.saved ? "Saved location" : "Current location"}>
                    <input
                      readOnly={entry.saved}
                      className={inputClass(entry.saved ? "cursor-not-allowed bg-gray-100 dark:bg-white/5" : "")}
                      value={entry.currentLocation}
                      onChange={(event) =>
                        updateTimelineEntry(entry.id, "currentLocation", event.target.value)
                      }
                      placeholder="Lagos sorting hub"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => removeTimelineEntry(entry.id)}
                    disabled={entry.saved || editingOrder.timeline.length === 1}
                    aria-label="Remove timeline step"
                    title="Remove timeline step"
                    className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-400">
            {editingOrder.transitId
              ? `Sending ${draftEntries.length} new step(s) appended to ${editingOrder.timeline.filter((e) => e.saved).length} existing.`
              : "Creates the transit with the step(s) below."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="h-11 cursor-pointer rounded-xl border border-gray-200 px-5 text-sm font-bold text-gray-600 hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formValid || isGenerating}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--theme) px-5 text-sm font-black text-(--theme-second) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Truck size={17} />
              {isGenerating
                ? "Saving..."
                : editingOrder.transitId
                  ? "Add step"
                  : "Create transit"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
