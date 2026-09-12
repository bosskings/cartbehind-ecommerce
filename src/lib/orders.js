import axios from "axios"

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL
}

function getApiErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback
}

function isAdminAuthError(error) {
  const status = error?.response?.status || error?.status
  return status === 401 || status === 403
}

function getHeaders(authToken) {
  if (!authToken) {
    throw new Error("You must be logged in to view orders.")
  }

  return {
    Authorization: `Bearer ${authToken}`,
  }
}

function getBackendUrlOrThrow() {
  const backendUrl = getBackendUrl()
  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  return backendUrl
}

export function normalizeOrder(rawOrder) {
  if (!rawOrder || typeof rawOrder !== "object") return null

  const destination =
    rawOrder.deliveryDetails ||
    rawOrder.destination ||
    rawOrder.shipping ||
    rawOrder.delivery ||
    rawOrder.deliveryAddress ||
    {}
  const payment = rawOrder.payment || rawOrder.paymentInfo || {}
  const items = rawOrder.items || rawOrder.products || rawOrder.orderItems || []
  const hasTotal = rawOrder.total != null || rawOrder.amount != null || rawOrder.grandTotal != null
  const hasItemCount =
    rawOrder.itemCount != null || rawOrder.quantity != null || (Array.isArray(items) && items.length > 0)
  const trackingCode =
    rawOrder.trackingCode ||
    rawOrder.tracking_code ||
    rawOrder.trackingId ||
    rawOrder.tracking_id ||
    ""
  const id = rawOrder.id || rawOrder._id || rawOrder.orderId || rawOrder.order_id || ""

  const rawDeliveryDetails = rawOrder.deliveryDetails || {
    address: destination.address || destination.street || rawOrder.address || "",
    city: destination.city || rawOrder.city || "",
    stateOrProvince: destination.stateOrProvince || destination.state || rawOrder.state || "",
    country: destination.country || rawOrder.country || "",
    postCode: destination.postCode || destination.postalCode || destination.zipCode || "",
  }

  return {
    ...rawOrder,
    id,
    orderId: id,
    trackingCode,
    status: rawOrder.status || rawOrder.orderStatus || rawOrder.deliveryStatus || "Processing",
    deliveryStatus: rawOrder.deliveryStatus || rawOrder.status || "PENDING",
    paymentStatus: rawOrder.paymentStatus || payment.status || payment.paymentStatus || "",
    total: Number(rawOrder.total ?? rawOrder.amount ?? rawOrder.grandTotal ?? 0) || 0,
    hasTotal,
    createdAt:
      rawOrder.createdAt || rawOrder.created_at || rawOrder.datePurchased || rawOrder.date || rawOrder.updatedAt,
    itemCount: Number(rawOrder.itemCount ?? rawOrder.quantity ?? items.length) || items.length || 0,
    hasItemCount,
    items: Array.isArray(items) ? items : [],
    payment: {
      ...payment,
      txRef: payment.txRef || payment.tx_ref || rawOrder.txRef || rawOrder.tx_ref || "",
      transactionId:
        payment.transactionId ||
        payment.transaction_id ||
        rawOrder.transactionId ||
        rawOrder.transaction_id ||
        "",
    },
    destination: {
      address: destination.address || destination.street || rawOrder.address || "",
      city: destination.city || rawOrder.city || "",
      state: destination.state || destination.stateOrProvince || rawOrder.state || "",
      country: destination.country || rawOrder.country || "",
      postCode: destination.postCode || destination.postalCode || destination.zipCode || "",
    },
    deliveryDetails: rawDeliveryDetails,
    deliveryNote: rawOrder.deliveryNote || "",
    transit: rawOrder.transit || null,
  }
}

export function normalizeOrdersResponse(data) {
  const orders =
    (Array.isArray(data) && data) ||
    (Array.isArray(data?.orders) && data.orders) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data?.data?.orders) && data.data.orders) ||
    []

  return orders.map(normalizeOrder).filter(Boolean)
}

export function normalizeSingleOrderResponse(data) {
  const order = data?.order || data?.data?.order || data?.data || data
  return normalizeOrder(order)
}

