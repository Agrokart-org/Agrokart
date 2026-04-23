/**
 * productImages.js
 * Maps product name keywords → LOCAL image paths in /src/assets/products/
 *
 * Categories (8 total):
 *   Bio-Fertilizers, Micronutrients, NPK Fertilizers, Organic,
 *   Pesticides, Seeds, Tools, Urea
 */

// ── Bio-Fertilizers ────────────────────────────────────────────────────────────
import azospirillum from "../assets/products/Bio-Fertilizers/Azospirillum Biofertilizer.webp";
import jivanu from "../assets/products/Bio-Fertilizers/Jivanu Biofertilizer.jpg";
import psb from "../assets/products/Bio-Fertilizers/PSB (Phosphate Solubilizing Bacteria).png";
import rhizobium from "../assets/products/Bio-Fertilizers/Rhizobium Biofertilizer.jpg";
import trichoderma from "../assets/products/Bio-Fertilizers/Trichoderma.webp";

// ── Micronutrients ────────────────────────────────────────────────────────────
import boron from "../assets/products/Micronutrients/Boron Fertilizer.webp";
import ferrousSulphateGranular from "../assets/products/Micronutrients/Ferrous Sulphate Granular.jpg";
import ferrousSulphate from "../assets/products/Micronutrients/Ferrous Sulphate.jpg";
import multiplex from "../assets/products/Micronutrients/Multiplex Micronutrient Mixture.webp";
import zincSulphate from "../assets/products/Micronutrients/Zinc Sulphate 21.jpg";

// ── NPK Fertilizers ────────────────────────────────────────────────────────────
import npk102626 from "../assets/products/NPK Fertilizers/10-26-26-(NPK).png";
import coromandel from "../assets/products/NPK Fertilizers/Coromandel NPK.jpg";
import iffcoNpk from "../assets/products/NPK Fertilizers/IFFCO NPK.jpeg";
import mahadhanNpk from "../assets/products/NPK Fertilizers/Mahadhan.jpg";
import sujala from "../assets/products/NPK Fertilizers/Sujala NPK.png";

// ── Organic ────────────────────────────────────────────────────────────────────
import cityCompost from "../assets/products/Organic/City Compost.jpg";
import cowDung from "../assets/products/Organic/Cow Dung Manure (Gobar Khad).webp";
import neemCake from "../assets/products/Organic/Neem Cake Fertilizer.jpg";
import prom from "../assets/products/Organic/PROM (Phosphate Rich Organic Manure).webp";
import vermicompost from "../assets/products/Organic/Vermicompost.jpg";

// ── Pesticides ────────────────────────────────────────────────────────────────
import actara from "../assets/products/Pesticides/Actara (Syngenta).webp";
import confidor from "../assets/products/Pesticides/Confidor (Bayer).jpg";
import coragen from "../assets/products/Pesticides/Coragen (FMC).jpeg";
import monocrotophos from "../assets/products/Pesticides/Monocrotophos 36 SL.jpg";
import ulala from "../assets/products/Pesticides/Ulala (UPL).png";

// ── Seeds ─────────────────────────────────────────────────────────────────────
import advantaCorn from "../assets/products/Seeds/Advanta Corn Seeds.jpg";
import cucumberSeeds from "../assets/products/Seeds/Cucumber Seeds.jpeg";
import kaveriWheat from "../assets/products/Seeds/Kaveri Wheat Seeds.jpeg";
import ladyFingerSeeds from "../assets/products/Seeds/Lady Finger Seeds.jpeg";
import mahycoCotton from "../assets/products/Seeds/Mahyco Cotton Seeds.avif";
import syngentaMaize from "../assets/products/Seeds/Syngenta Hybrid Maize Seeds.webp";
import tomatoSeeds from "../assets/products/Seeds/Tomato Seeds.jpeg";

// ── Tools ─────────────────────────────────────────────────────────────────────
import batterySprayer from "../assets/products/Tools/Battery Sprayer (12V).jpg";
import khurpi from "../assets/products/Tools/Khurpi (Hand Hoe).jpg";
import knapsackSprayer from "../assets/products/Tools/Manual Knapsack Sprayer (16L).png";
import seedPlanter from "../assets/products/Tools/Seed Planting Machine.webp";
import threeTeeth from "../assets/products/Tools/Three Teeth Cultivator.jpg";

// ── Urea ──────────────────────────────────────────────────────────────────────
import bharatUrea from "../assets/products/Urea/bharat_urea.jpg";
import iffcoUrea from "../assets/products/Urea/IFFCO Urea.jpg";
import neemCoatedUrea from "../assets/products/Urea/Neem-Coated-Urea.jpeg";
import nflNeemUrea from "../assets/products/Urea/NFL Neem Coated Urea.webp";
import ujwalaUrea from "../assets/products/Urea/Ujwala Neem Coated Urea.avif";

// ── Category default images (first image in each folder) ──────────────────────
export const CATEGORY_IMAGES = {
  "Bio-Fertilizers": rhizobium,
  Micronutrients: multiplex,
  "NPK Fertilizers": iffcoNpk,
  Organic: vermicompost,
  Pesticides: coragen,
  Seeds: advantaCorn,
  Tools: batterySprayer,
  Urea: bharatUrea,
  // legacy lowercase keys
  urea: bharatUrea,
  npk: iffcoNpk,
  biofertilizer: rhizobium,
  organic: vermicompost,
  dap: iffcoNpk,
};

