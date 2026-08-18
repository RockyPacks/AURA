import { GoogleGenAI } from '@google/genai';
import { WardrobeItem, ContextInput, GeneratedOutfit, ShoppingAnalysis, GarmentCategory } from './types.js';
import { getAllWardrobeItems, getWearEvents } from './store.js';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
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
}

export async function analyzeGarmentImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<AnalyzedGarmentResult> {
  const ai = getAiClient();
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  if (ai) {
    try {
      const prompt = `You are AURA Garment Vision Intelligence. Analyze this piece of clothing.
Extract structured metadata accurately. 
CRITICAL RULE ON BRAND: Only identify brand if a logo, label, or unmistakable trademark pattern is clearly visible. If not 100% visible, set "brand": null. Do NOT hallucinate brands.
Assess confidence between 0.0 and 1.0.

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
  "confidence": number between 0.50 and 0.99,
  "styleDescriptors": ["e.g. Minimalist", "Architectural", "Monochrome"]
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
          styleDescriptors: parsed.styleDescriptors || ['Modern Minimalist']
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
    styleDescriptors: ['Minimalist', 'Timeless']
  };
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
        whyReasons: ['Clean garments are needed to build complete ensembles']
      }
    ];
  }

  const recentWearCutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recentlyWornIds = new Set<string>();
  wearEvents.forEach(e => {
    if (new Date(e.timestamp).getTime() > recentWearCutoff) {
      e.itemIds.forEach(id => recentlyWornIds.add(id));
    }
  });

  const tops = cleanWardrobe.filter(i => i.category === 'Tops');
  const bottoms = cleanWardrobe.filter(i => i.category === 'Bottoms');
  const outerwear = cleanWardrobe.filter(i => i.category === 'Outerwear');
  const shoes = cleanWardrobe.filter(i => i.category === 'Shoes');

  const candidateCombinations: { items: WardrobeItem[]; score: number; notes: string[] }[] = [];

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

        let score = 80;
        const notes: string[] = [];

        const hasRecentlyWorn = currentItems.some(i => recentlyWornIds.has(i.id));
        if (!hasRecentlyWorn) {
          score += 10;
          notes.push('Promotes healthy closet rotation (items rested for >48h)');
        } else {
          score -= 10;
        }

        const avgFormality = currentItems.reduce((acc, i) => acc + i.formalityScore, 0) / currentItems.length;
        const formalityDiff = Math.abs(avgFormality - targetFormality);
        if (formalityDiff <= 1.5) {
          score += 10;
          notes.push(`Harmonizes with ${context.occasion} formality level`);
        } else {
          score -= formalityDiff * 4;
        }

        if (isColdOrCool) {
          const hasWarmLayers = currentItems.some(i => i.material.includes('Wool') || i.material.includes('Cashmere') || i.category === 'Outerwear');
          if (hasWarmLayers) {
            score += 10;
            notes.push(`Thermal calibration ideal for ${context.temperature} ${context.weather.toLowerCase()} conditions`);
          }
        }

        candidateCombinations.push({ items: currentItems, score, notes });
      }
    }
  }

  candidateCombinations.sort((a, b) => b.score - a.score);
  const topCandidates = candidateCombinations.slice(0, 4);

  if (topCandidates.length === 0) {
    topCandidates.push({
      items: cleanWardrobe.slice(0, 3),
      score: 75,
      notes: ['Assembled from currently available pieces']
    });
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `You are AURA Personal Fashion Intelligence.
Context:
- Location: ${context.location}
- Temperature: ${context.temperature}
- Weather: ${context.weather}
- Occasion: ${context.occasion}
- Mood: ${context.mood}

Below are candidate outfit ensembles from user's real wardrobe:
${JSON.stringify(topCandidates.map((c, idx) => ({
  candidateId: `cand-${idx + 1}`,
  items: c.items.map(i => ({ id: i.id, name: i.name, category: i.category, material: i.material, color: i.colorPrimary, brand: i.brand, formality: i.formalityScore }))
})), null, 2)}

Provide editorial fashion curation for each ensemble.
Return ONLY valid JSON matching this schema:
{
  "outfits": [
    {
      "candidateIndex": 0,
      "title": "Editorial Name (e.g. Modern Executive Architecture)",
      "explanation": "Precise 2-sentence rationale on why this ensemble excels in ${context.temperature} ${context.weather} for ${context.occasion}.",
      "formalityScore": 8,
      "weatherMatchScore": 96,
      "confidenceScore": 95,
      "whyReasons": [
        "Calibrated for ${context.temperature} ${context.weather}",
        "Specific color/silhouette rationale",
        "Occasion alignment"
      ]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.outfits) && parsed.outfits.length > 0) {
        return parsed.outfits.map((o: any, idx: number) => {
          const candidate = topCandidates[o.candidateIndex || idx] || topCandidates[0];
          return {
            id: `outfit-${Date.now()}-${idx}`,
            title: o.title || `Look 0${idx + 1}`,
            explanation: o.explanation || 'Curated to match your daily schedule and ambient conditions.',
            itemIds: candidate.items.map(i => i.id),
            items: candidate.items,
            itemNames: candidate.items.map(i => i.name),
            formalityScore: o.formalityScore || Math.round(candidate.items.reduce((s, i) => s + i.formalityScore, 0) / candidate.items.length),
            weatherMatchScore: o.weatherMatchScore || 94,
            confidenceScore: o.confidenceScore || 92,
            confidenceBoostScore: o.confidenceScore || 92,
            whyReasons: o.whyReasons && o.whyReasons.length > 0 ? o.whyReasons : candidate.notes,
            heroImageUrl: candidate.items[0]?.imageUrl
          };
        });
      }
    } catch (err) {
      console.warn('[AURA Outfit] Gemini outfit synthesis failed, using deterministic scoring:', err);
    }
  }

  return topCandidates.slice(0, 3).map((candidate, idx) => {
    const avgFormality = Math.round(candidate.items.reduce((s, i) => s + i.formalityScore, 0) / candidate.items.length);
    const title = avgFormality >= 8 
      ? 'Executive Modern Tailoring' 
      : avgFormality >= 6 
      ? 'Smart Architectural Contrast' 
      : 'Signature Effortless Casual';

    return {
      id: `outfit-det-${Date.now()}-${idx}`,
      title,
      explanation: `Calibrated for ${context.location} (${context.temperature}, ${context.weather}). Seamlessly transitions for ${context.occasion} with high color and silhouette harmony.`,
      itemIds: candidate.items.map(i => i.id),
      items: candidate.items,
      itemNames: candidate.items.map(i => i.name),
      formalityScore: avgFormality,
      weatherMatchScore: Math.min(candidate.score, 98),
      confidenceScore: Math.min(candidate.score - 2, 96),
      confidenceBoostScore: Math.min(candidate.score - 2, 96),
      whyReasons: candidate.notes.length > 0 ? candidate.notes : [
        `Harmonized for ${context.temperature} climate`,
        `Appropriate formality for ${context.occasion}`,
        'High natural fabric compatibility'
      ],
      heroImageUrl: candidate.items[0]?.imageUrl
    };
  });
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
