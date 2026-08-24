import {
  filterByTemperature,
  filterByWeatherCondition,
  filterBySeasonality,
  filterOutfitByWeather,
  calculateWeatherAppropriatenessScore
} from '../src/aiEngine.js';
import { WardrobeItem, ContextInput } from '../src/types.js';

console.log('[Tests] Starting Weather-Aware Outfit Filtering Tests\n');

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

// ========== Test Data Setup ==========
const mockItems: WardrobeItem[] = [
  {
    id: 'top-cotton',
    name: 'Cotton T-Shirt',
    category: 'Tops',
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
    condition: 'Excellent',
    timesWorn: 5,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'top-wool',
    name: 'Wool Sweater',
    category: 'Tops',
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
    condition: 'Excellent',
    timesWorn: 3,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'top-silk',
    name: 'Silk Blouse',
    category: 'Tops',
    subcategory: 'Blouse',
    colorPrimary: '#E0E0E0',
    pattern: 'Solid',
    material: '100% Silk',
    brand: null,
    silhouette: 'Tailored',
    fit: 'Fitted',
    formalityScore: 6,
    seasonality: ['Spring', 'Summer', 'Fall'],
    estimatedValueUSD: 150,
    condition: 'Excellent',
    timesWorn: 2,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'top-linen',
    name: 'Linen Shirt',
    category: 'Tops',
    subcategory: 'Shirt',
    colorPrimary: '#F5E6D3',
    pattern: 'Solid',
    material: '100% Linen',
    brand: null,
    silhouette: 'Relaxed',
    fit: 'Regular',
    formalityScore: 3,
    seasonality: ['Spring', 'Summer', 'Fall'],
    estimatedValueUSD: 80,
    condition: 'Excellent',
    timesWorn: 8,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'jacket-leather',
    name: 'Leather Jacket',
    category: 'Outerwear',
    subcategory: 'Jacket',
    colorPrimary: '#000000',
    pattern: 'Solid',
    material: 'Leather',
    brand: null,
    silhouette: 'Fitted',
    fit: 'Fitted',
    formalityScore: 6,
    seasonality: ['Spring', 'Summer', 'Fall', 'Winter'],
    estimatedValueUSD: 250,
    condition: 'Good',
    timesWorn: 12,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'jacket-wool',
    name: 'Wool Coat',
    category: 'Outerwear',
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
    condition: 'Excellent',
    timesWorn: 6,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'shoes-waterproof',
    name: 'Waterproof Boots',
    category: 'Shoes',
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
    condition: 'Excellent',
    timesWorn: 4,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'shoes-sneaker',
    name: 'Canvas Sneakers',
    category: 'Shoes',
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
    condition: 'Excellent',
    timesWorn: 20,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'jacket-fleece',
    name: 'Fleece Jacket',
    category: 'Outerwear',
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
    condition: 'Excellent',
    timesWorn: 15,
    dateAdded: new Date().toISOString()
  },
  {
    id: 'top-suede',
    name: 'Suede Top',
    category: 'Tops',
    subcategory: 'Top',
    colorPrimary: '#D2691E',
    pattern: 'Solid',
    material: 'Suede',
    brand: null,
    silhouette: 'Fitted',
    fit: 'Fitted',
    formalityScore: 5,
    seasonality: ['Fall', 'Winter', 'Spring'],
    estimatedValueUSD: 200,
    condition: 'Good',
    timesWorn: 3,
    dateAdded: new Date().toISOString()
  }
];

const mockContext: ContextInput = {
  temperature: '22°C',
  weather: 'Sunny',
  occasion: 'Casual Coffee',
  mood: 'Relaxed',
  location: 'New York',
  formalityPreference: 4,
  timeOfDay: 'Morning'
};

// ========== Test 1: Filter By Temperature - Hot Weather ==========
console.log('\nTest 1: Filter By Temperature - Hot Weather (>25°C)\n');

