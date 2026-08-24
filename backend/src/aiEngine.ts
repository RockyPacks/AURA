import { GoogleGenAI } from '@google/genai';
import { WardrobeItem, ContextInput, GeneratedOutfit, ShoppingAnalysis, GarmentCategory } from './types.js';
import { getAllWardrobeItems, getWearEvents } from './store.js';

// Explanation generation cache: hash(itemIds) -> { explanation, generatedAt }
const explanationCache = new Map<string, { explanation: string; generatedAt: string; generatedBy: string }>();

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// ============================================================================
// WEATHER-AWARE OUTFIT FILTERING SYSTEM (Requirement 14)
// ============================================================================

/**
 * Filters wardrobe items by temperature appropriateness
 * Hot (>25°C): Exclude heavy materials, keep breathable
 * Warm (18-25°C): All materials acceptable
 * Cool (10-18°C): Keep layers, avoid very light items
 * Cold (<10°C): Prioritize warm materials, filter out light t-shirts
 */
export function filterByTemperature(items: WardrobeItem[], tempCelsius: number): WardrobeItem[] {
  if (items.length === 0) return items;

  if (tempCelsius > 25) {
    // Hot weather: exclude heavy materials
    const heavyMaterials = ['wool', 'cashmere', 'leather', 'suede'];
    return items.filter(item => 
      !heavyMaterials.some(material => item.material.toLowerCase().includes(material))
    );
  } else if (tempCelsius < 10) {
    // Cold weather: prioritize warm materials and outerwear
    // At minimum, keep all items (don't filter to empty)
    const warmMaterials = ['wool', 'cashmere', 'fleece', 'insulated', 'down'];
    const coldAppropriate = items.filter(item =>
      item.category === 'Outerwear' ||
      warmMaterials.some(material => item.material.toLowerCase().includes(material))
    );
    
    // If no warm items found, return all items (don't return empty)
    return coldAppropriate.length > 0 ? coldAppropriate : items;
  } else if (tempCelsius >= 10 && tempCelsius <= 18) {
    // Cool weather: layers are good, but avoid extremely light items
    const extremeLightMaterials = ['silk', 'thin cotton'];
    return items.filter(item =>
      !extremeLightMaterials.some(material => item.material.toLowerCase().includes(material))
    );
  }

  // Warm (18-25°C): all materials acceptable
  return items;
}

/**
 * Filters wardrobe items by weather condition appropriateness
 * Rain: Exclude suede, light fabrics; prioritize waterproof shoes
 * Snow: Prioritize insulated, water-resistant items
 * Wind: Exclude very loose items; prefer fitted items
 * Sunny/Cloudy: No filtering
 */
export function filterByWeatherCondition(
  items: WardrobeItem[],
  weather: 'Sunny' | 'Rain' | 'Cloudy' | 'Snow' | 'Windy'
): WardrobeItem[] {
  if (items.length === 0) return items;

  if (weather === 'Rain') {
    // Exclude problematic materials for rain
    const rainProblematic = ['suede', 'silk', 'linen'];
    const filtered = items.filter(item =>
      !rainProblematic.some(material => item.material.toLowerCase().includes(material))
    );
    
    // If all items excluded, return originals (never empty)
    return filtered.length > 0 ? filtered : items;
  } else if (weather === 'Snow') {
    // Only keep insulated items
    const insulatedMaterials = ['wool', 'cashmere', 'fleece', 'insulated', 'down'];
    const snowAppropriate = items.filter(item =>
      item.category === 'Outerwear' ||
      insulatedMaterials.some(material => item.material.toLowerCase().includes(material))
    );
    
    // Return at least the original items if no insulated found
    return snowAppropriate.length > 0 ? snowAppropriate : items;
  } else if (weather === 'Windy') {
    // Prefer fitted items, exclude very loose silhouettes
    const looseSilhouettes = ['oversized', 'boxy', 'loose', 'flowing', 'baggy'];
    const fittedItems = items.filter(item =>
      !looseSilhouettes.some(silhouette => 
        item.silhouette?.toLowerCase().includes(silhouette) ||
        item.fit?.toLowerCase().includes('loose') ||
        item.fit?.toLowerCase().includes('baggy')
      )
    );
    
    // Return fitted items if available, otherwise return originals
    return fittedItems.length > 0 ? fittedItems : items;
  }

  // Sunny/Cloudy: no filtering
  return items;
}

/**
 * Filters wardrobe items by seasonality
 * Items must have the inferred season in their seasonality array
 * Allow adjacent seasons for flexibility
 */
export function filterBySeasonality(items: WardrobeItem[], inferredSeason: string): WardrobeItem[] {
  if (items.length === 0) return items;

  // Season adjacency map for flexibility
  const seasonMap: { [key: string]: string[] } = {
    'Summer': ['Spring', 'Summer', 'Fall'],
    'Winter': ['Fall', 'Winter', 'Spring'],
    'Spring': ['Winter', 'Spring', 'Summer'],
    'Fall': ['Summer', 'Fall', 'Winter']
  };

  const allowedSeasons = seasonMap[inferredSeason] || [inferredSeason, 'All'];

  const filtered = items.filter(item =>
    item.seasonality && 
    item.seasonality.length > 0 &&
    item.seasonality.some(s => allowedSeasons.includes(s))
  );

  // If no items match seasonality, return originals (never empty)
  return filtered.length > 0 ? filtered : items;
}

/**
 * Calculates a weather appropriateness score (0-100) for a single item
 * Considers temperature, weather condition, seasonality, and material properties
 */
