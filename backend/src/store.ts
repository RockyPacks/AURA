import fs from 'fs';
import path from 'path';
import { 
  WardrobeItem, 
  WearEvent, 
  ShoppingAnalysis, 
  StylePreference, 
  ProfileAnalytics,
  WearStats,
  DaysSinceWornResult,
  WearStreak,
  SeasonalUsageData
} from './types.js';
import { generateFashionEmbedding } from './services/fashionEmbedding.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'aura_database.json');

export interface AuraDatabaseSchema {
  version: number;
  user: {
    id: string;
    name: string;
    preferences: StylePreference;
  };
  wardrobe: WardrobeItem[];
  wearEvents: WearEvent[];
  shoppingHistory: ShoppingAnalysis[];
  updatedAt: string;
}

const DEFAULT_PREFERENCES: StylePreference = {
  favoriteColors: ['#1E293B', '#334155', '#D97706', '#FFFFFF', '#1E1B4B'],
  avoidColors: ['#FF007F', '#39FF14'],
  preferredFormalityRange: [4, 8],
  favoriteBrands: ['Acne Studios', 'A.P.C.', 'Theory', 'COS', 'Common Projects'],
  fabricPreferences: ['Virgin Wool', 'Cashmere', 'Organic Cotton', 'Selvedge Denim'],
  aestheticArchetype: 'Quiet Luxury & Modern Minimalist'
};

const SEED_WARDROBE_ITEMS: WardrobeItem[] = [
  {
    id: "item-1",
    name: "Structured Italian Wool Blazer",
    category: "Outerwear",
    subcategory: "Blazer",
    colorPrimary: "#1E293B",
    colorSecondary: "#0F172A",
    pattern: "Solid",
    material: "100% Virgin Wool",
    brand: "Acne Studios",
    formalityScore: 9,
    seasonality: ["Fall", "Winter", "Spring"],
    estimatedValueUSD: 520,
    condition: "Excellent",
    timesWorn: 18,
    status: "clean",
    dateAdded: "2026-05-10",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "item-2",
    name: "Heavyweight Organic Cotton Tee",
    category: "Tops",
    subcategory: "T-Shirt",
    colorPrimary: "#F8FAFC",
    pattern: "Solid",
    material: "100% Organic Cotton",
    brand: "Uniqlo U",
    formalityScore: 3,
    seasonality: ["Spring", "Summer", "Fall", "Winter"],
    estimatedValueUSD: 25,
    condition: "Good",
    timesWorn: 42,
    status: "clean",
    dateAdded: "2026-01-15",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "item-3",
    name: "Japanese Selvedge Denim Trousers",
    category: "Bottoms",
    subcategory: "Jeans",
    colorPrimary: "#1E1B4B",
    pattern: "Raw Denim",
    material: "14oz Selvedge Denim",
    brand: "A.P.C.",
    formalityScore: 6,
    seasonality: ["Fall", "Winter", "Spring"],
    estimatedValueUSD: 240,
    condition: "Excellent",
    timesWorn: 26,
    status: "clean",
    dateAdded: "2026-03-02",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "item-4",
    name: "Minimalist Leather Low-Top Sneakers",
    category: "Shoes",
    subcategory: "Sneakers",
    colorPrimary: "#FFFFFF",
    pattern: "Solid",
    material: "Calfskin Leather",
    brand: "Common Projects",
    formalityScore: 5,
    seasonality: ["Spring", "Summer", "Fall"],
    estimatedValueUSD: 415,
    condition: "Good",
    timesWorn: 64,
    status: "clean",
    dateAdded: "2025-11-20",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "item-5",
    name: "Ribbed Cashmere Turtleneck Sweater",
    category: "Tops",
    subcategory: "Sweater",
    colorPrimary: "#D97706",
    pattern: "Ribbed",
    material: "100% Cashmere",
    brand: "COS",
    formalityScore: 7,
    seasonality: ["Fall", "Winter"],
    estimatedValueUSD: 190,
    condition: "Excellent",
    timesWorn: 12,
    status: "clean",
    dateAdded: "2026-02-14",
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "item-6",
    name: "Pleated Wide-Leg Tailored Trousers",
    category: "Bottoms",
    subcategory: "Trousers",
    colorPrimary: "#334155",
    pattern: "Solid",
    material: "Wool Blend",
    brand: "Theory",
    formalityScore: 8,
    seasonality: ["Spring", "Fall", "Winter"],
    estimatedValueUSD: 295,
    condition: "Excellent",
    timesWorn: 15,
    status: "clean",
    dateAdded: "2026-04-10",
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "item-7",
    name: "Handcrafted Chelsea Boots",
    category: "Shoes",
    subcategory: "Boots",
    colorPrimary: "#451A03",
    pattern: "Solid",
    material: "Full-Grain Leather",
    brand: "RM Williams",
    formalityScore: 8,
    seasonality: ["Fall", "Winter", "Spring"],
    estimatedValueUSD: 549,
    condition: "Excellent",
    timesWorn: 22,
    status: "clean",
    dateAdded: "2025-12-01",
    imageUrl: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "item-8",
    name: "Waterproof Minimalist Trench Coat",
    category: "Outerwear",
    subcategory: "Coat",
    colorPrimary: "#D4D4D8",
    pattern: "Solid",
    material: "Gabardine Cotton",
    brand: "Burberry",
    formalityScore: 8,
    seasonality: ["Spring", "Fall"],
    estimatedValueUSD: 1450,
    condition: "Excellent",
    timesWorn: 8,
    status: "clean",
    dateAdded: "2026-03-18",
    imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80"
  }
];

