export function formatPrice(amount) {
  const numeric = Number(amount) || 0
  return `$${numeric.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