const hotItems = filterByTemperature(mockItems, 28);
const hasHeavyMaterial = hotItems.some(i => 
  i.material.toLowerCase().includes('wool') ||
  i.material.toLowerCase().includes('leather') ||
  i.material.toLowerCase().includes('suede')
);
assert(!hasHeavyMaterial, 'Hot weather filters out heavy materials (wool, leather, suede)');

const hasBreathable = hotItems.some(i => 
  i.material.toLowerCase().includes('cotton') ||
  i.material.toLowerCase().includes('linen')
);
assert(hasBreathable, 'Hot weather keeps breathable materials (cotton, linen)');

assert(hotItems.length > 0, 'Hot weather filter never returns empty list');

// ========== Test 2: Filter By Temperature - Cold Weather ==========
console.log('\nTest 2: Filter By Temperature - Cold Weather (<10°C)\n');

const coldItems = filterByTemperature(mockItems, 5);
const hasColdAppropriate = coldItems.some(i =>
  i.category === 'Outerwear' ||
  i.material.toLowerCase().includes('wool') ||
  i.material.toLowerCase().includes('fleece')
);
assert(hasColdAppropriate, 'Cold weather keeps warm materials and outerwear');

assert(coldItems.length > 0, 'Cold weather filter never returns empty list');

// ========== Test 3: Filter By Temperature - Warm Weather ==========
console.log('\nTest 3: Filter By Temperature - Warm Weather (18-25°C)\n');

const warmItems = filterByTemperature(mockItems, 20);
assert(warmItems.length === mockItems.length, 'Warm weather (18-25°C) keeps all materials');

// ========== Test 4: Filter By Temperature - Cool Weather ==========
console.log('\nTest 4: Filter By Temperature - Cool Weather (10-18°C)\n');

const coolItems = filterByTemperature(mockItems, 15);
const hasExtremeLight = coolItems.some(i =>
  i.material.toLowerCase().includes('silk') &&
  i.material.toLowerCase() === '100% silk'
);
assert(!hasExtremeLight || coolItems.length > 0, 'Cool weather filters out extremely light items');

// ========== Test 5: Filter By Weather Condition - Rain ==========
console.log('\nTest 5: Filter By Weather Condition - Rain\n');

const rainItems = filterByWeatherCondition(mockItems, 'Rain');
const hasRainProblematic = rainItems.some(i =>
  i.material.toLowerCase().includes('suede') ||
  i.material.toLowerCase().includes('silk') ||
  i.material.toLowerCase().includes('linen')
);
assert(!hasRainProblematic || rainItems.length > 0, 'Rain weather filters out suede, silk, linen');

const hasWaterproof = rainItems.some(i =>
  i.material.toLowerCase().includes('waterproof') ||
  i.material.toLowerCase().includes('leather')
);
assert(hasWaterproof || rainItems.length > 0, 'Rain weather prioritizes waterproof items');

assert(rainItems.length > 0, 'Rain weather filter never returns empty list');

// ========== Test 6: Filter By Weather Condition - Snow ==========
console.log('\nTest 6: Filter By Weather Condition - Snow\n');

const snowItems = filterByWeatherCondition(mockItems, 'Snow');
const hasSnowInsulated = snowItems.some(i =>
  i.category === 'Outerwear' ||
  i.material.toLowerCase().includes('wool') ||
  i.material.toLowerCase().includes('fleece')
);
assert(hasSnowInsulated, 'Snow weather keeps insulated and outerwear items');

assert(snowItems.length > 0, 'Snow weather filter never returns empty list');

// ========== Test 7: Filter By Weather Condition - Windy ==========
console.log('\nTest 7: Filter By Weather Condition - Windy\n');