function initDb(): AuraDatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.wardrobe)) {
        return parsed;
      }
    } catch (err) {
      console.warn('[AURA DB] Corrupted database detected, recreating from seed...', err);
    }
  }

  const initialDb: AuraDatabaseSchema = {
    version: 1,
    user: {
      id: 'user_morokolo',
      name: 'Morokolo',
      preferences: DEFAULT_PREFERENCES
    },
    wardrobe: SEED_WARDROBE_ITEMS.map(item => ({
      ...item,
      status: item.isDirty ? 'in_wash' : 'clean',
      createdAt: item.dateAdded || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    wearEvents: [
      {
        id: 'wear-seed-1',
        outfitId: 'outfit-seed-1',
        outfitTitle: 'Signature Streetwear Luxe',
        itemIds: ['item-2', 'item-3', 'item-4'],
        wornDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        wornAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        context: {
          temperature: '18°C',
          weather: 'Cloudy',
          occasion: 'Casual Coffee',
          mood: 'Relaxed',
          location: 'Johannesburg',
          formalityPreference: 5
        },
        feedback: 'loved'
      }
    ],
    shoppingHistory: [],
    updatedAt: new Date().toISOString()
  };

  saveDb(initialDb);
  return initialDb;
}

let cachedDb: AuraDatabaseSchema | null = null;

export function getDb(): AuraDatabaseSchema {
  if (!cachedDb) {
    cachedDb = initDb();
  }
  return cachedDb;
}

function saveDb(db: AuraDatabaseSchema) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db.updatedAt = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    cachedDb = db;
  } catch (err) {
    console.error('[AURA DB] Error persisting database:', err);
  }
}

export function getAllWardrobeItems(): WardrobeItem[] {
  const db = getDb();
  return db.wardrobe;
}

export function getWardrobeItemById(id: string): WardrobeItem | undefined {
  const db = getDb();
  return db.wardrobe.find(item => item.id === id);
}

export function addWardrobeItem(item: WardrobeItem): WardrobeItem {
  const db = getDb();
  const now = new Date().toISOString();
  const embedding = item.embedding && item.embedding.length === 512
    ? item.embedding
    : generateFashionEmbedding(item);

  const newItem: WardrobeItem = {
    ...item,
    embedding,
    createdAt: item.createdAt || now,
    updatedAt: now,
    timesWorn: item.timesWorn || 0,
    status: item.status || (item.isDirty ? 'in_wash' : 'clean'),
    isDirty: item.isDirty || item.status === 'in_wash'
  };

  db.wardrobe = [newItem, ...db.wardrobe.filter(w => w.id !== newItem.id)];
  saveDb(db);
  return newItem;
}

export function updateWardrobeItem(id: string, updates: Partial<WardrobeItem>): WardrobeItem | null {
  const db = getDb();
  const index = db.wardrobe.findIndex(item => item.id === id);
  if (index === -1) return null;

  const current = db.wardrobe[index];
  const isDirty = updates.isDirty !== undefined 
    ? updates.isDirty 
    : (updates.status ? updates.status === 'in_wash' : current.isDirty);
  const status = updates.status 
    ? updates.status 
    : (isDirty ? 'in_wash' : 'clean');

  const merged = { ...current, ...updates };
  const embedding = updates.embedding || (
    (updates.name || updates.category || updates.colorPrimary || updates.material) 
      ? generateFashionEmbedding(merged)
      : current.embedding || generateFashionEmbedding(merged)
  );

  const updated: WardrobeItem = {
    ...current,
    ...updates,
    embedding,
    isDirty,
    status,
    updatedAt: new Date().toISOString()
  };

  db.wardrobe[index] = updated;
  saveDb(db);
  return updated;
}

