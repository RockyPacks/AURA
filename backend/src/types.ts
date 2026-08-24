export type GarmentCategory = 'Tops' | 'Bottoms' | 'Outerwear' | 'Shoes' | 'Accessories' | 'One-Piece';
export type GarmentStatus = 'clean' | 'in_wash' | 'unavailable';

export interface WardrobeItem {
  id: string;
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
  formalityScore: number; // 1-10
  seasonality: string[];
  estimatedValueUSD: number;
  condition: 'New' | 'Excellent' | 'Good' | 'Worn';
  timesWorn: number;
  lastWorn?: string | null;
  isDirty?: boolean;
  status?: GarmentStatus;
  imageUrl?: string;
  dateAdded: string;
  createdAt?: string;
  updatedAt?: string;
  aiMetadata?: {
    confidence: number;
    detectedCategory?: string;
    notes?: string;
  };
}

export interface ContextInput {
  temperature: string;
  weather: 'Sunny' | 'Rain' | 'Cloudy' | 'Snow' | 'Windy';
  occasion: 'Work Pitch' | 'Casual Coffee' | 'Evening Dinner' | 'Weekend Travel' | 'Gym & Active';
  mood: 'Confident' | 'Relaxed' | 'Bold' | 'Understated' | 'Creative';
  location: string;
  formalityPreference: number;
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening';
}

export interface ScoringBreakdown {
  colorHarmony: number;
  styleCompatibility: number;
  occasionAlignment: number;
  weatherSuitability: number;
  seasonalityMatch: number;
}

export interface GeneratedOutfit {
  id: string;
  title: string;
  explanation: string;
  itemIds: string[];
  items?: WardrobeItem[];
  itemNames?: string[];
  formalityScore: number;
  weatherMatchScore: number;
  confidenceScore: number;
  confidenceBoostScore?: number;
  compatibilityScore?: number;
  scoringBreakdown?: ScoringBreakdown;
  whyReasons: string[];
  heroImageUrl?: string;
  createdAt?: string;
  explanationGeneratedBy?: 'gemini-2.5-flash' | 'fallback';
  explanationGeneratedAt?: string;
}

export interface WearEvent {
  id: string;
  outfitId: string;
  outfitTitle: string;
  itemIds: string[];
  wornDate: string;           // ISO date (YYYY-MM-DD)
  wornAt: string;             // ISO timestamp
  occasion?: string;          // e.g., "Work", "Casual", "Gym"
  weather?: string;           // e.g., "Sunny", "Rainy"
  temperature?: string;       // e.g., "18°C"
  feedback?: 'loved' | 'okay' | 'hated' | 'neutral' | 'disliked';
  notes?: string;
  timestamp?: string;         // Legacy - maps to wornAt
  context?: ContextInput;     // Legacy support
}

export interface StylePreference {
  favoriteColors: string[];
  avoidColors: string[];
  preferredFormalityRange: [number, number];
  favoriteBrands: string[];
  fabricPreferences: string[];
  aestheticArchetype?: string;
}

export interface ShoppingAnalysis {
  id: string;
  title: string;
  price: number;
  category: GarmentCategory;
  verdictType: 'BUY' | 'SKIP' | 'CONSIDER';
  verdict: string;
  verdictSub: string;
  costPerWear: string;
  unlockedOutfits: number;
  duplicateRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  duplicateItemNames?: string[];
  pairedItems: WardrobeItem[];
  compatibleItemIds?: string[];
  reasoning: string[];
  createdAt: string;
}

export interface WearStats {
  totalWearEvents: number;
  itemsWorn: number;
  mostWornItem: { id: string; name: string; timesWorn: number } | null;
  leastWornItem: { id: string; name: string; timesWorn: number } | null;
  averageWearPerItem: number;
  unusedItems: WardrobeItem[];
  underusedItems: WardrobeItem[];  // worn < 2x
  overusedItems: WardrobeItem[];   // worn > avg by 2x
}

export interface DaysSinceWornResult {
  daysSince: number;
  readableFormat: string;
}

export interface WearStreak {
  currentStreak: number;
  longestStreak: number;
  currentStreakDates?: string[];
  longestStreakDates?: string[];
}

export interface SeasonalUsageData {
  season: string;
  itemsUsed: number;
  totalWearEvents: number;
  averageWearPerItem: number;
  underutilizedItems: string[];  // item IDs
}

export interface ProfileAnalytics {
  totalPieces: number;
  totalEstimatedValueUSD: number;
  activeUtilizationRate: number;
  cleanCount: number;
  inWashCount: number;
  mostWornCategory: string;
  mostWornColors: { color: string; count: number }[];
  categoryBreakdown: { category: string; count: number; value: number }[];
  leastWornItems: WardrobeItem[];
  mostWornItems: WardrobeItem[];
  totalWearEvents: number;
  isLearningPhase: boolean;
  primaryArchetype: string;
}