// ── Keyword → image mapping (longest match wins) ──────────────────────────────
const PRODUCT_IMAGE_MAP = {
  // ── Bio-Fertilizers ──
  azospirillum: azospirillum,
  jivanu: jivanu,
  "phosphate solubilizing": psb,
  psb: psb,
  rhizobium: rhizobium,
  trichoderma: trichoderma,
  biofertilizer: rhizobium,
  "bio fertilizer": rhizobium,
  "bio-fertilizer": rhizobium,

  // ── Micronutrients ──
  "boron fertilizer": boron,
  boron: boron,
  "ferrous sulphate granular": ferrousSulphateGranular,
  "ferrous sulphate": ferrousSulphate,
  "iron sulphate": ferrousSulphate,
  "multiplex micronutrient": multiplex,
  multiplex: multiplex,
  "zinc sulphate": zincSulphate,
  "zinc-21": zincSulphate,
  micronutrient: multiplex,

  // ── NPK Fertilizers ──
  "10-26-26": npk102626,
  "coromandel npk": coromandel,
  "coromandel gromor": coromandel,
  "iffco npk": iffcoNpk,
  "mahadhan npk": mahadhanNpk,
  mahadhan: mahadhanNpk,
  "sujala npk": sujala,
  sujala: sujala,
  npk: iffcoNpk,

  // ── Organic ──
  "city compost": cityCompost,
  compost: cityCompost,
  "cow dung": cowDung,
  "gobar khad": cowDung,
  "neem cake": neemCake,
  prom: prom,
  "phosphate rich organic": prom,
  vermicompost: vermicompost,
  organic: vermicompost,

  // ── Pesticides ──
  actara: actara,
  "syngenta insecticide": actara,
  confidor: confidor,
  bayer: confidor,
  coragen: coragen,
  fmc: coragen,
  monocrotophos: monocrotophos,
  ulala: ulala,
  upl: ulala,
  pesticide: coragen,
  insecticide: monocrotophos,
  fungicide: trichoderma,
  herbicide: monocrotophos,

  // ── Seeds ──
  "advanta corn": advantaCorn,
  "corn seeds": advantaCorn,
  "cucumber seeds": cucumberSeeds,
  cucumber: cucumberSeeds,
  "kaveri wheat": kaveriWheat,
  "wheat seeds": kaveriWheat,
  "lady finger": ladyFingerSeeds,
  okra: ladyFingerSeeds,
  bhindi: ladyFingerSeeds,
  "mahyco cotton": mahycoCotton,
  "cotton seeds": mahycoCotton,
  "syngenta hybrid maize": syngentaMaize,
  "hybrid maize": syngentaMaize,
  "maize seeds": syngentaMaize,
  "tomato seeds": tomatoSeeds,
  tomato: tomatoSeeds,
  seeds: advantaCorn,
  seed: advantaCorn,

  // ── Tools ──
  "battery sprayer": batterySprayer,
  "12v sprayer": batterySprayer,
  khurpi: khurpi,
  "hand hoe": khurpi,
  "knapsack sprayer": knapsackSprayer,
  "manual sprayer": knapsackSprayer,
  "16l sprayer": knapsackSprayer,
  "seed planting machine": seedPlanter,
  "seed planter": seedPlanter,
  planter: seedPlanter,
  "three teeth": threeTeeth,
  cultivator: threeTeeth,
  sprayer: batterySprayer,
  hoe: khurpi,

  // ── Urea ──
  "bharat urea": bharatUrea,
  "iffco urea": iffcoUrea,
  "neem coated urea": neemCoatedUrea,
  "neem-coated": neemCoatedUrea,
  "nfl neem": nflNeemUrea,
  "ujwala neem": ujwalaUrea,
  ujwala: ujwalaUrea,
  urea: bharatUrea,
};

// ── Category fallback ─────────────────────────────────────────────────────────
const CATEGORY_FALLBACK = {
  "Bio-Fertilizers": rhizobium,
  Micronutrients: multiplex,
  "NPK Fertilizers": iffcoNpk,
  Organic: vermicompost,
  Pesticides: coragen,
  Seeds: advantaCorn,
  Tools: batterySprayer,
  Urea: bharatUrea,
  // legacy
  urea: bharatUrea,
  dap: iffcoNpk,
  npk: iffcoNpk,
  organic: vermicompost,
  other: batterySprayer,
};

/**
 * Returns the best-matching local image for a product.
 * @param {string} name - Product name
 * @param {string} category - Product category
 * @param {string} [existingImage] - Existing image URL from DB (preferred if it's a real URL)
 * @returns {string} Image path (imported asset or URL)
 */
export function getProductImage(name = "", category = "", existingImage = "") {
  // If DB has a real uploaded file URL (starts with /uploads/ or http), use it
  if (
    existingImage &&
    (existingImage.startsWith("/uploads/") ||
      existingImage.startsWith("http") ||
      existingImage.startsWith("data:"))
  ) {
    return existingImage;
  }

  const nameLower = (name || "").toLowerCase();

  // Search keyword map (longest match first for precision)
  const sortedKeys = Object.keys(PRODUCT_IMAGE_MAP).sort(
    (a, b) => b.length - a.length,
  );
  for (const keyword of sortedKeys) {
    if (nameLower.includes(keyword.toLowerCase())) {
      return PRODUCT_IMAGE_MAP[keyword];
    }
  }

  // Category fallback
  return CATEGORY_FALLBACK[category] || CATEGORY_FALLBACK["other"] || bharatUrea;
}

export default PRODUCT_IMAGE_MAP;
