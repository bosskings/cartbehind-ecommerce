export function formatNaira(amount) {
  const numeric = Number(amount) || 0
  return `₦${numeric.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDollar(amount) {
  const numeric = Number(amount) || 0
  return `$${numeric.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPrice(amount) {
  return formatNaira(amount)
}

