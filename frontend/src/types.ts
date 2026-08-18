export type AppMode = 'strategy' | 'app_sandbox';

export type StrategyTab = 
  | 'executive_memo' 
  | 'market_tam' 
  | 'unit_economics' 
  | 'risk_matrix' 
  | 'competition' 
  | 'adrs'
  | 'approval_gate';

export type SandboxTab = 
  | 'home'
  | 'wardrobe'
  | 'looks'
  | 'shop' 
  | 'profile';

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
  formalityScore: number; // 1-10 (1=loungewear, 10=black tie)
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
  temperature: string; // e.g. "18°C" or "70°F"
  weather: 'Sunny' | 'Rain' | 'Cloudy' | 'Snow' | 'Windy';
  occasion: 'Work Pitch' | 'Casual Coffee' | 'Evening Dinner' | 'Weekend Travel' | 'Gym & Active';
  mood: 'Confident' | 'Relaxed' | 'Bold' | 'Understated' | 'Creative';
  location: string;
  formalityPreference: number; // 1-10
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening';
}

export interface GeneratedOutfit {
  id: string;
  title: string;
  explanation: string;
  itemIds: string[];
  items?: WardrobeItem[];
  itemNames?: string[];
  formalityScore: number;
  weatherMatchScore: number; // %
  confidenceScore: number; // %
  confidenceBoostScore?: number; // legacy alias
  compatibilityScore?: number;
  whyReasons: string[];
  heroImageUrl?: string;
  createdAt?: string;
}

export interface WearEvent {
  id: string;
  outfitId: string;
  outfitTitle: string;
  itemIds: string[];
  timestamp: string;
  context: ContextInput;
  feedback?: 'loved' | 'neutral' | 'disliked';
  notes?: string;
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

export interface ProfileAnalytics {
  totalPieces: number;
  totalEstimatedValueUSD: number;
  activeUtilizationRate: number; // % of wardrobe worn at least once recently
  cleanCount: number;
  inWashCount: number;
  mostWornCategory: string;
  mostWornColors: { color: string; count: number }[];
  categoryBreakdown: { category: string; count: number; value: number }[];
  leastWornItems: WardrobeItem[];
  mostWornItems: WardrobeItem[];
  totalWearEvents: number;
  isLearningPhase: boolean; // true if insufficient wear data
  primaryArchetype: string;
}

export interface ADRItem {
  id: string;
  title: string;
  problem: string;
  optionsConsidered: string[];
  pros: string[];
  cons: string[];
  risk: string;
  cost: string;
  effort: string;
  operationalComplexity: string;
  recommendation: string;
  why: string;
  confidenceScore: number; // 1-100
  status: 'ACCEPTED' | 'PROPOSED' | 'REJECTED';
}


