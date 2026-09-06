export const carrierOptions = [
  "DHL",
  "FedEx",
  "UPS",
  "USPS",
  "Aramex",
  "GIG Logistics",
  "Other",
]

export const transitStatusOptions = [
  "PENDING",
  "IN_TRANSIT",
  "DELIVERED",
  "EXCEPTION",
  "CANCELLED",
]

export function formatOrderDate(value) {
  if (!value) return "No purchase date"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "No purchase date" : date.toLocaleString("en-NG")
}

export function formatDateTimeInput(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function createTimelineEntry() {
  return {
    id: `draft-${Date.now()}-${Math.random()}`,
    comment: "",
    at: "",
    currentLocation: "",
    saved: false,
  }
}

export function getTransitFromResponse(response) {
  return response?.transit || response?.data?.transit || response?.data || response || null
}

export function mapTransitEntries(transit) {
  return (Array.isArray(transit?.currentLocation) ? transit.currentLocation : [])
    .map((entry) => ({
      id: entry._id,
      comment: entry.description || "",
      at: entry.timestamp || transit.shippedDate || "",
      currentLocation: entry.location || "",
      saved: true,
    }))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}