export function normalizeAdminOrder(rawOrder) {
  const order = normalizeOrder(rawOrder)
  if (!order) return null

  const timeline = Array.isArray(rawOrder.timeline)
    ? rawOrder.timeline
      .map((event, index) => ({
        ...event,
        id: event.id || event._id || `timeline-${index}`,
        comment: event.comment || event.note || event.title || "",
        at: event.at || event.dateTime || event.datetime || event.date || "",
        currentLocation: event.currentLocation || event.location || "",
      }))
      .filter((event) => event.comment || event.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    : []

  const userObj =
    typeof rawOrder.userId === "object" && rawOrder.userId !== null
      ? rawOrder.userId
      : typeof rawOrder.user === "object" && rawOrder.user !== null
        ? rawOrder.user
        : null

  const extractedEmail =
    rawOrder.email ||
    rawOrder.userEmail ||
    rawOrder.customerEmail ||
    userObj?.email ||
    order.email ||
    ""

  const rawUserId =
    typeof rawOrder.userId === "string"
      ? rawOrder.userId
      : userObj?._id || userObj?.id || order.userId || ""

  return {
    ...order,
    id: rawOrder._id || order.id,
    orderId: rawOrder._id || order.id,
    status: rawOrder.deliveryStatus || order.status,
    deliveryStatus: rawOrder.deliveryStatus || order.status,
    paymentStatus: rawOrder.paymentStatus || order.paymentStatus,
    currentLocation: rawOrder.currentLocation || rawOrder.location || "",
    timeline,
    datePurchased: rawOrder.datePurchased || order.createdAt || "",
    userId: rawUserId,
    email: extractedEmail,
    deliveryDetails: rawOrder.deliveryDetails || order.deliveryDetails || null,
    deliveryNote: rawOrder.deliveryNote || order.deliveryNote || "",
    transit: rawOrder.transit || order.transit || null,
  }
}

export function normalizeAdminOrdersResponse(data) {
  const orders =
    (Array.isArray(data?.orders) && data.orders) ||
    (Array.isArray(data?.data?.orders) && data.data.orders) ||
    []

  return orders.map(normalizeAdminOrder).filter(Boolean).sort((a, b) =>
    new Date(b.datePurchased || b.createdAt || 0).getTime() -
    new Date(a.datePurchased || a.createdAt || 0).getTime(),
  )
}

export async function fetchUserOrders(authToken) {
  const backendUrl = getBackendUrlOrThrow()
  const response = await axios.get(`${backendUrl}/api/v1/users/orders`, {
    headers: getHeaders(authToken),
  })

  return normalizeOrdersResponse(response.data)
}

export async function fetchUserOrder(authToken, orderId) {
  const backendUrl = getBackendUrlOrThrow()
  const response = await axios.get(`${backendUrl}/api/v1/users/orders/${orderId}`, {
    headers: getHeaders(authToken),
  })

  return normalizeSingleOrderResponse(response.data)
}

export async function fetchUserTrackedParcel(authToken, trackingCode) {
  const backendUrl = getBackendUrlOrThrow()
  const response = await axios.get(
    `${backendUrl}/api/v1/users/track-parcel/${encodeURIComponent(trackingCode)}`,
    { headers: getHeaders(authToken) },
  )

  return response.data
}

export async function fetchAdminOrders(authToken) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) throw new Error("Admin authentication is required to view orders.")

  const response = await axios.get(`${backendUrl}/api/v1/admin/orders`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })

  return normalizeAdminOrdersResponse(response.data)
}

export async function fetchAdminOverview(authToken) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) throw new Error("Admin authentication is required to view the overview.")

  const response = await axios.get(`${backendUrl}/api/v1/admin/overview`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })

  return response.data
}

export async function createAdminTransit(authToken, payload) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) throw new Error("Admin authentication is required to create transit.")

  const response = await axios.post(`${backendUrl}/api/v1/admin/transit`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  })

  return response.data
}

export async function addAdminTransitStep(authToken, transitId, payload) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) throw new Error("Admin authentication is required to add a transit step.")

  const response = await axios.patch(`${backendUrl}/api/v1/admin/transit/${transitId}`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  })

  return response.data
}

export async function fetchAdminTransit(authToken, orderId) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) throw new Error("Admin authentication is required to view transit details.")

  const response = await axios.get(`${backendUrl}/api/v1/admin/transit/${orderId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })

  return response.data
}

export async function updateAdminTransit(authToken, currentLocationId, payload) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) throw new Error("Admin authentication is required to update transit details.")

  const response = await axios.put(`${backendUrl}/api/v1/admin/transit/${currentLocationId}`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  })

  return response.data
}

export async function fetchAdminCartDetails(authToken, orderId) {
  const backendUrl = getBackendUrlOrThrow()
  if (!authToken) throw new Error("Admin authentication is required to view cart details.")
  if (!orderId) throw new Error("Order ID is required.")

  const url = `${backendUrl}/api/v1/admin/cart-details/${encodeURIComponent(orderId)}`

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${authToken}` },
  })

  return response.data
}

export function normalizeCartDetailsResponse(data) {
  if (!data) return []

  const rawItems =
    (Array.isArray(data) && data) ||
    (Array.isArray(data?.cart) && data.cart) ||
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.products) && data.products) ||
    (Array.isArray(data?.data?.cart) && data.data.cart) ||
    (Array.isArray(data?.data?.items) && data.data.items) ||
    (Array.isArray(data?.data?.products) && data.data.products) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data?.cartDetails) && data.cartDetails) ||
    []

  return rawItems.map((item, index) => {
    const product = item?.product && typeof item.product === "object" ? item.product : {}
    const id = item?._id || item?.id || product?._id || product?.id || `item-${index}`
    const name = item?.name || product?.name || product?.title || "Unnamed Product"
    const price = Number(item?.price ?? product?.price ?? 0) || 0
    const quantity = Number(item?.quantity ?? item?.count ?? item?.qty ?? 1) || 1
    const category = product?.category || item?.category || "General"
    const description = product?.description || item?.description || ""
    const stock = product?.stock != null ? Number(product.stock) : null

    const images = Array.isArray(product?.images)
      ? product.images
      : Array.isArray(item?.images)
        ? item.images
        : []
    const firstImg = images[0]
    const imageUrl =
      (typeof firstImg === "string" ? firstImg : firstImg?.url) ||
      product?.image?.url ||
      (typeof product?.image === "string" ? product.image : null) ||
      item?.image?.url ||
      (typeof item?.image === "string" ? item.image : null) ||
      "/thumbnail.webp"

    const deliveryNote =
      (typeof item?.deliveryNote === "string" && item.deliveryNote.trim()) ||
      (typeof product?.deliveryNote === "string" && product.deliveryNote.trim()) ||
      ""

    return {
      id,
      itemId: item?._id || item?.id || id,
      productId: product?._id || product?.id || "",
      name,
      price,
      quantity,
      subtotal: price * quantity,
      category,
      description,
      stock,
      deliveryNote,
      images,
      imageUrl,
      rawItem: item,
    }
  })
}

export { getApiErrorMessage, isAdminAuthError }

