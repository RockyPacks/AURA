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
  logShoppingAnalysis
} from './store.js';
import { 
  analyzeGarmentImage, 
  generateOutfitsFromWardrobe, 
  swapOutfitItem, 
  analyzeShoppingItem 
} from './aiEngine.js';
import { ContextInput } from './types.js';

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
    const { outfitId, outfitTitle, itemIds, context, feedback, notes } = req.body;
    if (!outfitId || !itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ success: false, error: 'Invalid wear event payload' });
    }

    const event = logWearEvent({
      outfitId,
      outfitTitle: outfitTitle || 'Daily Ensemble',
      itemIds,
      context: context || {
        temperature: '18°C',
        weather: 'Cloudy',
        occasion: 'Work Pitch',
        mood: 'Confident',
        location: 'Johannesburg',
        formalityPreference: 7
      },
      feedback,
      notes
    });

    const updatedWardrobe = getAllWardrobeItems();
    res.status(201).json({ success: true, data: { event, wardrobe: updatedWardrobe } });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AURA Backend] Running on http://localhost:${PORT}`);
});
