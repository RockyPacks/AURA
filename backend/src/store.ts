import fs from 'fs';
import path from 'path';
import { WardrobeItem, WearEvent, ShoppingAnalysis, StylePreference, ProfileAnalytics } from './types.js';

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

function getDb(): AuraDatabaseSchema {
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
  const newItem: WardrobeItem = {
    ...item,
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

  const updated: WardrobeItem = {
    ...current,
    ...updates,
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

export function logWearEvent(event: Omit<WearEvent, 'id' | 'timestamp'>): WearEvent {
  const db = getDb();
  const now = new Date().toISOString();
  const newEvent: WearEvent = {
    ...event,
    id: `wear_${Date.now()}`,
    timestamp: now
  };

  db.wearEvents = [newEvent, ...db.wearEvents];

  db.wardrobe = db.wardrobe.map(item => {
    if (event.itemIds.includes(item.id)) {
      return {
        ...item,
        timesWorn: (item.timesWorn || 0) + 1,
        lastWorn: now,
        updatedAt: now
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
