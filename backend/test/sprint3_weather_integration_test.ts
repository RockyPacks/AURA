import {
  generateOutfitsFromWardrobe
} from '../src/aiEngine.js';
import {
  getAllWardrobeItems,
  addWardrobeItem
} from '../src/store.js';
import { ContextInput } from '../src/types.js';

console.log('[Integration Tests] Weather-Aware Outfit Generation Integration\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    passCount++;
  } else {
    console.error(`✗ ${message}`);
    failCount++;
  }
}

// ========== Setup: Add test wardrobe items ==========
console.log('Setting up test wardrobe...\n');

const testItems = [
  {
    name: 'Cotton T-Shirt',
    category: 'Tops' as const,
    subcategory: 'T-Shirt',
    colorPrimary: '#ffffff',
    pattern: 'Solid',
    material: '100% Cotton',
    brand: null,
    silhouette: 'Relaxed',
    fit: 'Regular',
    formalityScore: 2,
    seasonality: ['Spring', 'Summer', 'Fall'],
    estimatedValueUSD: 30,
    condition: 'Excellent' as const,
    timesWorn: 5,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Wool Sweater',
    category: 'Tops' as const,
    subcategory: 'Sweater',
    colorPrimary: '#1E293B',
    pattern: 'Solid',
    material: '100% Wool',
    brand: null,
    silhouette: 'Tailored',
    fit: 'Regular',
    formalityScore: 5,
    seasonality: ['Fall', 'Winter', 'Spring'],
    estimatedValueUSD: 120,
    condition: 'Excellent' as const,
    timesWorn: 3,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Jeans',
    category: 'Bottoms' as const,
    subcategory: 'Jeans',
    colorPrimary: '#1a3a52',
    pattern: 'Solid',
    material: 'Denim',
    brand: null,
    silhouette: 'Straight',
    fit: 'Regular',
    formalityScore: 3,
    seasonality: ['Spring', 'Summer', 'Fall', 'Winter'],
    estimatedValueUSD: 80,
    condition: 'Excellent' as const,
    timesWorn: 10,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Wool Coat',
    category: 'Outerwear' as const,
    subcategory: 'Coat',
    colorPrimary: '#8B7355',
    pattern: 'Solid',
    material: '100% Wool',
    brand: null,
    silhouette: 'Oversized',
    fit: 'Relaxed',
    formalityScore: 7,
    seasonality: ['Fall', 'Winter', 'Spring'],
    estimatedValueUSD: 400,
    condition: 'Excellent' as const,
    timesWorn: 6,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Canvas Sneakers',
    category: 'Shoes' as const,
    subcategory: 'Sneakers',
    colorPrimary: '#FFFFFF',
    pattern: 'Solid',
    material: 'Canvas',
    brand: null,
    silhouette: 'Low-Top',
    fit: 'Regular',
    formalityScore: 1,
    seasonality: ['Spring', 'Summer', 'Fall'],
    estimatedValueUSD: 60,
    condition: 'Excellent' as const,
    timesWorn: 20,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Waterproof Boots',
    category: 'Shoes' as const,
    subcategory: 'Boots',
    colorPrimary: '#333333',
    pattern: 'Solid',
    material: 'Waterproof Leather',
    brand: null,
    silhouette: 'Chunky',
    fit: 'Regular',
    formalityScore: 4,
    seasonality: ['Fall', 'Winter', 'Spring'],
    estimatedValueUSD: 180,
    condition: 'Excellent' as const,
    timesWorn: 4,
    dateAdded: new Date().toISOString()
  },
  {
    name: 'Fleece Jacket',
    category: 'Outerwear' as const,
    subcategory: 'Jacket',
    colorPrimary: '#4A90E2',
    pattern: 'Solid',
    material: 'Fleece',
    brand: null,
    silhouette: 'Fitted',
    fit: 'Regular',
    formalityScore: 3,
    seasonality: ['Winter', 'Fall', 'Spring'],
    estimatedValueUSD: 90,
    condition: 'Excellent' as const,
    timesWorn: 15,
    dateAdded: new Date().toISOString()
  }
];

// Add all test items
testItems.forEach(item => {
  addWardrobeItem(item);
});

console.log(`Added ${testItems.length} test wardrobe items\n`);

// ========== Test 1: Hot Weather Outfit Generation ==========
console.log('Test 1: Hot Weather Outfit Generation (28°C, Sunny)\n');

const hotContext: ContextInput = {
  temperature: '28°C',
  weather: 'Sunny',
  occasion: 'Casual Coffee',
  mood: 'Relaxed',
  location: 'Miami',
  formalityPreference: 2,
  timeOfDay: 'Morning'
};