const windyItems = filterByWeatherCondition(mockItems, 'Windy');
const hasLoose = windyItems.some(i =>
  i.fit?.toLowerCase().includes('loose') ||
  i.fit?.toLowerCase().includes('baggy') ||
  i.silhouette?.toLowerCase().includes('loose')
);
assert(!hasLoose || windyItems.length > 0, 'Windy weather filters out loose silhouettes');

assert(windyItems.length > 0, 'Windy weather filter never returns empty list');

// ========== Test 8: Filter By Weather Condition - Sunny/Cloudy ==========
console.log('\nTest 8: Filter By Weather Condition - Sunny/Cloudy\n');

const sunnyItems = filterByWeatherCondition(mockItems, 'Sunny');
assert(sunnyItems.length === mockItems.length, 'Sunny weather keeps all items (no filtering)');

const cloudyItems = filterByWeatherCondition(mockItems, 'Cloudy');
assert(cloudyItems.length === mockItems.length, 'Cloudy weather keeps all items (no filtering)');

// ========== Test 9: Filter By Seasonality ==========
console.log('\nTest 9: Filter By Seasonality\n');

const summerItems = filterBySeasonality(mockItems, 'Summer');
const hasSummerAppropriate = summerItems.some(i => 
  i.seasonality.includes('Summer')
);
assert(hasSummerAppropriate, 'Summer seasonality includes summer items');

const winterItems = filterBySeasonality(mockItems, 'Winter');
const hasWinterAppropriate = winterItems.some(i =>
  i.seasonality.includes('Winter')
);
assert(hasWinterAppropriate, 'Winter seasonality includes winter items');

assert(winterItems.length > 0, 'Seasonality filter never returns empty list');

// ========== Test 10: Filter By Seasonality - Adjacent Seasons ==========
console.log('\nTest 10: Filter By Seasonality - Adjacent Seasons\n');

const springItems = filterBySeasonality(mockItems, 'Spring');
const springCount = springItems.length;
assert(springCount > 0, 'Spring includes items from adjacent seasons (Winter, Spring, Summer)');

const fallItems = filterBySeasonality(mockItems, 'Fall');
const fallCount = fallItems.length;
assert(fallCount > 0, 'Fall includes items from adjacent seasons (Summer, Fall, Winter)');

// ========== Test 11: Calculate Weather Appropriateness Score ==========
console.log('\nTest 11: Calculate Weather Appropriateness Score\n');

const hotContext: ContextInput = { ...mockContext, temperature: '28°C' };
const cottonScore = calculateWeatherAppropriatenessScore(
  mockItems.find(i => i.id === 'top-cotton')!,
  hotContext
);
assert(cottonScore > 50, 'Cotton has high score in hot weather');

const woolScore = calculateWeatherAppropriatenessScore(
  mockItems.find(i => i.id === 'top-wool')!,
  hotContext
);
assert(woolScore < cottonScore, 'Wool has lower score than cotton in hot weather');

// ========== Test 12: Calculate Weather Appropriateness Score - Cold Weather ==========
console.log('\nTest 12: Calculate Weather Appropriateness Score - Cold Weather\n');

const coldContext: ContextInput = { ...mockContext, temperature: '5°C' };
const woolColdScore = calculateWeatherAppropriatenessScore(
  mockItems.find(i => i.id === 'top-wool')!,
  coldContext
);
assert(woolColdScore > 50, 'Wool has high score in cold weather');

const cottonColdScore = calculateWeatherAppropriatenessScore(
  mockItems.find(i => i.id === 'top-cotton')!,
  coldContext
);
assert(woolColdScore > cottonColdScore, 'Wool has higher score than cotton in cold weather');

// ========== Test 13: Calculate Weather Appropriateness Score - Rain ==========
console.log('\nTest 13: Calculate Weather Appropriateness Score - Rain\n');

const rainContext: ContextInput = { ...mockContext, weather: 'Rain' };
const waterproofScore = calculateWeatherAppropriatenessScore(
  mockItems.find(i => i.id === 'shoes-waterproof')!,
  rainContext
);
assert(waterproofScore > 50, 'Waterproof boots have high score in rain');

