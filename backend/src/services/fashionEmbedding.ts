import { WardrobeItem, AnalyzedGarmentResult, GarmentCategory } from '../types.js';

export const EMBEDDING_DIMENSION = 512;

// Standardized color coordinate mapping (Hue in radians, Saturation [0-1], Lightness [0-1])
const COLOR_MAP: Record<string, [number, number, number]> = {
  black: [0, 0, 0.05],
  '#000000': [0, 0, 0.05],
  '#050505': [0, 0, 0.05],
  '#1e293b': [3.75, 0.35, 0.17], // Navy slate
  navy: [3.8, 0.8, 0.2],
  charcoal: [0, 0, 0.2],
  grey: [0, 0, 0.5],
  gray: [0, 0, 0.5],
  white: [0, 0, 0.95],
  '#ffffff': [0, 0, 0.95],
  cream: [0.8, 0.2, 0.9],
  beige: [0.8, 0.3, 0.75],
  camel: [0.75, 0.5, 0.5],
  brown: [0.5, 0.6, 0.3],
  blue: [4.0, 0.8, 0.5],
  denim: [3.8, 0.5, 0.45],
  green: [2.1, 0.6, 0.4],
  olive: [1.8, 0.4, 0.35],
  red: [0, 0.8, 0.5],
  burgundy: [6.1, 0.6, 0.25],
  amber: [0.7, 0.8, 0.5],
  '#d97706': [0.7, 0.85, 0.45]
};

// Category indices for orthogonal projection
const CATEGORIES: GarmentCategory[] = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'One-Piece'];

// Common subcategories
const SUBCATEGORIES = [
  't-shirt', 'tee', 'shirt', 'oxford', 'blouse', 'sweater', 'knitwear', 'cardigan', 'hoodie', 'sweatshirt',
  'trousers', 'pants', 'jeans', 'denim', 'shorts', 'skirt', 'chinos', 'joggers',
  'blazer', 'coat', 'jacket', 'trench', 'overcoat', 'bomber', 'parka', 'puffer',
  'sneakers', 'boots', 'chelsea', 'derby', 'loafers', 'sandals', 'heels',
  'watch', 'belt', 'bag', 'tote', 'sunglasses', 'hat', 'scarf', 'jewelry',
  'dress', 'jumpsuit'
];

// Material vocabulary
const MATERIALS = [
  'wool', 'cashmere', 'merino', 'cotton', 'linen', 'silk', 'denim', 'leather',
  'suede', 'fleece', 'polyester', 'nylon', 'canvas', 'velvet', 'tweed', 'corduroy'
];

// Silhouette vocabulary
const SILHOUETTES = ['tailored', 'relaxed', 'oversized', 'slim', 'boxy', 'fitted', 'straight', 'wide'];

// Simple deterministic hash for text tokens to float values [-1, 1]
function hashTokenToFloat(str: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return ((h >>> 0) % 10000) / 5000.0 - 1.0;
}

/**
 * Generates a 512-dimensional normalized fashion visual & style fingerprint vector.
 */