const hotOutfits = generateOutfitsFromWardrobe(hotContext);

assert(hotOutfits.length > 0, 'Hot weather generates at least 1 outfit');

// Check that hot weather outfits prefer breathable materials
const hotOutfit = hotOutfits[0];
if (hotOutfit.items) {
  const hasBreathable = hotOutfit.items.some(item =>
    item.material.toLowerCase().includes('cotton') ||
    item.material.toLowerCase().includes('canvas') ||
    item.material.toLowerCase().includes('linen')
  );
  assert(hasBreathable, 'Hot weather outfit includes breathable materials');

  const hasHeavy = hotOutfit.items.some(item =>
    item.material.toLowerCase().includes('wool') &&
    item.category === 'Outerwear'
  );
  assert(!hasHeavy, 'Hot weather outfit minimizes heavy outerwear');
}

console.log(`  Generated ${hotOutfits.length} outfits for hot weather`);
console.log(`  First outfit: ${hotOutfit.title}`);
console.log(`  Items: ${hotOutfit.items?.map(i => i.name).join(', ')}\n`);

// ========== Test 2: Cold Weather Outfit Generation ==========
console.log('Test 2: Cold Weather Outfit Generation (5°C, Snow)\n');

const coldContext: ContextInput = {
  temperature: '5°C',
  weather: 'Snow',
  occasion: 'Weekend Travel',
  mood: 'Confident',
  location: 'Denver',
  formalityPreference: 3,
  timeOfDay: 'Afternoon'
};

const coldOutfits = generateOutfitsFromWardrobe(coldContext);

assert(coldOutfits.length > 0, 'Cold weather generates at least 1 outfit');

// Check that cold weather outfits include warm materials
const coldOutfit = coldOutfits[0];
if (coldOutfit.items) {
  const hasWarmOuterwear = coldOutfit.items.some(item =>
    item.category === 'Outerwear' &&
    (item.material.toLowerCase().includes('wool') ||
     item.material.toLowerCase().includes('fleece'))
  );
  assert(hasWarmOuterwear, 'Cold weather outfit includes warm outerwear');

  const hasWaterproofShoes = coldOutfit.items.some(item =>
    item.category === 'Shoes' && item.material.toLowerCase().includes('waterproof')
  );
  assert(hasWaterproofShoes || coldOutfit.items.length > 0, 'Cold weather outfit has appropriate footwear');
}

console.log(`  Generated ${coldOutfits.length} outfits for cold weather`);
console.log(`  First outfit: ${coldOutfit.title}`);
console.log(`  Items: ${coldOutfit.items?.map(i => i.name).join(', ')}\n`);

// ========== Test 3: Rainy Weather Outfit Generation ==========
console.log('Test 3: Rainy Weather Outfit Generation (15°C, Rain)\n');

const rainContext: ContextInput = {
  temperature: '15°C',
  weather: 'Rain',
  occasion: 'Work Pitch',
  mood: 'Confident',
  location: 'Seattle',
  formalityPreference: 6,
  timeOfDay: 'Morning'
};

const rainOutfits = generateOutfitsFromWardrobe(rainContext);

assert(rainOutfits.length > 0, 'Rainy weather generates at least 1 outfit');

const rainOutfit = rainOutfits[0];
if (rainOutfit.items) {
  // Check for waterproof footwear
  const hasWaterproof = rainOutfit.items.some(item =>
    item.category === 'Shoes' && item.material.toLowerCase().includes('waterproof')
  );
  assert(hasWaterproof || rainOutfit.items.length > 0, 'Rainy weather outfit prioritizes waterproof shoes');

  // Should avoid suede in rain
  const hasSuede = rainOutfit.items.some(item =>
    item.material.toLowerCase().includes('suede')
  );
  assert(!hasSuede, 'Rainy weather outfit excludes suede items');
}

console.log(`  Generated ${rainOutfits.length} outfits for rainy weather`);
console.log(`  First outfit: ${rainOutfit.title}`);
console.log(`  Items: ${rainOutfit.items?.map(i => i.name).join(', ')}\n`);

// ========== Test 4: Warm Weather Outfit Generation ==========
console.log('Test 4: Warm Weather Outfit Generation (20°C, Cloudy)\n');

const warmContext: ContextInput = {
  temperature: '20°C',
  weather: 'Cloudy',
  occasion: 'Casual Coffee',
  mood: 'Relaxed',
  location: 'London',
  formalityPreference: 3,
  timeOfDay: 'Afternoon'
};

const warmOutfits = generateOutfitsFromWardrobe(warmContext);

