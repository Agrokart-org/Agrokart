/**
 * productImages.js
 * Maps product name keywords → LOCAL image paths in /public/images/products/
 *
 * Available local images:
 *   urea.jpg, urae.png               → Urea products
 *   dap.jpg, DAP.png                 → DAP products
 *   npk.jpg, npk.jpeg                → NPK / complex fertilizers
 *   organic-fertilizer.jpg           → Organic / bio products
 *   organic compost.jpeg             → Compost / vermicompost
 *
 * Priority: keyword name match → category fallback
 */

// ── Local image paths (served from /public) ──────────────────────────────────
const LOCAL = {
  urea: "/images/products/urea.jpg",
  dap: "/images/products/dap.jpg",
  npk: "/images/products/npk.jpg",
  organic: "/images/products/organic-fertilizer.jpg",
  compost: "/images/products/organic compost.jpeg",
  other: "/images/products/organic-fertilizer.jpg",
};

// ── Keyword → image mapping ───────────────────────────────────────────────────
const PRODUCT_IMAGE_MAP = {
  // ── Urea ──
  "nano urea": LOCAL.urea,
  "chambal uttam": LOCAL.urea,
  "iffco urea": LOCAL.urea,
  "kisan urea": LOCAL.urea,
  "kisan brand": LOCAL.urea,
  "rcf suphala urea": LOCAL.urea,
  "suphala urea": LOCAL.urea,
  "neem coated urea": LOCAL.urea,
  urea: LOCAL.urea,

  // ── DAP ──
  "nano dap": LOCAL.dap,
  "iffco dap": LOCAL.dap,
  "gromor dap": LOCAL.dap,
  "zuari jai kisaan": LOCAL.dap,
  "jai kisaan": LOCAL.dap,
  "coromandel dap": LOCAL.dap,
  "chambal dap": LOCAL.dap,
  "paradeep dap": LOCAL.dap,
  dap: LOCAL.dap,
  diammonium: LOCAL.dap,

  // ── NPK / Complex ──
  "iffco npk": LOCAL.npk,
  "gromor 14-35": LOCAL.npk,
  "gromor npk": LOCAL.npk,
  gromor: LOCAL.npk,
  "water soluble npk": LOCAL.npk,
  "19-19-19": LOCAL.npk,
  "boost 52": LOCAL.npk,
  "zuari boost": LOCAL.npk,
  mkp: LOCAL.npk,
  "tata paras": LOCAL.npk,
  "suphala 15": LOCAL.npk,
  npk: LOCAL.npk,
  "ammonium phosphate": LOCAL.npk,

  // ── Organic / Bio ──
  "multiplex neem": LOCAL.organic,
  "neem cake": LOCAL.organic,
  "parry neemazal": LOCAL.organic,
  neemazal: LOCAL.organic,
  "consortium biofertilizer": LOCAL.organic,
  biofertilizer: LOCAL.organic,
  "godrej vipul": LOCAL.compost,
  vermicompost: LOCAL.compost,
  "organic compost": LOCAL.compost,
  "humic acid": LOCAL.organic,
  trichoderma: LOCAL.organic,
  neem: LOCAL.organic,

  // ── Pesticides / Crop Protection ──
  "tata tafgor": LOCAL.other,
  tafgor: LOCAL.other,
  dimethoate: LOCAL.other,
  "upl saaf": LOCAL.other,
  "saaf fungicide": LOCAL.other,
  carbendazim: LOCAL.other,
  "tata manik": LOCAL.other,
  "tata rallis manik": LOCAL.other,
  acetamiprid: LOCAL.other,
  "upl ulala": LOCAL.other,
  ulala: LOCAL.other,
  flonicamid: LOCAL.other,
  "syngenta karate": LOCAL.other,
  "bayer confidor": LOCAL.other,
  insecticide: LOCAL.other,
  fungicide: LOCAL.other,
  herbicide: LOCAL.other,
};

// ── Category fallback ─────────────────────────────────────────────────────────
const CATEGORY_FALLBACK = {
  urea: LOCAL.urea,
  dap: LOCAL.dap,
  npk: LOCAL.npk,
  organic: LOCAL.organic,
  other: LOCAL.other,
};

/**
 * Returns the best-matching local image path for a product.
 * @param {string} name - Product name
 * @param {string} category - Product category (urea/dap/npk/organic/other)
 * @param {string} [existingImage] - Existing image from DB
 * @returns {string} Image path
 */
export function getProductImage(name = "", category = "", existingImage = "") {
  // Use DB image if it's already a LOCAL path
  if (existingImage && existingImage.startsWith("/images/")) {
    return existingImage;
  }

  const nameLower = (name || "").toLowerCase();

  // Search keyword map (longest match first for precision)
  const sortedKeys = Object.keys(PRODUCT_IMAGE_MAP).sort(
    (a, b) => b.length - a.length,
  );
  for (const keyword of sortedKeys) {
    if (nameLower.includes(keyword)) {
      return PRODUCT_IMAGE_MAP[keyword];
    }
  }

  // Fall back to category image
  return CATEGORY_FALLBACK[(category || "").toLowerCase()] || LOCAL.other;
}

export default PRODUCT_IMAGE_MAP;
