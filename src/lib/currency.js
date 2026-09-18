export const NAIRA_TO_DOLLAR_RATE = 1500

export function convertNairaToDollar(amountInNaira) {
  const numeric = Number(amountInNaira) || 0
  return numeric / NAIRA_TO_DOLLAR_RATE
}

export function formatDollar(amount) {
  const numeric = Number(amount) || 0
  return `$${numeric.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatNaira(amount) {
  const numeric = Number(amount) || 0
  return `₦${numeric.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format price for the user storefront.
 * The price returned from the endpoint (in Naira) is divided by 1500 to convert to Dollar before display.
 */
export function formatPrice(amount) {
  const dollarAmount = convertNairaToDollar(amount)
  return formatDollar(dollarAmount)
}

