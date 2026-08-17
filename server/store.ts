import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WardrobeItem, WearEvent, ShoppingAnalysis, StylePreference, ProfileAnalytics } from '../src/types';
import { INITIAL_WARDROBE_ITEMS } from '../src/data/sampleWardrobe';

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

  // Seed default database
  const initialDb: AuraDatabaseSchema = {
    version: 1,
    user: {
      id: 'user_morokolo',
      name: 'Morokolo',
      preferences: DEFAULT_PREFERENCES
    },
    wardrobe: INITIAL_WARDROBE_ITEMS.map(item => ({
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

// ----------------- Wardrobe Operations -----------------

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

// ----------------- Wear Events & Learning -----------------

export function logWearEvent(event: Omit<WearEvent, 'id' | 'timestamp'>): WearEvent {
  const db = getDb();
  const now = new Date().toISOString();
  const newEvent: WearEvent = {
    ...event,
    id: `wear_${Date.now()}`,
    timestamp: now
  };

  // 1. Persist Wear Event
  db.wearEvents = [newEvent, ...db.wearEvents];

  // 2. Update all item wear counts and lastWorn timestamps
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

// ----------------- Shopping History -----------------

export function logShoppingAnalysis(analysis: ShoppingAnalysis): ShoppingAnalysis {
  const db = getDb();
  db.shoppingHistory = [analysis, ...db.shoppingHistory.slice(0, 49)];
  saveDb(db);
  return analysis;
}

// ----------------- Real Profile Analytics Calculation -----------------

export function calculateRealProfileAnalytics(): ProfileAnalytics {
  const db = getDb();
  const wardrobe = db.wardrobe;
  const wearEvents = db.wearEvents;

  const totalPieces = wardrobe.length;
  const totalEstimatedValueUSD = wardrobe.reduce((sum, item) => sum + (item.estimatedValueUSD || 0), 0);
  
  const cleanCount = wardrobe.filter(i => i.status === 'clean' || !i.isDirty).length;
  const inWashCount = wardrobe.filter(i => i.status === 'in_wash' || i.isDirty).length;

  // Active items = worn at least 1 time or added recently (within 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeItemsCount = wardrobe.filter(i => {
    if (i.timesWorn > 0) return true;
    const addedTime = new Date(i.dateAdded || i.createdAt || 0).getTime();
    return addedTime > thirtyDaysAgo;
  }).length;

  const activeUtilizationRate = totalPieces > 0 
    ? Math.round((activeItemsCount / totalPieces) * 100) 
    : 0;

  // Category breakdown
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

  // Color frequency
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

  // Trust check: If under 3 wear events, label as learning phase
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