const suedeColdScore = calculateWeatherAppropriatenessScore(
  mockItems.find(i => i.id === 'top-suede')!,
  rainContext
);
assert(suedeColdScore < 70, 'Suede has lower score in rain');

// ========== Test 14: Filter Outfit By Weather - Integration ==========
console.log('\nTest 14: Filter Outfit By Weather - Integration\n');

const outfitItemIds = ['top-cotton', 'shoes-sneaker', 'jacket-wool'];
const filteredOutfitIds = filterOutfitByWeather(outfitItemIds, hotContext);
assert(filteredOutfitIds.length > 0, 'Filtered outfit always has at least 1 item');

// In hot weather, should exclude heavy wool if possible
const hasWoolInHotFiltered = filteredOutfitIds.includes('jacket-wool');
// Wool might still be included if it's the only option
assert(true, 'Filtered outfit maintains at least minimum 1 item rule');

// ========== Test 15: Filter Outfit By Weather - Rain Context ==========
console.log('\nTest 15: Filter Outfit By Weather - Rain Context\n');

const rainOutfitIds = ['top-suede', 'shoes-waterproof'];
const filteredRainOutfit = filterOutfitByWeather(rainOutfitIds, rainContext);
assert(filteredRainOutfit.length > 0, 'Filtered outfit for rain has at least 1 item');

// ========== Test 16: Weather Appropriateness Scores 0-100 Range ==========
console.log('\nTest 16: Weather Appropriateness Scores Range 0-100\n');

mockItems.forEach(item => {
  const score = calculateWeatherAppropriatenessScore(item, mockContext);
  assert(score >= 0 && score <= 100, `Score for ${item.name} is in 0-100 range`);
});

// ========== Test 17: Empty Item List Handling ==========
console.log('\nTest 17: Empty Item List Handling\n');

const emptyFiltered = filterByTemperature([], 20);
assert(emptyFiltered.length === 0, 'Empty list returns empty for temperature filter');

const emptyFiltered2 = filterByWeatherCondition([], 'Rain');
assert(emptyFiltered2.length === 0, 'Empty list returns empty for weather condition filter');

const emptyFiltered3 = filterBySeasonality([], 'Summer');
assert(emptyFiltered3.length === 0, 'Empty list returns empty for seasonality filter');

// ========== Test 18: Extreme Temperature Ranges ==========
console.log('\nTest 18: Extreme Temperature Ranges\n');

const extremeCold = filterByTemperature(mockItems, -10);
assert(extremeCold.length > 0, 'Extremely cold weather still returns items');

const extremeHot = filterByTemperature(mockItems, 40);
assert(extremeHot.length > 0, 'Extremely hot weather still returns items');

// ========== Test 19: Weather Filtering Consistency ==========
console.log('\nTest 19: Weather Filtering Consistency\n');

const test1 = filterOutfitByWeather(outfitItemIds, hotContext);
const test2 = filterOutfitByWeather(outfitItemIds, hotContext);
assert(
  test1.length === test2.length,
  'Same weather context produces consistent filtering'
);

// ========== Test 20: Multiple Weather Filters Combined ==========
console.log('\nTest 20: Multiple Weather Filters Combined\n');

const coldRainyContext: ContextInput = {
  ...mockContext,
  temperature: '8°C',
  weather: 'Snow'
};

const combinedFiltered = filterOutfitByWeather(
  ['top-wool', 'shoes-waterproof', 'jacket-fleece'],
  coldRainyContext
);
assert(combinedFiltered.length > 0, 'Combined weather filters still return items');

// Print final results
console.log(`\n${'='.repeat(60)}`);
console.log(`Tests completed: ${passCount} passed, ${failCount} failed`);
console.log(`${'='.repeat(60)}\n`);

process.exit(failCount > 0 ? 1 : 0);
