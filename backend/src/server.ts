import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  getAllWardrobeItems, 
  getWardrobeItemById, 
  addWardrobeItem, 
  updateWardrobeItem, 
  deleteWardrobeItem, 
  logWearEvent, 
  getWearEvents, 
  calculateRealProfileAnalytics,
  logShoppingAnalysis,
  getWearStats,
  getDaysSinceWorn,
  getWearStreak,
  getSeasonalUsage,
  getItemWearHistory
} from './store.js';
import { 
  analyzeGarmentImage, 
  generateOutfitsFromWardrobe, 
  swapOutfitItem, 
  analyzeShoppingItem 
} from './aiEngine.js';
import { ContextInput } from './types.js';
import { parseCompleteContext, validateContext } from './contextParser.js';
import { 
  getWeatherWithCache, 
  convertWeatherToContext,
  invalidateWeatherCache
} from './services/weatherService.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    app: 'AURA Backend', 
    version: '1.0.0',
    timestamp: new Date().toISOString() 
  });
});

// Wardrobe Endpoints
app.get('/api/wardrobe', (req, res) => {
  try {
    const items = getAllWardrobeItems();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/wardrobe/:id', (req, res) => {
  try {
    const item = getWardrobeItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/wardrobe', (req, res) => {
  try {
    const item = req.body;
    if (!item || !item.name || !item.category) {
      return res.status(400).json({ success: false, error: 'Item name and category are required' });
    }
    const saved = addWardrobeItem(item);
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/wardrobe/:id', (req, res) => {
  try {
    const updated = updateWardrobeItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/wardrobe/:id', (req, res) => {
  try {
    const deleted = deleteWardrobeItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, message: 'Item removed from wardrobe' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Garment Vision Ingestion
app.post('/api/analyze-wardrobe-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Missing imageBase64 data' });
    }

    const analyzed = await analyzeGarmentImage(imageBase64, mimeType);
    res.json({ 
      success: true, 
      data: {
        detectedItems: [analyzed],
        overallWardrobeVibe: analyzed.styleDescriptors?.[0] || 'Modern Minimalist'
      }
    });
  } catch (err: any) {
    console.error('[Backend API Error] analyze-wardrobe-image:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to analyze image' });
  }
});

// Outfit Generation
app.post('/api/generate-outfits', async (req, res) => {
  try {
    const context: ContextInput = req.body.context || {
      temperature: '18°C',
      weather: 'Cloudy',
      occasion: 'Work Pitch',
      mood: 'Confident',
      location: 'Johannesburg',
      formalityPreference: 7
    };

    const outfits = await generateOutfitsFromWardrobe(context);
    res.json({ success: true, data: { outfits } });
  } catch (err: any) {
    console.error('[Backend API Error] generate-outfits:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate outfits' });
  }
});