export function deleteWardrobeItem(id: string): boolean {
  const db = getDb();
  const initialLength = db.wardrobe.length;
  db.wardrobe = db.wardrobe.filter(item => item.id !== id);
  if (db.wardrobe.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

export function logWearEvent(event: Partial<WearEvent> & { outfitId: string; itemIds: string[] }): WearEvent {
  // Validate required fields
  if (!event.itemIds || event.itemIds.length === 0) {
    throw new Error('At least one item must be included in a wear event');
  }

  const db = getDb();
  const now = new Date();
  const wornAt = event.wornAt || now.toISOString();
  const wornDate = event.wornDate || now.toISOString().split('T')[0];
  
  const newEvent: WearEvent = {
    id: event.id || `wear_${Date.now()}`,
    outfitId: event.outfitId,
    outfitTitle: event.outfitTitle || 'Daily Ensemble',
    itemIds: event.itemIds,
    wornDate,
    wornAt,
    occasion: event.occasion,
    weather: event.weather,
    temperature: event.temperature,
    feedback: event.feedback,
    notes: event.notes,
    // Legacy support
    timestamp: wornAt,
    context: event.context
  };

  db.wearEvents = [newEvent, ...db.wearEvents];

  // Update item wear tracking
  db.wardrobe = db.wardrobe.map(item => {
    if (event.itemIds.includes(item.id)) {
      return {
        ...item,
        timesWorn: (item.timesWorn || 0) + 1,
        lastWorn: wornDate,
        updatedAt: wornAt
      };
    }
    return item;
  });

  saveDb(db);
  return newEvent;
}

export function getWearEvents(): WearEvent[] {
  const db = getDb();
  return db.wearEvents;
}

export function logShoppingAnalysis(analysis: ShoppingAnalysis): ShoppingAnalysis {
  const db = getDb();
  db.shoppingHistory = [analysis, ...db.shoppingHistory.slice(0, 49)];
  saveDb(db);
  return analysis;
}

export function calculateRealProfileAnalytics(): ProfileAnalytics {
  const db = getDb();
  const wardrobe = db.wardrobe;
  const wearEvents = db.wearEvents;

  const totalPieces = wardrobe.length;
  const totalEstimatedValueUSD = wardrobe.reduce((sum, item) => sum + (item.estimatedValueUSD || 0), 0);
  
  const cleanCount = wardrobe.filter(i => i.status === 'clean' || !i.isDirty).length;
  const inWashCount = wardrobe.filter(i => i.status === 'in_wash' || i.isDirty).length;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeItemsCount = wardrobe.filter(i => {
    if (i.timesWorn > 0) return true;
    const addedTime = new Date(i.dateAdded || i.createdAt || 0).getTime();
    return addedTime > thirtyDaysAgo;
  }).length;

  const activeUtilizationRate = totalPieces > 0 
    ? Math.round((activeItemsCount / totalPieces) * 100) 
    : 0;

  const catMap = new Map<string, { count: number; value: number }>();
  wardrobe.forEach(item => {
    const existing = catMap.get(item.category) || { count: 0, value: 0 };
    catMap.set(item.category, {
      count: existing.count + 1,
      value: existing.value + (item.estimatedValueUSD || 0)
    });
  });

  const categoryBreakdown = Array.from(catMap.entries()).map(([category, data]) => ({
    category,
    count: data.count,
    value: data.value
  })).sort((a, b) => b.count - a.count);

  const mostWornCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'Tops';

  const colorMap = new Map<string, number>();
  wardrobe.forEach(item => {
    if (item.colorPrimary) {
      colorMap.set(item.colorPrimary, (colorMap.get(item.colorPrimary) || 0) + 1);
    }
  });

  const mostWornColors = Array.from(colorMap.entries())
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const sortedByWear = [...wardrobe].sort((a, b) => (b.timesWorn || 0) - (a.timesWorn || 0));
  const mostWornItems = sortedByWear.slice(0, 3);
  const leastWornItems = [...wardrobe]
    .sort((a, b) => (a.timesWorn || 0) - (b.timesWorn || 0))
    .slice(0, 3);

  const isLearningPhase = wearEvents.length < 3;

  return {
    totalPieces,
    totalEstimatedValueUSD,
    activeUtilizationRate,
    cleanCount,
    inWashCount,
    mostWornCategory,
    mostWornColors,
    categoryBreakdown,
    leastWornItems,
    mostWornItems,
    totalWearEvents: wearEvents.length,
    isLearningPhase,
    primaryArchetype: db.user.preferences.aestheticArchetype || 'Quiet Luxury & Modern Minimalist'
  };
}

/**
 * Get comprehensive wear statistics
 * **Validates: Requirement 18**
 */
export function getWearStats(): WearStats {
  const db = getDb();
  const wardrobe = db.wardrobe;
  const wearEvents = db.wearEvents;

  const wornItems = wardrobe.filter(item => (item.timesWorn || 0) > 0);
  const totalWearEvents = wearEvents.length;
  const itemsWorn = wornItems.length;

  // Calculate average wear per item
  const averageWearPerItem = itemsWorn > 0
    ? wornItems.reduce((sum, item) => sum + (item.timesWorn || 0), 0) / itemsWorn
    : 0;

  // Most worn item
  const mostWornItem = wornItems.length > 0
    ? (() => {
      const item = wornItems.reduce((max, current) =>
        (current.timesWorn || 0) > (max.timesWorn || 0) ? current : max
      );
      return { id: item.id, name: item.name, timesWorn: item.timesWorn || 0 };
    })()
    : null;

  // Least worn item (among worn items)
  const leastWornItem = wornItems.length > 0
    ? (() => {
      const item = wornItems.reduce((min, current) =>
        (current.timesWorn || 0) < (min.timesWorn || 0) ? current : min
      );
      return { id: item.id, name: item.name, timesWorn: item.timesWorn || 0 };
    })()
    : null;

  // Unused items (never worn)
  const unusedItems = wardrobe.filter(item => (item.timesWorn || 0) === 0);

  // Underused items (worn < 2 times)
  const underusedItems = wardrobe.filter(item => (item.timesWorn || 0) > 0 && (item.timesWorn || 0) < 2);

  // Overused items (worn > average by 2x)
  const thresholdForOveruse = averageWearPerItem * 2;
  const overusedItems = wardrobe.filter(item => (item.timesWorn || 0) > thresholdForOveruse);

  return {
    totalWearEvents,
    itemsWorn,
    mostWornItem,
    leastWornItem,
    averageWearPerItem: Math.round(averageWearPerItem * 100) / 100,
    unusedItems,
    underusedItems,
    overusedItems
  };
}

/**
 * Get days since an item was last worn
 * **Validates: Requirement 18**
 */
export function getDaysSinceWorn(itemId: string): DaysSinceWornResult {
  const item = getWardrobeItemById(itemId);
  if (!item) {
    return { daysSince: -1, readableFormat: 'Item not found' };
  }

  if (!item.lastWorn) {
    return { daysSince: -1, readableFormat: 'Never worn' };
  }

  const lastWornDate = new Date(item.lastWorn);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastWornDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastWornDate.getTime();
  const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let readableFormat: string;
  if (daysSince === 0) {
    readableFormat = 'Today';
  } else if (daysSince === 1) {
    readableFormat = 'Yesterday';
  } else if (daysSince < 7) {
    readableFormat = `${daysSince} days ago`;
  } else if (daysSince < 30) {
    const weeks = Math.floor(daysSince / 7);
    readableFormat = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (daysSince < 365) {
    const months = Math.floor(daysSince / 30);
    readableFormat = `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(daysSince / 365);
    readableFormat = `${years} year${years > 1 ? 's' : ''} ago`;
  }

  return { daysSince, readableFormat };
}

/**
 * Get wear streak for an item
 * **Validates: Requirement 18**
 */
export function getWearStreak(itemId: string): WearStreak {
  const db = getDb();
  const wearEvents = db.wearEvents;
  const itemWearDates = wearEvents
    .filter(event => event.itemIds.includes(itemId))
    .map(event => event.wornDate || event.timestamp?.split('T')[0] || '')
    .filter(date => date !== '')
    .sort()
    .reverse();

  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakDates: string[] = [];
  let longestStreakDates: string[] = [];

  if (itemWearDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, currentStreakDates: [], longestStreakDates: [] };
  }

  // Count consecutive days from most recent
  let prevDate = new Date(itemWearDates[0]);
  currentStreakDates = [itemWearDates[0]];
  currentStreak = 1;

  for (let i = 1; i < itemWearDates.length; i++) {
    const currentDate = new Date(itemWearDates[i]);
    const daysBetween = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysBetween === 1) {
      currentStreak++;
      currentStreakDates.push(itemWearDates[i]);
      prevDate = currentDate;
    } else {
      break;
    }
  }

  // Find longest streak overall
  longestStreak = currentStreak;
  longestStreakDates = [...currentStreakDates];

  // Scan for other streaks
  let tempStreak = 1;
  let tempStreakDates = [itemWearDates[0]];

  for (let i = 1; i < itemWearDates.length; i++) {
    const currentDate = new Date(itemWearDates[i]);
    const prevDateInLoop = new Date(itemWearDates[i - 1]);
    const daysBetween = Math.floor((prevDateInLoop.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysBetween === 1) {
      tempStreak++;
      tempStreakDates.push(itemWearDates[i]);
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakDates = [...tempStreakDates];
      }
      tempStreak = 1;
      tempStreakDates = [itemWearDates[i]];
    }
  }

  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
    longestStreakDates = [...tempStreakDates];
  }

  return {
    currentStreak,
    longestStreak,
    currentStreakDates,
    longestStreakDates
  };
}

/**
 * Get seasonal usage analysis
 * **Validates: Requirement 18**
 */
export function getSeasonalUsage(): SeasonalUsageData[] {
  const db = getDb();
  const wearEvents = db.wearEvents;
  const wardrobe = db.wardrobe;

  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const seasonalData: SeasonalUsageData[] = [];

  seasons.forEach(season => {
    const monthsInSeason = getMonthsForSeason(season);
    const seasonWearEvents = wearEvents.filter(event => {
      const eventDate = new Date(event.wornDate || event.timestamp || '');
      const eventMonth = eventDate.getMonth() + 1;
      return monthsInSeason.includes(eventMonth);
    });

    const itemsUsedInSeason = new Set<string>();
    seasonWearEvents.forEach(event => {
      event.itemIds.forEach(itemId => itemsUsedInSeason.add(itemId));
    });

    // Find underutilized seasonal items
    const underutilizedItems: string[] = [];
    wardrobe.forEach(item => {
      if (item.seasonality?.includes(season)) {
        const wears = wearEvents.filter(e => e.itemIds.includes(item.id) && 
          monthsInSeason.includes(new Date(e.wornDate || e.timestamp || '').getMonth() + 1)
        ).length;
        if (wears < 2) {
          underutilizedItems.push(item.id);
        }
      }
    });

    const avgWearPerItem = itemsUsedInSeason.size > 0
      ? seasonWearEvents.reduce((sum, event) => sum + event.itemIds.length, 0) / itemsUsedInSeason.size
      : 0;

    seasonalData.push({
      season,
      itemsUsed: itemsUsedInSeason.size,
      totalWearEvents: seasonWearEvents.length,
      averageWearPerItem: Math.round(avgWearPerItem * 100) / 100,
      underutilizedItems
    });
  });

  return seasonalData;
}

/**
 * Helper: Get months for a season
 */
function getMonthsForSeason(season: string): number[] {
  const seasonMonths: Record<string, number[]> = {
    'Spring': [3, 4, 5],
    'Summer': [6, 7, 8],
    'Fall': [9, 10, 11],
    'Winter': [12, 1, 2]
  };
  return seasonMonths[season] || [];
}

/**
 * Get item wear history
 * **Validates: Requirement 18**
 */
export function getItemWearHistory(itemId: string) {
  const item = getWardrobeItemById(itemId);
  if (!item) return null;

  const db = getDb();
  const itemWearEvents = db.wearEvents
    .filter(event => event.itemIds.includes(itemId))
    .map(event => ({
      date: event.wornDate || event.timestamp?.split('T')[0] || '',
      occasion: event.occasion,
      feedback: event.feedback,
      weather: event.weather,
      temperature: event.temperature
    }));

  const daysSinceWorn = getDaysSinceWorn(itemId);
  const wearStreak = getWearStreak(itemId);

  return {
    item,
    timesWorn: item.timesWorn || 0,
    lastWornDate: item.lastWorn,
    daysSinceLast: daysSinceWorn.daysSince,
    daysSinceLastReadable: daysSinceWorn.readableFormat,
    wearEvents: itemWearEvents,
    currentStreak: wearStreak.currentStreak,
    longestStreak: wearStreak.longestStreak
  };
}