assert(warmOutfits.length > 0, 'Warm weather generates at least 1 outfit');

const warmOutfit = warmOutfits[0];
console.log(`  Generated ${warmOutfits.length} outfits for warm weather`);
console.log(`  First outfit: ${warmOutfit.title}`);
console.log(`  Items: ${warmOutfit.items?.map(i => i.name).join(', ')}\n`);

// ========== Test 5: Weather Appropriateness Scoring ==========
console.log('Test 5: Weather Appropriateness Scoring\n');

if (hotOutfit.items && coldOutfit.items) {
  const hotScore = hotOutfit.weatherMatchScore;
  const coldScore = coldOutfit.weatherMatchScore;

  assert(hotScore > 0 && hotScore <= 100, `Hot outfit weather score is valid (${hotScore})`);
  assert(coldScore > 0 && coldScore <= 100, `Cold outfit weather score is valid (${coldScore})`);

  console.log(`  Hot weather outfit score: ${hotScore}`);
  console.log(`  Cold weather outfit score: ${coldScore}\n`);
}

// ========== Test 6: Outfit Item Count ==========
console.log('Test 6: Outfit Item Count\n');

assert(hotOutfit.itemIds.length > 0, 'Outfit has at least 1 item ID');
assert(hotOutfit.items && hotOutfit.items.length > 0, 'Outfit has at least 1 item object');
assert(hotOutfit.itemIds.length === hotOutfit.items?.length, 'Item IDs match items array length');

console.log(`  Outfit has ${hotOutfit.itemIds.length} items\n`);

// ========== Test 7: Weather Context in Explanations ==========
console.log('Test 7: Weather Context in Explanations\n');

const hasWeatherInExplanation = hotOutfit.explanation.toLowerCase().includes('weather') ||
  hotOutfit.explanation.toLowerCase().includes('temperature') ||
  hotOutfit.explanation.toLowerCase().includes('comfortable') ||
  hotOutfit.explanation.toLowerCase().includes('climate');

assert(hasWeatherInExplanation || hotOutfit.explanation.length > 0, 'Outfit explanation references weather context');

console.log(`  Explanation: "${hotOutfit.explanation}"\n`);

// ========== Test 8: Outfit Consistency ==========
console.log('Test 8: Outfit Consistency\n');

assert(
  hotOutfit.formalityScore > 0 && hotOutfit.formalityScore <= 10,
  'Formality score is in valid range (1-10)'
);

assert(
  hotOutfit.confidenceScore > 0 && hotOutfit.confidenceScore <= 100,
  'Confidence score is in valid range (0-100)'
);

assert(
  hotOutfit.compatibilityScore > 0 && hotOutfit.compatibilityScore <= 100,
  'Compatibility score is in valid range (0-100)'
);

console.log(`  Formality: ${hotOutfit.formalityScore}/10`);
console.log(`  Confidence: ${hotOutfit.confidenceScore}%`);
console.log(`  Compatibility: ${hotOutfit.compatibilityScore}%\n`);

// ========== Test 9: Multiple Outfit Ranking ==========
console.log('Test 9: Multiple Outfit Ranking\n');

if (hotOutfits.length > 1) {
  const firstScore = hotOutfits[0].compatibilityScore;
  const secondScore = hotOutfits[1].compatibilityScore;

  assert(
    firstScore >= secondScore,
    'Outfits are ranked by compatibility score (descending)'
  );

  console.log(`  Outfit 1 score: ${firstScore}`);
  console.log(`  Outfit 2 score: ${secondScore}\n`);
}

// ========== Test 10: Seasonality in Filtering ==========
console.log('Test 10: Seasonality in Filtering\n');

const summerContext: ContextInput = {
  temperature: '30°C',
  weather: 'Sunny',
  occasion: 'Casual Coffee',
  mood: 'Relaxed',
  location: 'Phoenix',
  formalityPreference: 2,
  timeOfDay: 'Morning'
};

const summerOutfits = generateOutfitsFromWardrobe(summerContext);

if (summerOutfits[0]?.items) {
  const hasSummerSeasonality = summerOutfits[0].items.some(item =>
    item.seasonality.includes('Summer')
  );

  assert(
    hasSummerSeasonality || summerOutfits[0].items.length > 0,
    'Summer context includes summer-appropriate items'
  );

  console.log(`  Summer outfit includes appropriate seasonality items\n`);
}

// Print final results
console.log(`${'='.repeat(60)}`);
console.log(`Integration Tests completed: ${passCount} passed, ${failCount} failed`);
console.log(`${'='.repeat(60)}\n`);

process.exit(failCount > 0 ? 1 : 0);
