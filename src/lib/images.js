/**
 * Cloudinary Dynamic Image Optimization Utilities
 * 
 * Automatically applies Cloudinary transformations:
 * - f_auto: Serves modern formats (WebP/AVIF) depending on browser support
 * - q_auto: Intelligent compression to maintain quality while reducing payload
 * - w_{width}: Resizes image to exact display dimensions
 */

const IS_DEV = process.env.NODE_ENV !== "production"
const loggedUrls = new Set()

/**
 * Checks if a given URL is a Cloudinary image URL.
 */
export function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com") && url.includes("/upload/")
}

/**
 * Injects dynamic Cloudinary transformations into an image URL.
 * 
 * Example input:
 *   https://res.cloudinary.com/cloud/image/upload/v12345/products/shoe.jpg
 * Example output:
 *   https://res.cloudinary.com/cloud/image/upload/f_auto,q_auto,w_800,c_limit/v12345/products/shoe.jpg
 * 
 * @param {string} url - Original image URL
 * @param {object} options - Optimization options
 * @param {number} [options.width] - Max width in pixels (e.g., 400, 600, 800, 1200)
 * @param {string} [options.quality='auto'] - Compression quality ('auto', 'auto:eco', 'auto:good', 'auto:best')
 * @param {string} [options.format='auto'] - Format conversion ('auto', 'webp', 'avif')
 * @param {string} [options.crop='limit'] - Cloudinary crop mode ('limit', 'fill', 'scale')
 * @param {number} [options.dpr] - Device pixel ratio (optional)
 * @returns {string} - Optimized URL or original URL if not Cloudinary
 */
export function getOptimizedCloudinaryUrl(url, {
  width = 800,
  quality = "auto",
  format = "auto",
  crop = "limit",
  dpr = null,
} = {}) {
  if (!url || typeof url !== "string") {
    return url || "/thumbnail.webp"
  }

  // If it is not a Cloudinary URL, return as-is
  if (!isCloudinaryUrl(url)) {
    return url
  }

  try {
    const uploadIndex = url.indexOf("/upload/")
    if (uploadIndex === -1) return url

    const prefix = url.slice(0, uploadIndex + "/upload/".length)
    const suffix = url.slice(uploadIndex + "/upload/".length)

    // Build transformation string
    const transformations = []
    if (format) transformations.push(`f_${format}`)
    if (quality) transformations.push(`q_${quality}`)
    if (width) transformations.push(`w_${Math.round(width)}`)
    if (crop) transformations.push(`c_${crop}`)
    if (dpr) transformations.push(`dpr_${dpr}`)

    const transformString = transformations.join(",")

    // If the URL already contains transformation parameters right after /upload/, replace or avoid duplicate
    // Cloudinary transformations don't start with 'v' followed by digits (version) or a folder name
    let optimizedUrl
    if (/^(f_|q_|w_|h_|c_|dpr_|b_|e_|r_|t_|l_|u_|fl_|a_|g_|co_)/.test(suffix)) {
      // Replace existing transformation segment
      const nextSlashIndex = suffix.indexOf("/")
      const rest = nextSlashIndex !== -1 ? suffix.slice(nextSlashIndex + 1) : suffix
      optimizedUrl = `${prefix}${transformString}/${rest}`
    } else {
      optimizedUrl = `${prefix}${transformString}/${suffix}`
    }

    // Log only in dev mode and only once per unique URL to keep console clean
    if (IS_DEV && !loggedUrls.has(optimizedUrl)) {
      loggedUrls.add(optimizedUrl)
      console.log(`[Image Optimizer] Transformed Cloudinary URL (width=${width}px, format=${format}, quality=${quality}):`, {
        original: url,
        optimized: optimizedUrl,
      })
    }

    return optimizedUrl
  } catch (err) {
    console.warn("[Image Optimizer] Failed to transform URL:", url, err)
    return url
  }
}

/**
 * Generates a responsive srcset string for Cloudinary images.
 * Useful for <img> tags that want responsive resolution switching.
 * 
 * Example output:
 *   ".../w_400/... 400w, .../w_800/... 800w, .../w_1200/... 1200w"
 * 
 * @param {string} url - Original image URL
 * @param {number[]} widths - Array of target widths (default: [400, 800, 1200])
 * @returns {string|null} - srcset string or null if not Cloudinary
 */
export function getCloudinarySrcSet(url, widths = [400, 800, 1200]) {
  if (!isCloudinaryUrl(url)) return null

  return widths
    .map((w) => `${getOptimizedCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(", ")
}