export function calculateWeatherAppropriatenessScore(item: WardrobeItem, context: ContextInput): number {
  const tempNum = parseInt(context.temperature.replace(/[^0-9-]/g, ''), 10) || 18;
  let score = 50; // Base score

  // Temperature appropriateness
  if (tempNum > 25) {
    // Hot: breathable materials get boost, heavy materials get penalty
    const breathableMaterials = ['cotton', 'linen', 'silk'];
    const heavyMaterials = ['wool', 'cashmere', 'leather', 'suede'];
    
    if (breathableMaterials.some(m => item.material.toLowerCase().includes(m))) {
      score += 30;
    }
    if (heavyMaterials.some(m => item.material.toLowerCase().includes(m))) {
      score -= 20;
    }
    
    // Light colors boost for heat
    if (item.colorPrimary.toLowerCase().includes('white') || 
        item.colorPrimary.toLowerCase().includes('beige') ||
        item.colorPrimary === '#ffffff' ||
        item.colorPrimary === '#f5f5dc') {
      score += 15;
    }
  } else if (tempNum < 10) {
    // Cold: warm materials and outerwear get boost
    const warmMaterials = ['wool', 'cashmere', 'fleece', 'insulated', 'down'];
    
    if (item.category === 'Outerwear') {
      score += 25;
    }
    if (warmMaterials.some(m => item.material.toLowerCase().includes(m))) {
      score += 25;
    }
  } else if (tempNum >= 10 && tempNum <= 18) {
    // Cool: layers are appropriate
    const layerFriendly = ['wool', 'cotton', 'cashmere', 'fleece'];
    if (layerFriendly.some(m => item.material.toLowerCase().includes(m))) {
      score += 15;
    }
  }

  // Weather condition adjustments
  if (context.weather === 'Rain') {
    const rainProblematic = ['suede', 'silk', 'linen'];
    const rainFriendly = ['leather', 'rubber', 'waterproof'];
    
    if (rainProblematic.some(m => item.material.toLowerCase().includes(m))) {
      score -= 25;
    }
    if (rainFriendly.some(m => item.material.toLowerCase().includes(m))) {
      score += 20;
    }
    if (item.category === 'Shoes' && rainFriendly.some(m => item.material.toLowerCase().includes(m))) {
      score += 15; // Extra boost for waterproof shoes
    }
  } else if (context.weather === 'Snow') {
    const snowMaterials = ['wool', 'cashmere', 'fleece', 'insulated', 'down'];
    if (snowMaterials.some(m => item.material.toLowerCase().includes(m))) {
      score += 20;
    }
    if (item.category === 'Outerwear') {
      score += 15;
    }
  } else if (context.weather === 'Windy') {
    const looseSilhouettes = ['oversized', 'boxy', 'loose', 'flowing', 'baggy'];
    const fittedSilhouettes = ['fitted', 'slim', 'tailored', 'structured'];
    
    if (fittedSilhouettes.some(s => item.fit?.toLowerCase().includes(s) || item.silhouette?.toLowerCase().includes(s))) {
      score += 15;
    }
    if (looseSilhouettes.some(s => item.fit?.toLowerCase().includes(s) || item.silhouette?.toLowerCase().includes(s))) {
      score -= 15;
    }
  }

  // Seasonality match
  const inferredSeason = inferSeasonFromContext(context);
  const seasonMap: { [key: string]: string[] } = {
    'Summer': ['Spring', 'Summer', 'Fall'],
    'Winter': ['Fall', 'Winter', 'Spring'],
    'Spring': ['Winter', 'Spring', 'Summer'],
    'Fall': ['Summer', 'Fall', 'Winter']
  };
  const allowedSeasons = seasonMap[inferredSeason] || [inferredSeason];
  
  if (item.seasonality && item.seasonality.some(s => allowedSeasons.includes(s))) {
    score += 20;
  } else {
    score -= 10;
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Infers season from temperature and weather conditions
 */
function inferSeasonFromContext(context: ContextInput): string {
  const tempNum = parseInt(context.temperature.replace(/[^0-9-]/g, ''), 10) || 18;

  if (tempNum > 25) return 'Summer';
  if (tempNum < 10) return 'Winter';
  if (context.weather === 'Rain') return 'Fall';
  if (context.weather === 'Snow') return 'Winter';
  if (tempNum >= 18 && tempNum <= 25) return 'Spring';
  
  return 'Spring';
}

/**
 * Master filtering function that applies all weather-aware filters to an outfit
 * Returns minimum 1 item (never empty)
 */
export function filterOutfitByWeather(
  itemIds: string[],
  context: ContextInput
): string[] {
  if (itemIds.length === 0) return itemIds;

  const wardrobe = getAllWardrobeItems();
  const itemMap = new Map(wardrobe.map(item => [item.id, item]));

  // Collect items
  const items = itemIds
    .map(id => itemMap.get(id))
    .filter((item): item is WardrobeItem => item !== undefined);

  if (items.length === 0) return itemIds; // If items not found, return originals

  // Parse temperature
  const tempNum = parseInt(context.temperature.replace(/[^0-9-]/g, ''), 10) || 18;

  // Apply all filters sequentially
  let filtered = items;
  
  // 1. Temperature filter
  filtered = filterByTemperature(filtered, tempNum);
  
  // 2. Weather condition filter
  filtered = filterByWeatherCondition(filtered, context.weather);
  
  // 3. Seasonality filter
  const season = inferSeasonFromContext(context);
  filtered = filterBySeasonality(filtered, season);

  // 4. Map back to IDs
  const filteredIds = filtered.map(item => item.id);

  // 5. Ensure at least 1 item is returned
  if (filteredIds.length === 0) {
    return itemIds.slice(0, 1); // Return at least the first original item
  }

  return filteredIds;
}

// ============================================================================
// COMPATIBILITY SCORING SYSTEM (Requirements 13, 14)
// ============================================================================

export interface ScoringBreakdown {
  colorHarmony: number;
  styleCompatibility: number;
  occasionAlignment: number;
  weatherSuitability: number;
  seasonalityMatch: number;
}

/**
 * Normalizes colors to hex format for comparison
 */
function normalizeColor(color: string): string {
  if (color.startsWith('#')) return color.toLowerCase();
  const colorMap: { [key: string]: string } = {
    'white': '#ffffff',
    'black': '#000000',
    'gray': '#808080',
    'grey': '#808080',
    'red': '#ff0000',
    'blue': '#0000ff',
    'green': '#008000',
    'yellow': '#ffff00',
    'navy': '#000080',
    'beige': '#f5f5dc',
    'brown': '#a52a2a',
    'charcoal': '#36454f',
    'olive': '#808000'
  };
  return colorMap[color.toLowerCase()] || '#808080';
}

/**
 * Calculates color harmony score (0-100)
 * Considers complementary colors, intensity matching, and monochromatic options
 */
export function calculateColorHarmonyScore(items: WardrobeItem[]): number {
  if (items.length === 0) return 50;

  const colors = items.map(i => normalizeColor(i.colorPrimary)).filter(c => c);
  if (colors.length === 0) return 50;

  // Define complementary color pairs
  const complementaryPairs = [
    ['#000000', '#ffffff'],
    ['#ffffff', '#000000'],
    ['#000080', '#ffffff'], // navy + white
    ['#ffffff', '#000080'],
    ['#ff8c00', '#e0e0e0'], // orange + neutral
    ['#e0e0e0', '#ff8c00']
  ];

  let score = 60; // Base score

  // Check for complementary pairs
  for (let i = 0; i < colors.length - 1; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const pair = [colors[i], colors[j]];
      const isComplementary = complementaryPairs.some(cp =>
        (cp[0] === pair[0] && cp[1] === pair[1]) ||
        (cp[1] === pair[0] && cp[0] === pair[1])
      );
      if (isComplementary) {
        score += 25;
        break;
      }
    }
  }

  // Check for monochromatic (all similar colors - within same color family)
  const uniqueColors = new Set(colors);
  if (uniqueColors.size === 1) {
    score += 20; // Monochromatic is safe default
  } else if (uniqueColors.size === 2) {
    score += 10; // Two colors is acceptable
  }

  // Check for intensity matching (vibrant vs muted)
  const vibrantColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
  const mutedColors = ['#808080', '#c0c0c0', '#a9a9a9', '#d3d3d3'];

  const vibrantCount = colors.filter(c => 
    vibrantColors.some(vc => c.includes(vc.substring(0, 5)))
  ).length;
  
  const mutedCount = colors.filter(c => 
    mutedColors.some(mc => c.includes(mc.substring(0, 5)))
  ).length;

  if ((vibrantCount > 0 && mutedCount > 0) || (vibrantCount === 0 && mutedCount === 0)) {
    // Mixed vibrancy or all neutral - slightly penalize
    score -= 5;
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Calculates style compatibility score (0-100)
 * Ensures consistency: casual+casual, smart+smart, athletic+athletic
 */
export function calculateStyleCompatibilityScore(items: WardrobeItem[]): number {
  if (items.length < 2) return 85;

  const styleCategories: { [key: string]: string[] } = {
    casual: ['t-shirt', 'jeans', 'sneaker', 'hoodie', 'sweatshirt', 'casual', 'relaxed'],
    smart: ['blazer', 'trousers', 'tailored', 'dress', 'shirt', 'oxford', 'loafer', 'structured'],
    athletic: ['sneaker', 'athletic', 'jogger', 'track', 'gym', 'sports', 'training'],
    bohemian: ['bohemian', 'flowy', 'printed', 'maxi', 'ethnic', 'boho']
  };

  const getStyle = (item: WardrobeItem): string => {
    const name = item.name.toLowerCase();
    const subcat = item.subcategory.toLowerCase();
    for (const [style, keywords] of Object.entries(styleCategories)) {
      if (keywords.some(kw => name.includes(kw) || subcat.includes(kw))) {
        return style;
      }
    }
    return 'neutral';
  };

  const styles = items.map(i => getStyle(i));
  const uniqueStyles = new Set(styles);

  // All same style is ideal
  if (uniqueStyles.size === 1) {
    return 95;
  }

  // Two compatible styles is acceptable
  if (uniqueStyles.size === 2) {
    const stylesArray = Array.from(uniqueStyles);
    const compatiblePairs = [
      ['casual', 'bohemian'],
      ['smart', 'athletic'],
      ['casual', 'athletic']
    ];
    
    const isCompatible = compatiblePairs.some(pair =>
      (stylesArray.includes(pair[0]) && stylesArray.includes(pair[1])) ||
      (stylesArray.includes(pair[1]) && stylesArray.includes(pair[0]))
    );
    
    return isCompatible ? 75 : 60;
  }

  // More than 2 different styles is problematic
  return 45;
}

/**
 * Calculates occasion alignment score (0-100)
 * Matches formality levels to occasion preferences
 */
export function calculateOccasionAlignmentScore(items: WardrobeItem[], context: ContextInput): number {
  if (items.length === 0) return 50;

  const occasionRanges: { [key: string]: [number, number] } = {
    'Work Pitch': [6, 9],
    'Casual Coffee': [1, 4],
    'Evening Dinner': [7, 10],
    'Weekend Travel': [3, 6],
    'Gym & Active': [1, 3]
  };

  const targetRange = occasionRanges[context.occasion] || [4, 7];
  const avgFormality = items.reduce((sum, i) => sum + i.formalityScore, 0) / items.length;

  const deviation = Math.abs(avgFormality - context.formalityPreference);

  // Penalty based on deviation from target formality
  if (deviation <= 0.5) return 100;
  if (deviation <= 1) return 95;
  if (deviation <= 2) return 85;
  if (deviation <= 3) return 75;
  return Math.max(50, 100 - deviation * 10);
}

/**
 * Calculates weather suitability score (0-100)
 * Considers temperature, precipitation, wind, humidity, and materials
 */
export function calculateWeatherSuitabilityScore(items: WardrobeItem[], context: ContextInput): number {
  if (items.length === 0) return 50;

  const tempNum = parseInt(context.temperature.replace(/[^0-9-]/g, ''), 10) || 18;
  let score = 70; // Base score

  // Temperature-based material recommendations
  if (tempNum > 25) {
    // Hot: prefer breathable materials and light colors
    const breathableItems = items.filter(i =>
      i.material.toLowerCase().includes('cotton') ||
      i.material.toLowerCase().includes('linen') ||
      i.material.toLowerCase().includes('silk')
    );
    const lightColorItems = items.filter(i =>
      i.colorPrimary.toLowerCase().includes('white') ||
      i.colorPrimary.toLowerCase().includes('beige') ||
      i.colorPrimary.includes('#f') ||
      i.colorPrimary.includes('#e')
    );
    score += Math.floor((breathableItems.length / items.length) * 20);
    score += Math.floor((lightColorItems.length / items.length) * 10);
  } else if (tempNum >= 18 && tempNum <= 25) {
    // Warm: flexible options
    score += 5;
  } else if (tempNum >= 10 && tempNum < 18) {
    // Cool: layers and medium materials
    const layerItems = items.filter(i =>
      i.category === 'Outerwear' ||
      i.material.toLowerCase().includes('wool') ||
      i.material.toLowerCase().includes('fleece')
    );
    score += Math.floor((layerItems.length / items.length) * 25);
  } else if (tempNum < 10) {
    // Cold: warm materials and outerwear
    const warmItems = items.filter(i =>
      i.material.toLowerCase().includes('wool') ||
      i.material.toLowerCase().includes('cashmere') ||
      i.category === 'Outerwear'
    );
    score += Math.floor((warmItems.length / items.length) * 25);
  }

  // Precipitation adjustments
  if (context.weather === 'Rain') {
    const waterproofShoes = items.filter(i =>
      i.category === 'Shoes' && (
        i.material.toLowerCase().includes('leather') ||
        i.material.toLowerCase().includes('rubber') ||
        i.material.toLowerCase().includes('waterproof')
      )
    );
    const waterproofOuterwear = items.filter(i =>
      i.category === 'Outerwear' &&
      i.material.toLowerCase().includes('water')
    );
    
    if (waterproofShoes.length > 0) score += 15;
    if (waterproofOuterwear.length > 0) score += 10;
  }

  if (context.weather === 'Snow') {
    const insulatedItems = items.filter(i =>
      i.material.toLowerCase().includes('wool') ||
      i.material.toLowerCase().includes('cashmere') ||
      i.material.toLowerCase().includes('fleece') ||
      i.material.toLowerCase().includes('insulated')
    );
    if (insulatedItems.length > 0) score += 20;
  }

  // Wind: prefer fitted items
  if (context.weather === 'Windy') {
    const fittedItems = items.filter(i =>
      i.fit?.toLowerCase().includes('fitted') ||
      i.silhouette?.toLowerCase().includes('slim') ||
      i.silhouette?.toLowerCase().includes('tailored')
    );
    score += Math.floor((fittedItems.length / items.length) * 10);
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Calculates seasonality match score (0-100)
 * Ensures items match the requested season
 */
export function calculateSeasonalityMatchScore(items: WardrobeItem[], context: ContextInput): number {
  if (items.length === 0) return 50;

  // Infer season from temperature if not explicitly provided
  const tempNum = parseInt(context.temperature.replace(/[^0-9-]/g, ''), 10) || 18;
  let season = 'Spring'; // default
  
  if (tempNum > 25) season = 'Summer';
  else if (tempNum < 10) season = 'Winter';
  else if (context.weather === 'Rain') season = 'Fall';

  const itemsMatchingSeason = items.filter(i =>
    i.seasonality && i.seasonality.includes(season)
  ).length;

  const matchPercentage = (itemsMatchingSeason / items.length) * 100;

  // Score based on seasonality match percentage
  if (matchPercentage >= 90) return 100;
  if (matchPercentage >= 75) return 90;
  if (matchPercentage >= 50) return 75;
  if (matchPercentage >= 25) return 50;
  return 30;
}

/**
 * Calculates overall compatibility score from all components
 * Weighted: 25% each for color, style, occasion, weather; seasonality separate
 */
export function calculateCompatibilityScore(
  items: WardrobeItem[],
  context: ContextInput
): { score: number; breakdown: ScoringBreakdown } {
  if (items.length === 0) {
    return {
      score: 0,
      breakdown: {
        colorHarmony: 0,
        styleCompatibility: 0,
        occasionAlignment: 0,
        weatherSuitability: 0,
        seasonalityMatch: 0
      }
    };
  }

  const colorHarmony = calculateColorHarmonyScore(items);
  const styleCompatibility = calculateStyleCompatibilityScore(items);
  const occasionAlignment = calculateOccasionAlignmentScore(items, context);
  const weatherSuitability = calculateWeatherSuitabilityScore(items, context);
  const seasonalityMatch = calculateSeasonalityMatchScore(items, context);

  const compatibilityScore = Math.round(
    (colorHarmony * 0.25) +
    (styleCompatibility * 0.25) +
    (occasionAlignment * 0.25) +
    (weatherSuitability * 0.25)
  );

  return {
    score: Math.min(Math.max(compatibilityScore, 0), 100),
    breakdown: {
      colorHarmony,
      styleCompatibility,
      occasionAlignment,
      weatherSuitability,
      seasonalityMatch
    }
  };
}

export interface FieldConfidence {
  field: string;
  confidence: number;
  isLowConfidence: boolean; // True if < 0.7 (threshold)
}

export interface AnalyzedGarmentResult {
  name: string;
  category: GarmentCategory;
  subcategory: string;
  colorPrimary: string;
  colorSecondary?: string;
  pattern: string;
  material: string;
  brand: string | null;
  silhouette?: string;
  fit?: string;
  formalityScore: number;
  seasonality: string[];
  estimatedValueUSD: number;
  condition: 'New' | 'Excellent' | 'Good' | 'Worn';
  confidence: number;
  styleDescriptors?: string[];
  imageUrl?: string;
  fieldConfidences?: FieldConfidence[]; // Per-field confidence scores
}

export async function analyzeGarmentImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<AnalyzedGarmentResult> {
  const ai = getAiClient();
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  if (ai) {
    try {
      const prompt = `You are AURA Garment Vision Intelligence. Analyze this piece of clothing.
Extract structured metadata accurately. 
CRITICAL RULE ON BRAND: Only identify brand if a logo, label, or unmistakable trademark pattern is clearly visible. If not 100% visible, set "brand": null. Do NOT hallucinate brands.
Assess confidence between 0.0 and 1.0 for each field. Mark fields with confidence < 0.7 as uncertain.

Return ONLY valid JSON matching this schema:
{
  "name": "Descriptive, elegant garment name (e.g. Relaxed Merino Wool Knit)",
  "category": "Tops" | "Bottoms" | "Outerwear" | "Shoes" | "Accessories" | "One-Piece",
  "subcategory": "e.g. Sweater, T-Shirt, Jeans, Trousers, Blazer, Sneakers, Boots",
  "colorPrimary": "Primary Hex or Clean Color Name (e.g. #1E293B or Charcoal Grey)",
  "colorSecondary": "Secondary color or null",
  "pattern": "Solid | Striped | Checkered | Graphic | Ribbed | Textured",
  "material": "e.g. 100% Virgin Wool, 14oz Raw Denim, Calfskin Leather, Organic Cotton",
  "brand": "string or null",
  "silhouette": "e.g. Relaxed, Tailored, Oversized, Slim, Boxy",
  "fit": "e.g. Regular Fit, Drop Shoulder, Straight Leg",
  "formalityScore": number from 1 to 10 (1=loungewear, 5=smart casual, 10=black tie),
  "seasonality": ["Spring", "Summer", "Fall", "Winter"],
  "estimatedValueUSD": number (realistic retail estimate),
  "condition": "New" | "Excellent" | "Good" | "Worn",
  "confidence": number between 0.50 and 0.99 (overall confidence),
  "styleDescriptors": ["e.g. Minimalist", "Architectural", "Monochrome"],
  "fieldConfidences": [
    {"field": "colorPrimary", "confidence": 0.95},
    {"field": "brand", "confidence": 0.60},
    {"field": "material", "confidence": 0.85},
    {"field": "formalityScore", "confidence": 0.88},
    {"field": "fit", "confidence": 0.65},
    {"field": "silhouette", "confidence": 0.80}
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.name && parsed.category) {
        // Add low-confidence flags to fieldConfidences
        const fieldConfs = (parsed.fieldConfidences || []).map((fc: any) => ({
          ...fc,
          isLowConfidence: fc.confidence < 0.7
        }));
        
        return {
          name: parsed.name,
          category: parsed.category,
          subcategory: parsed.subcategory || 'Garment',
          colorPrimary: parsed.colorPrimary || '#1E293B',
          colorSecondary: parsed.colorSecondary || undefined,
          pattern: parsed.pattern || 'Solid',
          material: parsed.material || 'Natural Fiber',
          brand: parsed.brand || null,
          silhouette: parsed.silhouette || 'Tailored',
          fit: parsed.fit || 'Regular',
          formalityScore: Math.min(Math.max(parsed.formalityScore || 6, 1), 10),
          seasonality: Array.isArray(parsed.seasonality) ? parsed.seasonality : ['Fall', 'Winter', 'Spring'],
          estimatedValueUSD: parsed.estimatedValueUSD || 180,
          condition: parsed.condition || 'Excellent',
          confidence: parsed.confidence || 0.88,
          styleDescriptors: parsed.styleDescriptors || ['Modern Minimalist'],
          fieldConfidences: fieldConfs,
          imageUrl: imageBase64
        };
      }
    } catch (err) {
      console.warn('[AURA Vision] Gemini Vision call failed, using graceful deterministic fallback:', err);
    }
  }

  return {
    name: 'Fine Knit Merino Crewneck',
    category: 'Tops',
    subcategory: 'Knitwear',
    colorPrimary: '#27272A',
    pattern: 'Solid',
    material: '100% Merino Wool',
    brand: null,
    silhouette: 'Relaxed Tailored',
    fit: 'Regular',
    formalityScore: 6,
    seasonality: ['Fall', 'Winter', 'Spring'],
    estimatedValueUSD: 160,
    condition: 'Excellent',
    confidence: 0.82,
    styleDescriptors: ['Minimalist', 'Timeless'],
    fieldConfidences: [
      { field: 'colorPrimary', confidence: 0.85, isLowConfidence: false },
      { field: 'material', confidence: 0.75, isLowConfidence: false },
      { field: 'brand', confidence: 0.50, isLowConfidence: true },
      { field: 'fit', confidence: 0.65, isLowConfidence: true }
    ],
    imageUrl: imageBase64
  };
}

/**
 * Generates a cache key from outfit item IDs
 */
function generateCacheKey(itemIds: string[]): string {
  return itemIds.sort().join(',');
}

/**
 * Generates an AI-powered explanation for an outfit
 * Falls back to template if AI unavailable or times out
 */
export async function generateOutfitExplanation(
  items: WardrobeItem[],
  context: ContextInput,
  userPreferences?: { favoriteColors?: string[]; avoidColors?: string[] }
): Promise<{ explanation: string; generatedBy: 'gemini-2.5-flash' | 'fallback'; generatedAt: string }> {
  const cacheKey = generateCacheKey(items.map(i => i.id));
  const cached = explanationCache.get(cacheKey);
  
  if (cached) {
    const cacheAge = Date.now() - new Date(cached.generatedAt).getTime();
    const MAX_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    if (cacheAge < MAX_CACHE_TTL) {
      return {
        explanation: cached.explanation,
        generatedBy: cached.generatedBy as 'gemini-2.5-flash' | 'fallback',
        generatedAt: cached.generatedAt
      };
    }
  }

  const ai = getAiClient();
  if (ai) {
    try {
      // Build a detailed description of the outfit
      const itemDescriptions = items.map(item => 
        `${item.name} (${item.category}, ${item.colorPrimary}, ${item.material})`
      ).join(', ');

      const colors = items.map(i => i.colorPrimary).join(', ');
      const styles = [...new Set(items.map(i => i.silhouette || 'Standard').filter(s => s !== 'Standard'))];
      const formalityAvg = Math.round(items.reduce((sum, i) => sum + i.formalityScore, 0) / items.length);

      const prompt = `You are an expert fashion stylist helping users understand their outfit combinations. Create a concise, engaging explanation that:
- Is 2-3 sentences total (max 150 characters)
- Explains color coordination choices
- References the occasion/weather context when provided
- Builds user confidence without being patronizing
- Uses natural, conversational language
- Never mentions that this is AI-generated

Outfit Details:
- Items: ${itemDescriptions}
- Colors: ${colors}
- Styles: ${styles.length > 0 ? styles.join(', ') : 'Mixed'}
- Occasion: ${context.occasion}
- Weather: ${context.temperature}, ${context.weather}
- Formality Level: ${formalityAvg}/10${userPreferences?.favoriteColors ? ` (User prefers: ${userPreferences.favoriteColors.join(', ')})` : ''}

Provide a 2-3 sentence explanation that makes this combination appealing and explains why it works.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
          temperature: 0.7,
          maxOutputTokens: 150
        }
      });

      let explanation = response.text?.trim() || '';
      
      // Validate explanation
      const validation = validateExplanation(explanation);
      if (validation.isValid) {
        const result = {
          explanation,
          generatedBy: 'gemini-2.5-flash' as const,
          generatedAt: new Date().toISOString()
        };
        explanationCache.set(cacheKey, result);
        return result;
      } else {
        console.warn('[AURA Explanation] Validation failed:', validation.reason, '- using fallback');
      }
    } catch (err: any) {
      console.warn('[AURA Explanation] Gemini call failed:', err.message, '- using fallback');
      // Fall through to template-based fallback
    }
  }

  // Fallback: Template-based explanation
  const formalityAvg = Math.round(items.reduce((sum, i) => sum + i.formalityScore, 0) / items.length);
  const tempNum = parseInt(context.temperature.replace(/[^0-9]/g, ''), 10) || 18;
  const weatherDesc = context.weather.toLowerCase();
  
  const formalities: { [key: number]: string } = {
    1: 'relaxed',
    2: 'casual',
    3: 'casual',
    4: 'casual',
    5: 'smart casual',
    6: 'business casual',
    7: 'business',
    8: 'formal',
    9: 'black tie',
    10: 'black tie'
  };
  
  const formalityLevel = formalities[Math.min(formalityAvg, 10)] || 'smart casual';
  const weatherAdj = tempNum > 20 ? 'breathable' : tempNum > 10 ? 'layered' : 'warm';
  
  const explanations = [
    `This ${formalityLevel} outfit combines ${items[0]?.name} with complementary pieces for ${context.occasion}. The ${weatherAdj} layers ensure comfort in ${weatherDesc} conditions.`,
    `Perfectly calibrated for ${context.occasion} in ${context.temperature} ${weatherDesc} weather. The color palette harmonizes beautifully while maintaining structure and polish.`,
    `A seamless ensemble that balances style and practicality for your day. The ${weatherAdj} composition works across weather shifts while looking intentional and put-together.`
  ];
  
  const explanation = explanations[Math.floor(Math.random() * explanations.length)];
  const result = {
    explanation,
    generatedBy: 'fallback' as const,
    generatedAt: new Date().toISOString()
  };
  
  // Cache the fallback too
  explanationCache.set(cacheKey, result);
  return result;
}

/**
 * Validates that an explanation meets quality criteria
 */
export function validateExplanation(explanation: string): { isValid: boolean; reason?: string } {
  if (!explanation || typeof explanation !== 'string') {
    return { isValid: false, reason: 'Explanation is empty or not a string' };
  }

  if (explanation.length > 150) {
    return { isValid: false, reason: `Explanation too long: ${explanation.length} chars (max 150)` };
  }

  if (explanation.length < 20) {
    return { isValid: false, reason: `Explanation too short: ${explanation.length} chars (min 20)` };
  }

  // Check for profanity or AI markers (simple heuristic)
  const aiMarkers = ['as an ai', 'as a language model', 'i am an', 'this is ai', 'artificial intelligence'];
  if (aiMarkers.some(marker => explanation.toLowerCase().includes(marker))) {
    return { isValid: false, reason: 'Explanation contains AI-generated markers' };
  }

  return { isValid: true };
}

/**
 * Generates a creative outfit title (3-5 words)
 */
export async function generateOutfitTitle(items: WardrobeItem[], context: ContextInput): Promise<string> {
  const ai = getAiClient();
  
  if (ai) {
    try {
      const styles = items.map(i => i.silhouette || 'Tailored').filter((v, i, a) => a.indexOf(v) === i);
      const colors = items.map(i => i.colorPrimary).slice(0, 2);
      
      const prompt = `Generate a short, punchy outfit title (3-5 words max) that captures this ensemble's essence. Be creative and editorial.
Items: ${items.map(i => i.name).join(', ')}
Styles: ${styles.join(', ')}
Colors: ${colors.join(', ')}
Occasion: ${context.occasion}

Return only the title, nothing else. Example format: "Modern Executive Architecture"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { maxOutputTokens: 20 }
      });

      let title = response.text?.trim() || '';
      if (title.length > 0 && title.length <= 60) {
        return title;
      }
    } catch (err) {
      console.warn('[AURA Title] Gemini call failed - using fallback');
    }
  }

  // Fallback titles
  const formalityAvg = Math.round(items.reduce((sum, i) => sum + i.formalityScore, 0) / items.length);
  const fallbacks: { [key: string]: string } = {
    work: formalityAvg >= 8 ? 'Executive Power' : formalityAvg >= 6 ? 'Business Refined' : 'Work Ready',
    casual: 'Weekend Vibes',
    dinner: 'Evening Elegance',
    gym: 'Active Comfort',
    travel: 'Versatile Journey'
  };

  const occasionKey = context.occasion.toLowerCase().split(' ')[0];
  return fallbacks[occasionKey] || 'Curated Look';
}

export async function generateOutfitsFromWardrobe(context: ContextInput): Promise<GeneratedOutfit[]> {
  const wardrobe = getAllWardrobeItems();
  const wearEvents = getWearEvents();

  const cleanWardrobe = wardrobe.filter(item => item.status !== 'in_wash' && !item.isDirty);
  
  if (cleanWardrobe.length < 2) {
    return [
      {
        id: 'outfit-empty',
        title: 'Wardrobe Refresh Needed',
        explanation: 'Most of your wardrobe is currently in the wash. Mark pieces as clean in your wardrobe view to generate fresh looks.',
        itemIds: cleanWardrobe.map(i => i.id),
        items: cleanWardrobe,
        formalityScore: 5,
        weatherMatchScore: 50,
        confidenceScore: 60,
        compatibilityScore: 30,
        scoringBreakdown: {
          colorHarmony: 50,
          styleCompatibility: 50,
          occasionAlignment: 50,
          weatherSuitability: 50,
          seasonalityMatch: 50
        },
        whyReasons: ['Clean garments are needed to build complete ensembles']
      }
    ];
  }

  const recentWearCutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recentlyWornIds = new Set<string>();
  wearEvents.forEach(e => {
    const eventTime = e.timestamp || e.wornAt || new Date().toISOString();
    if (new Date(eventTime).getTime() > recentWearCutoff) {
      e.itemIds.forEach(id => recentlyWornIds.add(id));
    }
  });

  const tops = cleanWardrobe.filter(i => i.category === 'Tops');
  const bottoms = cleanWardrobe.filter(i => i.category === 'Bottoms');
  const outerwear = cleanWardrobe.filter(i => i.category === 'Outerwear');
  const shoes = cleanWardrobe.filter(i => i.category === 'Shoes');

  interface OutfitCandidate {
    items: WardrobeItem[];
    score: number;
    notes: string[];
    compatibilityScore: number;
    scoringBreakdown: ScoringBreakdown;
  }

  const candidateCombinations: OutfitCandidate[] = [];

  const tempNum = parseInt(context.temperature.replace(/[^0-9]/g, ''), 10) || 18;
  const isColdOrCool = tempNum <= 20 || context.weather === 'Rain' || context.weather === 'Windy';
  const targetFormality = context.formalityPreference || (context.occasion === 'Work Pitch' ? 8 : context.occasion === 'Evening Dinner' ? 7 : 4);

  for (const top of (tops.length > 0 ? tops : cleanWardrobe.slice(0, 2))) {
    for (const bottom of (bottoms.length > 0 ? bottoms : cleanWardrobe.slice(0, 2))) {
      if (top.id === bottom.id) continue;

      for (const shoe of (shoes.length > 0 ? shoes : [undefined])) {
        if (shoe && (shoe.id === top.id || shoe.id === bottom.id)) continue;

        const currentItems: WardrobeItem[] = [top, bottom];
        if (shoe) currentItems.push(shoe);

        if (isColdOrCool && outerwear.length > 0) {
          const compatibleOuter = outerwear.find(o => !recentlyWornIds.has(o.id)) || outerwear[0];
          if (compatibleOuter && !currentItems.some(i => i.id === compatibleOuter.id)) {
            currentItems.push(compatibleOuter);
          }
        }

        // Calculate compatibility score using all scoring components
        const { score: compatScore, breakdown } = calculateCompatibilityScore(currentItems, context);

        let notes: string[] = [];
        const hasRecentlyWorn = currentItems.some(i => recentlyWornIds.has(i.id));
        if (!hasRecentlyWorn) {
          notes.push('Promotes healthy closet rotation (items rested for >48h)');
        }

        const avgFormality = currentItems.reduce((acc, i) => acc + i.formalityScore, 0) / currentItems.length;
        const formalityDiff = Math.abs(avgFormality - targetFormality);
        if (formalityDiff <= 1.5) {
          notes.push(`Harmonizes with ${context.occasion} formality level`);
        }

        candidateCombinations.push({
          items: currentItems,
          score: compatScore,
          notes,
          compatibilityScore: compatScore,
          scoringBreakdown: breakdown
        });
      }
    }
  }

  candidateCombinations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  const topCandidates = candidateCombinations.slice(0, 4);

  if (topCandidates.length === 0) {
    topCandidates.push({
      items: cleanWardrobe.slice(0, 3),
      score: 75,
      notes: ['Assembled from currently available pieces'],
      compatibilityScore: 75,
      scoringBreakdown: {
        colorHarmony: 70,
        styleCompatibility: 75,
        occasionAlignment: 75,
        weatherSuitability: 80,
        seasonalityMatch: 75
      }
    });
  }

  // Generate explanations for all outfits with proper error handling and timeout
  const results: GeneratedOutfit[] = [];
  
  for (let idx = 0; idx < topCandidates.length; idx++) {
    const candidate = topCandidates[idx];
    
    // Apply weather filtering to outfit items (Requirement 14)
    const filteredItemIds = filterOutfitByWeather(
      candidate.items.map(i => i.id),
      context
    );
    
    // Get the filtered items
    const filteredItems = filteredItemIds
      .map(id => candidate.items.find(i => i.id === id))
      .filter((item): item is WardrobeItem => item !== undefined);
    
    // If all items were filtered out, use originals (safety check)
    const itemsToUse = filteredItems.length > 0 ? filteredItems : candidate.items;
    const avgFormality = Math.round(itemsToUse.reduce((s, i) => s + i.formalityScore, 0) / itemsToUse.length);
    
    // Generate explanation with timeout handling
    let explanationResult: { explanation: string; generatedBy: 'gemini-2.5-flash' | 'fallback'; generatedAt: string } = { 
      explanation: '', 
      generatedBy: 'fallback', 
      generatedAt: new Date().toISOString() 
    };
    try {
      const timeoutPromise = new Promise<{ explanation: string; generatedBy: 'gemini-2.5-flash' | 'fallback'; generatedAt: string }>((_, reject) =>
        setTimeout(() => reject(new Error('Explanation generation timeout')), 3000)
      );
      
      explanationResult = await Promise.race([
        generateOutfitExplanation(itemsToUse, context),
        timeoutPromise
      ]);
    } catch (err) {
      console.warn(`[AURA] Explanation generation failed or timed out for outfit ${idx}:`, (err as Error).message);
      // Use fallback
      explanationResult = {
        explanation: `Calibrated for ${context.location} (${context.temperature}, ${context.weather}). Seamlessly transitions for ${context.occasion} with high color and silhouette harmony.`,
        generatedBy: 'fallback',
        generatedAt: new Date().toISOString()
      };
    }

    // Calculate weather appropriateness score for filtered outfit
    const weatherScores = itemsToUse.map(item => calculateWeatherAppropriatenessScore(item, context));
    const avgWeatherScore = Math.round(weatherScores.reduce((a, b) => a + b, 0) / weatherScores.length);

    results.push({
      id: `outfit-${Date.now()}-${idx}`,
      title: avgFormality >= 8 
        ? 'Executive Modern Tailoring' 
        : avgFormality >= 6 
        ? 'Smart Architectural Contrast' 
        : 'Signature Effortless Casual',
      explanation: explanationResult.explanation,
      itemIds: itemsToUse.map(i => i.id),
      items: itemsToUse,
      itemNames: itemsToUse.map(i => i.name),
      formalityScore: avgFormality,
      weatherMatchScore: Math.min(Math.max(avgWeatherScore, candidate.score - 10), 98),
      confidenceScore: Math.min(candidate.score - 2, 96),
      confidenceBoostScore: Math.min(candidate.score - 2, 96),
      compatibilityScore: candidate.compatibilityScore,
      scoringBreakdown: candidate.scoringBreakdown,
      whyReasons: [
        ...candidate.notes,
        `Weather-optimized for ${context.temperature} and ${context.weather} conditions`
      ].slice(0, 3),
      heroImageUrl: itemsToUse[0]?.imageUrl,
      explanationGeneratedBy: explanationResult.generatedBy,
      explanationGeneratedAt: explanationResult.generatedAt
    });
  }

  return results;
}

export function swapOutfitItem(currentItemIds: string[], targetItemId: string, replacementItemId: string): {
  updatedItemIds: string[];
  recalculatedScore: number;
  compatibilityNote: string;
} {
  const wardrobe = getAllWardrobeItems();
  const cleanItems = wardrobe.filter(i => i.status !== 'in_wash' && !i.isDirty);
  const replacement = cleanItems.find(i => i.id === replacementItemId);

  if (!replacement) {
    throw new Error('Replacement item not available or currently in wash.');
  }

  const updatedIds = currentItemIds.map(id => id === targetItemId ? replacementItemId : id);
  const ensembleItems = updatedIds.map(id => wardrobe.find(w => w.id === id)).filter(Boolean) as WardrobeItem[];

  const avgFormality = ensembleItems.reduce((acc, i) => acc + i.formalityScore, 0) / ensembleItems.length;
  const recalculatedScore = Math.min(Math.round(85 + (10 - Math.abs(avgFormality - replacement.formalityScore))), 99);

  return {
    updatedItemIds: updatedIds,
    recalculatedScore,
    compatibilityNote: `Swapped to ${replacement.name}. Ensemble rebalanced with ${recalculatedScore}% harmony.`
  };
}

export async function analyzeShoppingItem(
  name: string,
  priceUSD: number,
  category: GarmentCategory,
  imageBase64?: string
): Promise<ShoppingAnalysis> {
  const wardrobe = getAllWardrobeItems();
  const cleanWardrobe = wardrobe.filter(i => i.status !== 'in_wash' && !i.isDirty);

  const lowerName = name.toLowerCase();
  const duplicateCandidates = wardrobe.filter(existing => {
    const existingLower = existing.name.toLowerCase();
    const sameCat = existing.category === category;
    const sameSubcat = existing.subcategory && lowerName.includes(existing.subcategory.toLowerCase());
    const similarKeywords = existingLower.split(' ').filter(w => w.length > 3 && lowerName.includes(w));
    return sameCat && (sameSubcat || similarKeywords.length >= 2);
  });

  const duplicateRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 
    duplicateCandidates.length >= 2 ? 'HIGH' : duplicateCandidates.length === 1 ? 'MEDIUM' : 'NONE';

  let complementaryItems: WardrobeItem[] = [];
  if (category === 'Tops') {
    complementaryItems = cleanWardrobe.filter(i => i.category === 'Bottoms' || i.category === 'Outerwear' || i.category === 'Shoes');
  } else if (category === 'Bottoms') {
    complementaryItems = cleanWardrobe.filter(i => i.category === 'Tops' || i.category === 'Shoes' || i.category === 'Outerwear');
  } else if (category === 'Outerwear') {
    complementaryItems = cleanWardrobe.filter(i => i.category === 'Tops' || i.category === 'Bottoms');
  } else {
    complementaryItems = cleanWardrobe.filter(i => i.category === 'Tops' || i.category === 'Bottoms');
  }

  const bottomsCount = Math.max(cleanWardrobe.filter(i => i.category === 'Bottoms').length, 1);
  const topsCount = Math.max(cleanWardrobe.filter(i => i.category === 'Tops').length, 1);
  const shoesCount = Math.max(cleanWardrobe.filter(i => i.category === 'Shoes').length, 1);

  let unlockedCount = 0;
  if (category === 'Tops') {
    unlockedCount = bottomsCount * shoesCount;
  } else if (category === 'Bottoms') {
    unlockedCount = topsCount * shoesCount;
  } else if (category === 'Outerwear') {
    unlockedCount = Math.min(topsCount * bottomsCount, 12);
  } else {
    unlockedCount = topsCount * bottomsCount;
  }

  unlockedCount = Math.max(Math.min(unlockedCount, 18), 1);

  if (duplicateRisk === 'HIGH') {
    unlockedCount = 0;
  } else if (duplicateRisk === 'MEDIUM') {
    unlockedCount = Math.floor(unlockedCount * 0.4);
  }

  const projectedWears = Math.max(unlockedCount * 3, 1);
  const costPerWear = (priceUSD / projectedWears).toFixed(2);

  let verdictType: 'BUY' | 'SKIP' | 'CONSIDER' = 'BUY';
  let verdictHeadline = '';
  let verdictSub = '';
  const reasoning: string[] = [];

  if (duplicateRisk === 'HIGH') {
    verdictType = 'SKIP';
    verdictHeadline = `SKIP — YOU ALREADY OWN ${duplicateCandidates.length} NEAR DUPLICATES`;
    verdictSub = `You currently own ${duplicateCandidates.map(d => d.name).join(' and ')}. Purchasing this piece delivers near 0% new aesthetic versatility.`;
    reasoning.push(`High functional overlap with ${duplicateCandidates[0]?.name}`);
    reasoning.push('Zero new silhouette versatility added to your closet');
  } else if (duplicateRisk === 'MEDIUM') {
    verdictType = 'CONSIDER';
    verdictHeadline = `CONSIDER — MODERATE DUPLICATE OVERLAP`;
    verdictSub = `Shares stylistic overlap with ${duplicateCandidates[0]?.name}. Only buy if upgrading material or fit.`;
    reasoning.push(`Similar to your ${duplicateCandidates[0]?.name}`);
    reasoning.push(`Unlocks ${unlockedCount} combinations with existing wardrobe`);
  } else if (unlockedCount >= 6) {
    verdictType = 'BUY';
    verdictHeadline = `BUY — UNLOCKS ${unlockedCount} NEW OUTFITS`;
    verdictSub = `This piece synergizes seamlessly with ${complementaryItems.length} pieces in your closet, yielding an attractive projected cost-per-wear of $${costPerWear}.`;
    reasoning.push(`Pairs effortlessly with ${complementaryItems.slice(0, 3).map(i => i.name).join(', ')}`);
    reasoning.push(`High wardrobe synergy (${unlockedCount} distinct looks created)`);
    reasoning.push(`Estimated Cost-Per-Wear: $${costPerWear}`);
  } else {
    verdictType = 'CONSIDER';
    verdictHeadline = 'CONSIDER — LOW WARDROBE HARMONY';
    verdictSub = `This piece only pairs with ${complementaryItems.length} pieces you currently own ($${costPerWear}/wear).`;
    reasoning.push('Limited pairing options with current pieces');
  }

  return {
    id: `shop-analysis-${Date.now()}`,
    title: name,
    price: priceUSD,
    category,
    verdictType,
    verdict: verdictHeadline,
    verdictSub,
    costPerWear,
    unlockedOutfits: unlockedCount,
    duplicateRisk,
    duplicateItemNames: duplicateCandidates.map(d => d.name),
    pairedItems: complementaryItems.slice(0, 3),
    compatibleItemIds: complementaryItems.slice(0, 5).map(i => i.id),
    reasoning,
    createdAt: new Date().toISOString()
  };
}