export function generateFashionEmbedding(
  item: Partial<WardrobeItem> | AnalyzedGarmentResult
): number[] {
  const vector = new Float32Array(EMBEDDING_DIMENSION);

  const name = (item.name || '').toLowerCase();
  const category = (item.category || 'Tops') as GarmentCategory;
  const subcategory = (item.subcategory || '').toLowerCase();
  const colorPrimary = (item.colorPrimary || '').toLowerCase();
  const material = (item.material || '').toLowerCase();
  const silhouette = (item.silhouette || '').toLowerCase();
  const fit = (item.fit || '').toLowerCase();
  const pattern = (item.pattern || 'solid').toLowerCase();
  const formality = (item.formalityScore || 6) / 10.0; // 0.1 - 1.0

  // 1. Subspace 0..63: Category & Subcategory orthogonal projection
  const catIdx = CATEGORIES.indexOf(category);
  if (catIdx !== -1) {
    for (let i = 0; i < 10; i++) {
      vector[catIdx * 10 + i] = 1.2;
    }
  }
  SUBCATEGORIES.forEach((sub, sIdx) => {
    if (subcategory.includes(sub) || name.includes(sub)) {
      const offset = (sIdx % 30) + 30;
      vector[offset] = (vector[offset] || 0) + 1.0;
    }
  });

  // 2. Subspace 64..127: Color spectrum & chromatic features
  let [hue, sat, light] = [0, 0, 0.5];
  for (const [colKey, coords] of Object.entries(COLOR_MAP)) {
    if (colorPrimary.includes(colKey) || name.includes(colKey)) {
      [hue, sat, light] = coords;
      break;
    }
  }
  for (let i = 64; i < 96; i++) {
    const angle = (i - 64) * (Math.PI / 16);
    vector[i] = Math.cos(hue - angle) * sat;
  }
  for (let i = 96; i < 128; i++) {
    vector[i] = (light - 0.5) * 2.0 * ((i % 2 === 0) ? 1 : -1);
  }

  // 3. Subspace 128..191: Material, Texture & Fabric density
  MATERIALS.forEach((mat, mIdx) => {
    if (material.includes(mat) || name.includes(mat)) {
      for (let k = 0; k < 4; k++) {
        vector[128 + (mIdx * 4 + k) % 64] = 1.4;
      }
    }
  });

  // 4. Subspace 192..255: Silhouette, Fit & Architectural Shape
  SILHOUETTES.forEach((sil, silIdx) => {
    if (silhouette.includes(sil) || fit.includes(sil) || name.includes(sil)) {
      for (let k = 0; k < 8; k++) {
        vector[192 + (silIdx * 8 + k) % 64] = 1.3;
      }
    }
  });

  // 5. Subspace 256..319: Formality & Seasonality coordinates
  for (let i = 256; i < 288; i++) {
    vector[i] = (formality - 0.5) * 2.5;
  }
  const seasons = Array.isArray(item.seasonality) ? item.seasonality : ['Fall', 'Winter', 'Spring'];
  const seasonMap: Record<string, number> = { Spring: 288, Summer: 296, Fall: 304, Winter: 312 };
  seasons.forEach(s => {
    const startIdx = seasonMap[s] || 288;
    for (let k = 0; k < 8; k++) {
      vector[startIdx + k] = 1.0;
    }
  });

  // 6. Subspace 320..447: Pattern & Style Descriptors
  const styleWords = (item.styleDescriptors || []).concat([pattern]).map(s => s.toLowerCase());
  styleWords.forEach((word, wIdx) => {
    for (let k = 0; k < 8; k++) {
      const slot = 320 + ((wIdx * 8 + k) % 128);
      vector[slot] = hashTokenToFloat(word, k * 17);
    }
  });

  // 7. Subspace 448..511: Dense Semantic Token Hash
  const allTokens = `${name} ${subcategory} ${material} ${category}`.split(/\s+/);
  allTokens.forEach(token => {
    if (token.length > 2) {
      for (let k = 0; k < 4; k++) {
        const slot = 448 + ((hashTokenToFloat(token, k * 13) * 32 + 32) | 0) % 64;
        vector[slot] += hashTokenToFloat(token, k * 7);
      }
    }
  });

  // L2-Normalize the vector: sum(v_i^2) = 1.0
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1.0;
  const normalized = new Array(EMBEDDING_DIMENSION);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    normalized[i] = Number((vector[i] / norm).toFixed(6));
  }

  return normalized;
}

/**
 * Computes exact Cosine Similarity between two fashion vectors: (A . B) / (||A|| * ||B||)
 * Returns a value between 0.0 (0%) and 1.0 (100%).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0.0;
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0.0;

  const sim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Clamp between 0.0 and 1.0
  return Math.min(Math.max(sim, 0.0), 1.0);
}

export interface DuplicateMatchResult {
  item: WardrobeItem;
  similarity: number;
  similarityPercentage: number;
}

/**
 * Finds all items in the wardrobe that exceed a similarity threshold against a target embedding.
 * Sorted by highest similarity first.
 */
export function findWardrobeDuplicates(
  targetVector: number[],
  wardrobe: WardrobeItem[],
  threshold = 0.72
): DuplicateMatchResult[] {
  if (!targetVector || targetVector.length === 0 || wardrobe.length === 0) {
    return [];
  }

  const matches: DuplicateMatchResult[] = [];

  for (const item of wardrobe) {
    // Ensure item has an embedding vector
    const itemVec = item.embedding && item.embedding.length === EMBEDDING_DIMENSION
      ? item.embedding
      : generateFashionEmbedding(item);

    const sim = cosineSimilarity(targetVector, itemVec);
    if (sim >= threshold) {
      matches.push({
        item,
        similarity: sim,
        similarityPercentage: Math.round(sim * 100)
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}
