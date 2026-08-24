const API_BASE_URL = import.meta.env.VITE_API_URL || "";
import { 
  WardrobeItem, 
  ContextInput, 
  GeneratedOutfit, 
  WearEvent, 
  ShoppingAnalysis, 
  ProfileAnalytics 
} from '../types';

const LOCAL_STORAGE_KEY_WARDROBE = 'aura_wardrobe_v1';
const LOCAL_STORAGE_KEY_WEAR = 'aura_wear_events_v1';

// ----------------- Wardrobe Persistence -----------------

export async function fetchWardrobe(): Promise<WardrobeItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wardrobe`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_WARDROBE, JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[AURA Client API] Falling back to local storage cache:', err);
  }

  // Fallback to localStorage or initial seed
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY_WARDROBE);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return [];
}

export async function saveWardrobeItem(item: WardrobeItem): Promise<WardrobeItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wardrobe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[AURA Client API] Server save failed, saving to local cache:', err);
  }

  // Local storage fallback
  const items = await fetchWardrobe();
  const updated = [item, ...items.filter(i => i.id !== item.id)];
  localStorage.setItem(LOCAL_STORAGE_KEY_WARDROBE, JSON.stringify(updated));
  return item;
}

export async function updateWardrobeItemApi(id: string, updates: Partial<WardrobeItem>): Promise<WardrobeItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wardrobe/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[AURA Client API] Server update failed, falling back to local:', err);
  }

  const items = await fetchWardrobe();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    localStorage.setItem(LOCAL_STORAGE_KEY_WARDROBE, JSON.stringify(items));
    return updated;
  }
  throw new Error('Item not found');
}

export async function deleteWardrobeItemApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wardrobe/${id}`, { method: 'DELETE' });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('[AURA Client API] Server delete failed:', err);
  }

  const items = await fetchWardrobe();
  const filtered = items.filter(i => i.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY_WARDROBE, JSON.stringify(filtered));
  return true;
}

// ----------------- Garment Vision Ingestion -----------------

export async function analyzeGarmentImageApi(imageBase64: string, mimeType = 'image/jpeg'): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/analyze-wardrobe-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType })
  });
  if (!res.ok) {
    throw new Error('Failed to analyze garment image');
  }
  const json = await res.json();
  return json.data;
}

// ----------------- Outfit Generation Engine -----------------

export async function generateOutfitsApi(context: ContextInput): Promise<GeneratedOutfit[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/generate-outfits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.outfits)) {
        return json.data.outfits;
      }
    }
  } catch (err) {
    console.warn('[AURA Client API] Generate outfits API offline:', err);
  }

  // Graceful fallback if server unavailable
  return [];
}

// ----------------- Outfit Swapping -----------------

export async function swapOutfitItemApi(
  currentItemIds: string[], 
  targetItemId: string, 
  replacementItemId: string
): Promise<{ updatedItemIds: string[]; recalculatedScore: number; compatibilityNote: string }> {
  const res = await fetch(`${API_BASE_URL}/api/swap-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentItemIds, targetItemId, replacementItemId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to swap garment');
  }
  const json = await res.json();
  return json.data;
}

// ----------------- Wear Event & Learning -----------------

export async function logWearEventApi(
  outfitId: string,
  outfitTitle: string,
  itemIds: string[],
  context: ContextInput,
  feedback?: 'loved' | 'neutral' | 'disliked'
): Promise<{ event: WearEvent; wardrobe: WardrobeItem[] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wear-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitId, outfitTitle, itemIds, context, feedback })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[AURA Client API] Wear event sync offline:', err);
  }

  // Local fallback
  const now = new Date().toISOString();
  const event: WearEvent = {
    id: `wear_${Date.now()}`,
    outfitId,
    outfitTitle,
    itemIds,
    timestamp: now,
    context,
    feedback
  };

  const currentEvents = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_WEAR) || '[]');
  localStorage.setItem(LOCAL_STORAGE_KEY_WEAR, JSON.stringify([event, ...currentEvents]));

  const wardrobe = await fetchWardrobe();
  const updatedWardrobe = wardrobe.map(item => {
    if (itemIds.includes(item.id)) {
      return { ...item, timesWorn: (item.timesWorn || 0) + 1, lastWorn: now };
    }
    return item;
  });
  localStorage.setItem(LOCAL_STORAGE_KEY_WARDROBE, JSON.stringify(updatedWardrobe));

  return { event, wardrobe: updatedWardrobe };
}

// ----------------- Shopping Intelligence -----------------

export async function analyzeShoppingItemApi(
  name: string,
  priceUSD: number,
  category: string,
  imageBase64?: string
): Promise<ShoppingAnalysis> {
  const res = await fetch(`${API_BASE_URL}/api/analyze-shopping-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, priceUSD, category, imageBase64 })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to analyze shopping item');
  }
  const json = await res.json();
  return json.data;
}

// ----------------- Real Profile Analytics -----------------

export async function fetchProfileAnalytics(): Promise<ProfileAnalytics> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile-analytics`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[AURA Client API] Profile analytics offline:', err);
  }

  // Calculate locally
  const wardrobe = await fetchWardrobe();
  const totalPieces = wardrobe.length;
  const totalEstimatedValueUSD = wardrobe.reduce((s, i) => s + (i.estimatedValueUSD || 0), 0);
  const activeItemsCount = wardrobe.filter(i => i.timesWorn > 0).length;

  return {
    totalPieces,
    totalEstimatedValueUSD,
    activeUtilizationRate: totalPieces > 0 ? Math.round((activeItemsCount / totalPieces) * 100) : 0,
    cleanCount: wardrobe.filter(i => !i.isDirty && i.status !== 'in_wash').length,
    inWashCount: wardrobe.filter(i => i.isDirty || i.status === 'in_wash').length,
    mostWornCategory: 'Tops',
    mostWornColors: [],
    categoryBreakdown: [],
    leastWornItems: wardrobe.slice(0, 2),
    mostWornItems: wardrobe.slice(0, 2),
    totalWearEvents: 1,
    isLearningPhase: true,
    primaryArchetype: 'Quiet Luxury & Modern Minimalist'
  };
}