// Outfit Item Swapping
app.post('/api/swap-item', (req, res) => {
  try {
    const { currentItemIds, targetItemId, replacementItemId } = req.body;
    if (!currentItemIds || !targetItemId || !replacementItemId) {
      return res.status(400).json({ success: false, error: 'Missing swap parameters' });
    }

    const result = swapOutfitItem(currentItemIds, targetItemId, replacementItemId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Wear Events & History
app.post('/api/wear-event', (req, res) => {
  try {
    const { outfitId, outfitTitle, itemIds, occasion, weather, temperature, feedback, notes, wornDate, wornAt } = req.body;
    if (!outfitId || !itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ success: false, error: 'Invalid wear event payload' });
    }

    const event = logWearEvent({
      outfitId,
      outfitTitle: outfitTitle || 'Daily Ensemble',
      itemIds,
      wornDate,
      wornAt,
      occasion,
      weather,
      temperature,
      feedback,
      notes
    });

    const stats = getWearStats();
    const updatedWardrobe = getAllWardrobeItems();
    res.status(201).json({ success: true, data: { event, stats, wardrobe: updatedWardrobe } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/wear-events', (req, res) => {
  try {
    const events = getWearEvents();
    res.json({ success: true, data: events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Wear Statistics
app.get('/api/wear-stats', (req, res) => {
  try {
    const stats = getWearStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Days Since Worn
app.get('/api/wardrobe/:id/days-since-worn', (req, res) => {
  try {
    const result = getDaysSinceWorn(req.params.id);
    if (result.daysSince === -1 && result.readableFormat === 'Item not found') {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Wear Streak
app.get('/api/wardrobe/:id/wear-streak', (req, res) => {
  try {
    const streak = getWearStreak(req.params.id);
    res.json({ success: true, data: streak });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Seasonal Usage
app.get('/api/seasonal-usage', (req, res) => {
  try {
    const seasonalData = getSeasonalUsage();
    res.json({ success: true, data: seasonalData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Item Wear History
app.get('/api/wardrobe/:id/wear-history', (req, res) => {
  try {
    const history = getItemWearHistory(req.params.id);
    if (!history) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Shopping Intelligence
app.post('/api/analyze-shopping-item', async (req, res) => {
  try {
    const { name, priceUSD, category, imageBase64 } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, error: 'Name and category are required' });
    }

    const price = parseFloat(priceUSD) || 100;
    const analysis = await analyzeShoppingItem(name, price, category, imageBase64);
    logShoppingAnalysis(analysis);
    res.json({ success: true, data: analysis });
  } catch (err: any) {
    console.error('[Backend API Error] analyze-shopping-item:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Profile Analytics
app.get('/api/profile-analytics', (req, res) => {
  try {
    const analytics = calculateRealProfileAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Context Parsing
app.post('/api/parse-context', (req, res) => {
  try {
    const { request, systemContext } = req.body;
    if (!request || typeof request !== 'string') {
      return res.status(400).json({ success: false, error: 'Request string is required' });
    }

    const context = parseCompleteContext(request, systemContext);
    
    // Validate the parsed context
    const validation = validateContext(context);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: `Invalid context: ${validation.errors.join(', ')}` });
    }

    // Calculate a simple confidence score based on keyword matches
    const confidence = calculateContextConfidence(request);

    res.json({ 
      success: true, 
      data: context,
      confidence 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to parse context' });
  }
});

/**
 * Helper function to calculate confidence in parsed context
 * Higher confidence when more context keywords are found
 */
function calculateContextConfidence(request: string): number {
  const normalized = request.toLowerCase();
  let confidence = 0.5; // Base confidence
  
  // +0.05 for each context type found
  if (/\b(\d{1,2}\s*(?:degree|c|celsius)|cold|warm|hot|cool)\b/i.test(request)) confidence += 0.1;
  if (/\b(sunny|rain|snow|windy|cloudy)\b/i.test(request)) confidence += 0.1;
  if (/\b(work|meeting|coffee|dinner|trip|gym)\b/i.test(request)) confidence += 0.1;
  if (/\b(confident|bold|relaxed|creative|understated)\b/i.test(request)) confidence += 0.1;
  if (/\b(morning|afternoon|evening)\b/i.test(request)) confidence += 0.05;
  if (/\bin\s+[A-Z]|[A-Z]\w+\s+weather/i.test(request)) confidence += 0.05;
  
  return Math.min(confidence, 0.95);
}

// Weather Integration Endpoints
app.get('/api/weather/:location', async (req, res) => {
  try {
    const location = req.params.location;
    if (!location) {
      return res.status(400).json({ success: false, error: 'Location parameter is required' });
    }

    const weather = await getWeatherWithCache(location);
    res.json({
      success: true,
      data: {
        ...weather,
        source: 'openweathermap'
      }
    });
  } catch (err: any) {
    console.error('[Backend API Error] GET /api/weather/:location:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch weather' });
  }
});

app.post('/api/weather/forecast', async (req, res) => {
  try {
    const { location, days } = req.body;
    if (!location) {
      return res.status(400).json({ success: false, error: 'Location is required' });
    }

    // For now, return current weather for all days (forecast not implemented yet)
    const weather = await getWeatherWithCache(location);
    const forecasts = Array(Math.min(days || 1, 3)).fill(null).map(() => weather);

    res.json({
      success: true,
      data: {
        location,
        forecasts
      }
    });
  } catch (err: any) {
    console.error('[Backend API Error] POST /api/weather/forecast:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch forecast' });
  }
});

app.post('/api/weather/refresh', (req, res) => {
  try {
    const { location } = req.body;
    invalidateWeatherCache(location);
    res.json({
      success: true,
      message: location ? `Weather cache cleared for ${location}` : 'All weather cache cleared'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AURA Backend] Running on http://localhost:${PORT}`);
});
