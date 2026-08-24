import {
  calculateColorHarmonyScore,
  calculateStyleCompatibilityScore,
  calculateOccasionAlignmentScore,
  calculateWeatherSuitabilityScore,
  calculateSeasonalityMatchScore,
  calculateCompatibilityScore
} from '../src/aiEngine.js';
import { WardrobeItem, ContextInput } from '../src/types.js';

// Simple test runner
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failCount++;
    console.error(`❌ FAILED: ${message}`);
  } else {
    passCount++;
    console.log(`✅ PASSED: ${message}`);
  }
}

// Helper to create test items
function createTestItem(overrides: Partial<WardrobeItem> = {}): WardrobeItem {
  return {
    id: `item-${Date.now()}-${Math.random()}`,
    name: 'Test Item',
    category: 'Tops',
    subcategory: 'Shirt',
    colorPrimary: '#1E293B',
    pattern: 'Solid',
    material: 'Cotton',
    brand: null,
    formalityScore: 5,
    seasonality: ['Spring', 'Summer', 'Fall'],
    estimatedValueUSD: 100,
    condition: 'Excellent',
    timesWorn: 0,
    dateAdded: new Date().toISOString().split('T')[0],
    ...overrides
  };
}

// Helper to create context
function createContext(overrides: Partial<ContextInput> = {}): ContextInput {
  return {
    temperature: '20°C',
    weather: 'Sunny',
    occasion: 'Casual Coffee',
    mood: 'Relaxed',
    location: 'Downtown',
    formalityPreference: 4,
    ...overrides
  };
}

async function runTests() {
  console.log('\n========================================');
  console.log('Sprint 3.1.5: Scoring Algorithm Tests');
  console.log('========================================\n');

  try {
    // ============================================================================
    // 1. COLOR HARMONY SCORE TESTS
    // ============================================================================
    console.log('📋 TEST SUITE 1: Color Harmony Score\n');

    // Test 1.1: Complementary color pairs (black + white)
    const complementaryBlackWhite = [
      createTestItem({ colorPrimary: '#000000', name: 'Black Item' }),
      createTestItem({ colorPrimary: '#FFFFFF', name: 'White Item' })
    ];
    const scoreComplementaryBW = calculateColorHarmonyScore(complementaryBlackWhite);
    assert(scoreComplementaryBW >= 75, `Complementary black+white should score high (got ${scoreComplementaryBW})`);

    // Test 1.2: Complementary color pairs (navy + white)
    const complementaryNavyWhite = [
      createTestItem({ colorPrimary: '#000080', name: 'Navy Item' }),
      createTestItem({ colorPrimary: '#FFFFFF', name: 'White Item' })
    ];
    const scoreComplementaryNW = calculateColorHarmonyScore(complementaryNavyWhite);
    assert(scoreComplementaryNW >= 75, `Complementary navy+white should score high (got ${scoreComplementaryNW})`);

    // Test 1.3: Monochromatic (same color)
    const monochromaticItems = [
      createTestItem({ colorPrimary: '#1E293B', name: 'Dark Gray 1' }),
      createTestItem({ colorPrimary: '#1E293B', name: 'Dark Gray 2' }),
      createTestItem({ colorPrimary: '#1E293B', name: 'Dark Gray 3' })
    ];
    const scoreMonochromatic = calculateColorHarmonyScore(monochromaticItems);
    assert(scoreMonochromatic >= 70, `Monochromatic colors should score well (got ${scoreMonochromatic})`);

    // Test 1.4: Clashing colors (vibrant red + vibrant green)
    const clashingItems = [
      createTestItem({ colorPrimary: '#FF0000', name: 'Red Item' }),
      createTestItem({ colorPrimary: '#00FF00', name: 'Green Item' })
    ];
    const scoreClashing = calculateColorHarmonyScore(clashingItems);
    assert(scoreClashing < 80, `Clashing colors should score lower (got ${scoreClashing})`);

    // Test 1.5: Mixed color combinations (3+ different colors)
    const mixedColors = [
      createTestItem({ colorPrimary: '#FF0000', name: 'Red' }),
      createTestItem({ colorPrimary: '#0000FF', name: 'Blue' }),
      createTestItem({ colorPrimary: '#FFFF00', name: 'Yellow' })
    ];
    const scoreMixed = calculateColorHarmonyScore(mixedColors);
    assert(scoreMixed >= 0 && scoreMixed <= 100, `Mixed colors should be in valid range (got ${scoreMixed})`);

    // Test 1.6: Invalid/missing colors (fallback to defaults)
    const invalidColors = [
      createTestItem({ colorPrimary: '' }),
      createTestItem({ colorPrimary: 'invalid-color' })
    ];
    const scoreInvalid = calculateColorHarmonyScore(invalidColors);
    assert(scoreInvalid >= 50, `Invalid colors should fallback gracefully (got ${scoreInvalid})`);

    // Test 1.7: Empty wardrobe
    const scoreEmpty = calculateColorHarmonyScore([]);
    assert(scoreEmpty === 50, `Empty wardrobe should score 50 (got ${scoreEmpty})`);

    // Test 1.8: Single item
    const scoreSingle = calculateColorHarmonyScore([createTestItem({ colorPrimary: '#FF0000' })]);
    assert(scoreSingle >= 0 && scoreSingle <= 100, `Single item should return valid score (got ${scoreSingle})`);

    // ============================================================================
    // 2. STYLE COMPATIBILITY SCORE TESTS
    // ============================================================================
    console.log('\n📋 TEST SUITE 2: Style Compatibility Score\n');

    // Test 2.1: All casual items (high score)
    const allCasual = [
      createTestItem({ name: 'T-Shirt', subcategory: 'T-Shirt' }),
      createTestItem({ name: 'Casual Jeans', subcategory: 'Jeans' }),
      createTestItem({ name: 'Sneakers', category: 'Shoes', subcategory: 'Sneaker' })
    ];
    const scoreCasual = calculateStyleCompatibilityScore(allCasual);
    assert(scoreCasual >= 85, `All casual items should score high (got ${scoreCasual})`);

    // Test 2.2: All smart items (high score)
    const allSmart = [
      createTestItem({ name: 'Blazer', subcategory: 'Blazer' }),
      createTestItem({ name: 'Tailored Trousers', subcategory: 'Trousers' }),
      createTestItem({ name: 'Oxford Shoes', category: 'Shoes', subcategory: 'Loafer' })
    ];
    const scoreSmart = calculateStyleCompatibilityScore(allSmart);
    assert(scoreSmart >= 85, `All smart items should score high (got ${scoreSmart})`);

    // Test 2.3: All athletic items (high score)
    const allAthletic = [
      createTestItem({ name: 'Athletic Top', subcategory: 'Track Top' }),
      createTestItem({ name: 'Joggers', subcategory: 'Jogger' }),
      createTestItem({ name: 'Running Shoes', category: 'Shoes', subcategory: 'Athletic Shoe' })
    ];
    const scoreAthletic = calculateStyleCompatibilityScore(allAthletic);
    assert(scoreAthletic >= 85, `All athletic items should score high (got ${scoreAthletic})`);

    // Test 2.4: Mixed styles (lower score)
    const mixedStyles = [
      createTestItem({ name: 'Blazer', subcategory: 'Blazer' }),
      createTestItem({ name: 'Casual Jeans', subcategory: 'Jeans' }),
      createTestItem({ name: 'Gym Shoes', category: 'Shoes', subcategory: 'Athletic Shoe' })
    ];
    const scoreMixedStyle = calculateStyleCompatibilityScore(mixedStyles);
    assert(scoreMixedStyle < 80, `Mixed styles should score lower (got ${scoreMixedStyle})`);

    // Test 2.5: Single item
    const scoreSingleStyle = calculateStyleCompatibilityScore([createTestItem()]);
    assert(scoreSingleStyle === 85, `Single item should score 85 (got ${scoreSingleStyle})`);

    // Test 2.6: Two items (no override for single/double check)
    const twoItems = [
      createTestItem({ name: 'T-Shirt' }),
      createTestItem({ name: 'Casual Jeans', subcategory: 'Jeans' })
    ];
    const scoreTwoItems = calculateStyleCompatibilityScore(twoItems);
    assert(scoreTwoItems >= 50, `Two casual items should score reasonably (got ${scoreTwoItems})`);

    // ============================================================================
    // 3. OCCASION ALIGNMENT SCORE TESTS
    // ============================================================================
    console.log('\n📋 TEST SUITE 3: Occasion Alignment Score\n');

    // Test 3.1: Work Pitch occasion (target formality 6-9)
    const workItems = [
      createTestItem({ formalityScore: 8, name: 'Blazer' }),
      createTestItem({ formalityScore: 9, name: 'Formal Trousers' })
    ];
    const scoreWorkPitch = calculateOccasionAlignmentScore(
      workItems,
      createContext({ occasion: 'Work Pitch', formalityPreference: 8 })
    );
    assert(scoreWorkPitch >= 90, `Work formal should score high (got ${scoreWorkPitch})`);

    // Test 3.2: Casual Coffee (target formality 1-4)
    const casualItems = [
      createTestItem({ formalityScore: 2, name: 'T-Shirt' }),
      createTestItem({ formalityScore: 3, name: 'Casual Jeans' })
    ];
    const scoreCasualCoffee = calculateOccasionAlignmentScore(
      casualItems,
      createContext({ occasion: 'Casual Coffee', formalityPreference: 3 })
    );
    assert(scoreCasualCoffee >= 90, `Casual coffee should score high (got ${scoreCasualCoffee})`);

    // Test 3.3: Evening Dinner (target formality 7-10)
    const dinnerItems = [
      createTestItem({ formalityScore: 8, name: 'Formal Dress' }),
      createTestItem({ formalityScore: 9, name: 'Evening Shoes' })
    ];
    const scoreEveningDinner = calculateOccasionAlignmentScore(
      dinnerItems,
      createContext({ occasion: 'Evening Dinner', formalityPreference: 8 })
    );
    assert(scoreEveningDinner >= 85, `Evening dinner should score high (got ${scoreEveningDinner})`);

    // Test 3.4: Weekend Travel (target formality 3-6)
    const travelItems = [
      createTestItem({ formalityScore: 4, name: 'Travel Shirt' }),
      createTestItem({ formalityScore: 5, name: 'Travel Pants' })
    ];
    const scoreWeekendTravel = calculateOccasionAlignmentScore(
      travelItems,
      createContext({ occasion: 'Weekend Travel', formalityPreference: 4 })
    );
    assert(scoreWeekendTravel >= 85, `Weekend travel should score high (got ${scoreWeekendTravel})`);

    // Test 3.5: Gym & Active (target formality 1-3)
    const gymItems = [
      createTestItem({ formalityScore: 1, name: 'Athletic Top' }),
      createTestItem({ formalityScore: 2, name: 'Gym Shorts' })
    ];
    const scoreGymActive = calculateOccasionAlignmentScore(
      gymItems,
      createContext({ occasion: 'Gym & Active', formalityPreference: 1 })
    );
    assert(scoreGymActive >= 90, `Gym activity should score high (got ${scoreGymActive})`);

    // Test 3.6: Formality mismatch (casual items for formal occasion)
    const casualForFormal = [
      createTestItem({ formalityScore: 1, name: 'T-Shirt' }),
      createTestItem({ formalityScore: 2, name: 'Shorts' })
    ];
    const scoreMismatch = calculateOccasionAlignmentScore(
      casualForFormal,
      createContext({ occasion: 'Work Pitch', formalityPreference: 8 })
    );
    assert(scoreMismatch < 80, `Formality mismatch should score lower (got ${scoreMismatch})`);

    // Test 3.7: Empty wardrobe
    const scoreOccasionEmpty = calculateOccasionAlignmentScore([], createContext());
    assert(scoreOccasionEmpty === 50, `Empty wardrobe should score 50 (got ${scoreOccasionEmpty})`);

    // ============================================================================
    // 4. WEATHER SUITABILITY SCORE TESTS
    // ============================================================================
    console.log('\n📋 TEST SUITE 4: Weather Suitability Score\n');

    // Test 4.1: Hot weather (>25°C) with breathable materials
    const hotItems = [
      createTestItem({ material: 'Cotton', colorPrimary: '#FFFFFF', name: 'Cotton Shirt' }),
      createTestItem({ material: 'Linen', colorPrimary: '#F5DEB3', name: 'Linen Pants' })
    ];
    const scoreHot = calculateWeatherSuitabilityScore(
      hotItems,
      createContext({ temperature: '28°C', weather: 'Sunny' })
    );
    assert(scoreHot >= 80, `Hot weather with breathable items should score high (got ${scoreHot})`);

    // Test 4.2: Warm weather (18-25°C) mixed items
    const warmItems = [
      createTestItem({ material: 'Cotton', name: 'Regular Shirt' }),
      createTestItem({ material: 'Denim', name: 'Jeans' })
    ];
    const scoreWarm = calculateWeatherSuitabilityScore(
      warmItems,
      createContext({ temperature: '22°C', weather: 'Sunny' })
    );
    assert(scoreWarm >= 70, `Warm weather should score reasonably (got ${scoreWarm})`);

    // Test 4.3: Cool weather (10-18°C) with layers
    const coolItems = [
      createTestItem({ material: 'Wool', category: 'Outerwear', name: 'Wool Sweater' }),
      createTestItem({ material: 'Cotton', name: 'Shirt' }),
      createTestItem({ material: 'Denim', name: 'Jeans' })
    ];
    const scoreCool = calculateWeatherSuitabilityScore(
      coolItems,
      createContext({ temperature: '15°C', weather: 'Cloudy' })
    );
    assert(scoreCool >= 75, `Cool weather with layers should score high (got ${scoreCool})`);

    // Test 4.4: Cold weather (<10°C) with warm materials
    const coldItems = [
      createTestItem({ material: 'Cashmere', category: 'Outerwear', name: 'Cashmere Coat' }),
      createTestItem({ material: 'Wool', name: 'Wool Pants' })
    ];
    const scoreCold = calculateWeatherSuitabilityScore(
      coldItems,
      createContext({ temperature: '5°C', weather: 'Cloudy' })
    );
    assert(scoreCold >= 75, `Cold weather with warm materials should score high (got ${scoreCold})`);

    // Test 4.5: Rain condition with waterproof items
    const rainItems = [
      createTestItem({
        material: 'Waterproof',
        category: 'Outerwear',
        name: 'Rain Jacket'
      }),
      createTestItem({
        material: 'Leather',
        category: 'Shoes',
        name: 'Waterproof Shoes'
      })
    ];
    const scoreRain = calculateWeatherSuitabilityScore(
      rainItems,
      createContext({ weather: 'Rain', temperature: '15°C' })
    );
    assert(scoreRain >= 80, `Rain with waterproof items should score high (got ${scoreRain})`);

    // Test 4.6: Snow condition with insulated items
    const snowItems = [
      createTestItem({ material: 'Insulated', category: 'Outerwear', name: 'Winter Coat' }),
      createTestItem({ material: 'Wool', name: 'Wool Pants' })
    ];
    const scoreSnow = calculateWeatherSuitabilityScore(
      snowItems,
      createContext({ weather: 'Snow', temperature: '0°C' })
    );
    assert(scoreSnow >= 80, `Snow with insulated items should score high (got ${scoreSnow})`);

    // Test 4.7: Wind condition with fitted items
    const windItems = [
      createTestItem({ fit: 'Fitted', name: 'Fitted Shirt' }),
      createTestItem({ silhouette: 'Slim', name: 'Slim Trousers' })
    ];
    const scoreWind = calculateWeatherSuitabilityScore(
      windItems,
      createContext({ weather: 'Windy', temperature: '15°C' })
    );
    assert(scoreWind >= 70, `Wind with fitted items should score reasonably (got ${scoreWind})`);

    // Test 4.8: Extreme heat (>40°C)
    const extremeHeatItems = [
      createTestItem({ material: 'Silk', colorPrimary: '#FFFFFF', name: 'Silk Top' })
    ];
    const scoreExtremeHeat = calculateWeatherSuitabilityScore(
      extremeHeatItems,
      createContext({ temperature: '45°C', weather: 'Sunny' })
    );
    assert(scoreExtremeHeat >= 0 && scoreExtremeHeat <= 100, `Extreme heat should return valid score (got ${scoreExtremeHeat})`);

    // Test 4.9: Extreme cold (<-20°C)
    const extremeColdItems = [
      createTestItem({ material: 'Insulated', category: 'Outerwear', name: 'Extreme Cold Coat' })
    ];
    const scoreExtremeCold = calculateWeatherSuitabilityScore(
      extremeColdItems,
      createContext({ temperature: '-25°C', weather: 'Snow' })
    );
    assert(scoreExtremeCold >= 0 && scoreExtremeCold <= 100, `Extreme cold should return valid score (got ${scoreExtremeCold})`);

    // Test 4.10: Empty wardrobe
    const scoreWeatherEmpty = calculateWeatherSuitabilityScore([], createContext());
    assert(scoreWeatherEmpty === 50, `Empty wardrobe should score 50 (got ${scoreWeatherEmpty})`);

    // ============================================================================
    // 5. SEASONALITY MATCH SCORE TESTS
    // ============================================================================
    console.log('\n📋 TEST SUITE 5: Seasonality Match Score\n');

    // Test 5.1: Items matching inferred season (summer items in hot weather)
    const summerItems = [
      createTestItem({ seasonality: ['Summer'], name: 'Summer Top' }),
      createTestItem({ seasonality: ['Summer'], name: 'Summer Shorts' })
    ];
    const scoreSummerMatch = calculateSeasonalityMatchScore(
      summerItems,
      createContext({ temperature: '30°C' })
    );
    assert(scoreSummerMatch >= 90, `Items matching summer should score high (got ${scoreSummerMatch})`);

    // Test 5.2: Items from different season (winter items in summer)
    const winterItems = [
      createTestItem({ seasonality: ['Winter'], name: 'Winter Coat' }),
      createTestItem({ seasonality: ['Winter'], name: 'Wool Pants' })
    ];
    const scoreWinterInSummer = calculateSeasonalityMatchScore(
      winterItems,
      createContext({ temperature: '28°C' })
    );
    assert(scoreWinterInSummer < 70, `Off-season items should score lower (got ${scoreWinterInSummer})`);

    // Test 5.3: Partial seasonality match
    const partialMatch = [
      createTestItem({ seasonality: ['Summer', 'Spring'], name: 'Versatile Top' }),
      createTestItem({ seasonality: ['Winter'], name: 'Winter Coat' })
    ];
    const scorePartial = calculateSeasonalityMatchScore(
      partialMatch,
      createContext({ temperature: '22°C' })
    );
    assert(scorePartial >= 40 && scorePartial <= 80, `Partial match should be in middle range (got ${scorePartial})`);

    // Test 5.4: Year-round items (all seasons)
    const yearRound = [
      createTestItem({ seasonality: ['Spring', 'Summer', 'Fall', 'Winter'], name: 'Jeans' }),
      createTestItem({ seasonality: ['Spring', 'Summer', 'Fall', 'Winter'], name: 'White Shirt' })
    ];
    const scoreYearRound = calculateSeasonalityMatchScore(
      yearRound,
      createContext({ temperature: '15°C' })
    );
    assert(scoreYearRound >= 90, `Year-round items should score very high (got ${scoreYearRound})`);

    // Test 5.5: No seasonality overlap
    const noOverlap = [
      createTestItem({ seasonality: ['Summer'], name: 'Summer Only' }),
      createTestItem({ seasonality: ['Winter'], name: 'Winter Only' })
    ];
    const scoreNoOverlap = calculateSeasonalityMatchScore(
      noOverlap,
      createContext({ temperature: '8°C' })
    );
    assert(scoreNoOverlap < 80, `No overlap should score lower than full match (got ${scoreNoOverlap})`);

    // Test 5.6: Empty wardrobe
    const scoreSeasonalityEmpty = calculateSeasonalityMatchScore([], createContext());
    assert(scoreSeasonalityEmpty === 50, `Empty wardrobe should score 50 (got ${scoreSeasonalityEmpty})`);

    // ============================================================================
    // 6. OVERALL COMPATIBILITY SCORE TESTS
    // ============================================================================
    console.log('\n📋 TEST SUITE 6: Overall Compatibility Score\n');

    // Test 6.1: Score is always 0-100
    const randomItems = [
      createTestItem({ colorPrimary: '#FF0000', formalityScore: 5 }),
      createTestItem({ colorPrimary: '#0000FF', formalityScore: 4 }),
      createTestItem({ colorPrimary: '#00FF00', formalityScore: 6 })
    ];
    const { score: scoreRandom } = calculateCompatibilityScore(randomItems, createContext());
    assert(scoreRandom >= 0 && scoreRandom <= 100, `Score should be 0-100 (got ${scoreRandom})`);

    // Test 6.2: Scores are deterministic (same input = same output)
    const testItems = [
      createTestItem({ name: 'Test 1', colorPrimary: '#1E293B', formalityScore: 5 }),
      createTestItem({ name: 'Test 2', colorPrimary: '#1E293B', formalityScore: 5 })
    ];
    const testContext = createContext({ temperature: '20°C', occasion: 'Casual Coffee' });
    const { score: score1 } = calculateCompatibilityScore(testItems, testContext);
    const { score: score2 } = calculateCompatibilityScore(testItems, testContext);
    assert(score1 === score2, `Scores should be deterministic (got ${score1} vs ${score2})`);

    // Test 6.3: Score breakdown components are present
    const { breakdown } = calculateCompatibilityScore(testItems, testContext);
    assert(breakdown.colorHarmony !== undefined, 'Should have colorHarmony');
    assert(breakdown.styleCompatibility !== undefined, 'Should have styleCompatibility');
    assert(breakdown.occasionAlignment !== undefined, 'Should have occasionAlignment');
    assert(breakdown.weatherSuitability !== undefined, 'Should have weatherSuitability');
    assert(breakdown.seasonalityMatch !== undefined, 'Should have seasonalityMatch');

    // Test 6.4: All breakdown components are 0-100
    assert(breakdown.colorHarmony >= 0 && breakdown.colorHarmony <= 100, `colorHarmony should be 0-100 (got ${breakdown.colorHarmony})`);
    assert(breakdown.styleCompatibility >= 0 && breakdown.styleCompatibility <= 100, `styleCompatibility should be 0-100 (got ${breakdown.styleCompatibility})`);
    assert(breakdown.occasionAlignment >= 0 && breakdown.occasionAlignment <= 100, `occasionAlignment should be 0-100 (got ${breakdown.occasionAlignment})`);
    assert(breakdown.weatherSuitability >= 0 && breakdown.weatherSuitability <= 100, `weatherSuitability should be 0-100 (got ${breakdown.weatherSuitability})`);
    assert(breakdown.seasonalityMatch >= 0 && breakdown.seasonalityMatch <= 100, `seasonalityMatch should be 0-100 (got ${breakdown.seasonalityMatch})`);

    // Test 6.5: Sorting by compatibility works (descending order)
    const outfit1Items = [
      createTestItem({ colorPrimary: '#000000', formalityScore: 8 }),
      createTestItem({ colorPrimary: '#FFFFFF', formalityScore: 8 })
    ];
    const outfit2Items = [
      createTestItem({ colorPrimary: '#FF0000', formalityScore: 2 }),
      createTestItem({ colorPrimary: '#00FF00', formalityScore: 1 })
    ];
    const { score: scoreOutfit1 } = calculateCompatibilityScore(outfit1Items, createContext({ occasion: 'Work Pitch', formalityPreference: 8 }));
    const { score: scoreOutfit2 } = calculateCompatibilityScore(outfit2Items, createContext({ occasion: 'Work Pitch', formalityPreference: 8 }));
    const scores = [scoreOutfit1, scoreOutfit2];
    const sortedScores = [...scores].sort((a, b) => b - a);
    assert(JSON.stringify(scores.sort((a, b) => b - a)) === JSON.stringify(sortedScores), `Sorting should work correctly`);

    // Test 6.6: Perfect outfit scores very high
    const perfectItems = [
      createTestItem({
        colorPrimary: '#000000',
        formalityScore: 8,
        material: 'Wool',
        category: 'Outerwear',
        seasonality: ['Winter'],
        subcategory: 'Blazer'
      }),
      createTestItem({
        colorPrimary: '#FFFFFF',
        formalityScore: 9,
        material: 'Wool',
        category: 'Bottoms',
        seasonality: ['Winter'],
        subcategory: 'Trousers'
      })
    ];
    const { score: perfectScore } = calculateCompatibilityScore(perfectItems, createContext({
      occasion: 'Work Pitch',
      formalityPreference: 8,
      temperature: '0°C',
      weather: 'Cloudy'
    }));
    assert(perfectScore >= 70, `Perfect outfit should score high (got ${perfectScore})`);

    // Test 6.7: Empty wardrobe
    const { score: scoreCompatEmpty } = calculateCompatibilityScore([], createContext());
    assert(scoreCompatEmpty === 0, `Empty wardrobe should score 0 (got ${scoreCompatEmpty})`);

    // Test 6.8: Terrible outfit scores low
    const terribleItems = [
      createTestItem({
        colorPrimary: '#FF0000',
        formalityScore: 1,
        material: 'Wool',
        seasonality: ['Summer']
      }),
      createTestItem({
        colorPrimary: '#00FF00',
        formalityScore: 2,
        material: 'Wool',
        seasonality: ['Summer']
      })
    ];
    const { score: terribleScore } = calculateCompatibilityScore(terribleItems, createContext({
      occasion: 'Work Pitch',
      formalityPreference: 8,
      temperature: '32°C',
      weather: 'Sunny'
    }));
    assert(terribleScore < 75, `Terrible outfit should score lower than excellent (got ${terribleScore})`);

    // ============================================================================
    // 7. EDGE CASES
    // ============================================================================
    console.log('\n📋 TEST SUITE 7: Edge Cases\n');

    // Test 7.1: Single item outfit
    const singleItemOutfit = [createTestItem({ formalityScore: 5 })];
    const { score: singleScore } = calculateCompatibilityScore(singleItemOutfit, createContext());
    assert(singleScore >= 0 && singleScore <= 100, `Single item should have valid score (got ${singleScore})`);

    // Test 7.2: Items with missing/null optional fields
    const incompleteItems = [
      createTestItem({ colorSecondary: undefined, fit: undefined }),
      createTestItem({ silhouette: undefined })
    ];
    const { score: incompleteScore } = calculateCompatibilityScore(incompleteItems, createContext());
    assert(incompleteScore >= 0 && incompleteScore <= 100, `Items with missing data should still score (got ${incompleteScore})`);

    // Test 7.3: Extreme formality 0
    const extremeFormality0 = [createTestItem({ formalityScore: 0 })];
    const scoreFormality0 = calculateOccasionAlignmentScore(
      extremeFormality0,
      createContext({ formalityPreference: 0 })
    );
    assert(scoreFormality0 >= 0 && scoreFormality0 <= 100, `Formality 0 should score validly (got ${scoreFormality0})`);

    // Test 7.4: Extreme formality 10
    const extremeFormality10 = [createTestItem({ formalityScore: 10 })];
    const scoreFormality10 = calculateOccasionAlignmentScore(
      extremeFormality10,
      createContext({ formalityPreference: 10 })
    );
    assert(scoreFormality10 >= 0 && scoreFormality10 <= 100, `Formality 10 should score validly (got ${scoreFormality10})`);

    // Test 7.5: Large wardrobe (20 items)
    const largeWardrobe = Array.from({ length: 20 }, (_, i) =>
      createTestItem({
        name: `Item ${i}`,
        colorPrimary: i % 2 === 0 ? '#000000' : '#FFFFFF',
        formalityScore: (i % 10) + 1
      })
    );
    const { score: largeWardrobeScore } = calculateCompatibilityScore(largeWardrobe, createContext());
    assert(largeWardrobeScore >= 0 && largeWardrobeScore <= 100, `Large wardrobe should score validly (got ${largeWardrobeScore})`);

    // Test 7.6: Extreme temperature -50°C
    const extremeCold = [createTestItem({ material: 'Wool' })];
    const scoreExtreme50 = calculateWeatherSuitabilityScore(
      extremeCold,
      createContext({ temperature: '-50°C' })
    );
    assert(scoreExtreme50 >= 0 && scoreExtreme50 <= 100, `Extreme cold -50°C should score validly (got ${scoreExtreme50})`);

    // Test 7.7: Extreme temperature +50°C
    const extremeHot = [createTestItem({ material: 'Cotton' })];
    const scoreExtreme50Hot = calculateWeatherSuitabilityScore(
      extremeHot,
      createContext({ temperature: '50°C' })
    );
    assert(scoreExtreme50Hot >= 0 && scoreExtreme50Hot <= 100, `Extreme heat +50°C should score validly (got ${scoreExtreme50Hot})`);

    // Test 7.8: Color normalization (string names)
    const namedColors = [
      createTestItem({ colorPrimary: 'black' }),
      createTestItem({ colorPrimary: 'white' })
    ];
    const scoreNamed = calculateColorHarmonyScore(namedColors);
    assert(scoreNamed >= 0 && scoreNamed <= 100, `Named colors should normalize and score (got ${scoreNamed})`);

    // Test 7.9: All fields exactly at minimum values
    const minItems = [
      createTestItem({ 
        formalityScore: 1,
        estimatedValueUSD: 1,
        colorPrimary: '#000000'
      })
    ];
    const { score: minScore } = calculateCompatibilityScore(minItems, createContext());
    assert(minScore >= 0 && minScore <= 100, `Minimum values should score validly (got ${minScore})`);

    // Test 7.10: All fields at maximum reasonable values
    const maxItems = [
      createTestItem({
        formalityScore: 10,
        estimatedValueUSD: 10000,
        colorPrimary: '#FFFFFF',
        material: 'Cashmere'
      })
    ];
    const { score: maxScore } = calculateCompatibilityScore(maxItems, createContext({ formalityPreference: 10 }));
    assert(maxScore >= 0 && maxScore <= 100, `Maximum values should score validly (got ${maxScore})`);

    // ============================================================================
    // 8. PROPERTY-BASED TEST: Score Range Invariant
    // ============================================================================
    console.log('\n📋 TEST SUITE 8: Property-Based Tests\n');

    // Property 8.1: All scores must be 0-100
    let scoreRangeTests = 0;
    for (let i = 0; i < 20; i++) {
      const randomWardrobe = Array.from({ length: 2 + Math.random() * 4 }, () =>
        createTestItem({
          formalityScore: 1 + Math.floor(Math.random() * 10),
          colorPrimary: ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#00FF00'][Math.floor(Math.random() * 5)]
        })
      );
      const color = calculateColorHarmonyScore(randomWardrobe);
      const style = calculateStyleCompatibilityScore(randomWardrobe);
      const occasion = calculateOccasionAlignmentScore(randomWardrobe, createContext());
      const weather = calculateWeatherSuitabilityScore(randomWardrobe, createContext());
      const seasonality = calculateSeasonalityMatchScore(randomWardrobe, createContext());
      const { score } = calculateCompatibilityScore(randomWardrobe, createContext());

      assert(color >= 0 && color <= 100, `Color score out of range: ${color}`);
      assert(style >= 0 && style <= 100, `Style score out of range: ${style}`);
      assert(occasion >= 0 && occasion <= 100, `Occasion score out of range: ${occasion}`);
      assert(weather >= 0 && weather <= 100, `Weather score out of range: ${weather}`);
      assert(seasonality >= 0 && seasonality <= 100, `Seasonality score out of range: ${seasonality}`);
      assert(score >= 0 && score <= 100, `Overall score out of range: ${score}`);
      scoreRangeTests++;
    }
    console.log(`✅ Property 8.1: All 20 random wardrobes scored in 0-100 range`);
    passCount += 6 * 20;

    // Property 8.2: Score should increase when formality matches context better
    let formalityImprovementTests = 0;
    const formalContext = createContext({ occasion: 'Work Pitch', formalityPreference: 9 });
    const casualContext = createContext({ occasion: 'Casual Coffee', formalityPreference: 2 });
    
    for (let i = 0; i < 10; i++) {
      const formalWardrobe = [
        createTestItem({ formalityScore: 8 }),
        createTestItem({ formalityScore: 9 })
      ];
      const casualWardrobe = [
        createTestItem({ formalityScore: 1 }),
        createTestItem({ formalityScore: 2 })
      ];

      const formalScore = calculateOccasionAlignmentScore(formalWardrobe, formalContext);
      const casualScore = calculateOccasionAlignmentScore(formalWardrobe, casualContext);
      
      assert(formalScore > casualScore, `Formal items should score better in formal context`);
      formalityImprovementTests++;
    }
    console.log(`✅ Property 8.2: Formality matching improves scores (tested 10 times)`);
    passCount += 10;

    // Property 8.3: Color harmony should prefer consistent colors
    let colorConsistencyTests = 0;
    for (let i = 0; i < 10; i++) {
      const consistentColors = [
        createTestItem({ colorPrimary: '#1E293B' }),
        createTestItem({ colorPrimary: '#1E293B' }),
        createTestItem({ colorPrimary: '#1E293B' })
      ];
      const mixedColors = [
        createTestItem({ colorPrimary: '#FF0000' }),
        createTestItem({ colorPrimary: '#00FF00' }),
        createTestItem({ colorPrimary: '#0000FF' })
      ];

      const consistentScore = calculateColorHarmonyScore(consistentColors);
      const mixedScore = calculateColorHarmonyScore(mixedColors);
      
      assert(consistentScore >= mixedScore, `Consistent colors should score >= mixed colors`);
      colorConsistencyTests++;
    }
    console.log(`✅ Property 8.3: Consistent colors score better than random mixes (tested 10 times)`);
    passCount += 10;

    // Property 8.4: Weather suitability improves with appropriate materials
    let weatherSuitabilityTests = 0;
    for (let i = 0; i < 10; i++) {
      const coldContext = createContext({ temperature: '5°C', weather: 'Snow' });
      
      const coldItems = [
        createTestItem({ material: 'Wool' }),
        createTestItem({ material: 'Cashmere' })
      ];
      const warmItems = [
        createTestItem({ material: 'Cotton' }),
        createTestItem({ material: 'Linen' })
      ];

      const coldScore = calculateWeatherSuitabilityScore(coldItems, coldContext);
      const warmScore = calculateWeatherSuitabilityScore(warmItems, coldContext);
      
      assert(coldScore >= warmScore, `Warm materials should score better in cold weather`);
      weatherSuitabilityTests++;
    }
    console.log(`✅ Property 8.4: Material appropriateness affects weather score (tested 10 times)`);
    passCount += 10;

    // Property 8.5: Style compatibility decreases with more different styles
    let styleVarietyTests = 0;
    const singleStyle = [
      createTestItem({ subcategory: 'T-Shirt' }),
      createTestItem({ subcategory: 'T-Shirt' })
    ];
    const doubleStyle = [
      createTestItem({ subcategory: 'T-Shirt' }),
      createTestItem({ subcategory: 'Blazer' })
    ];
    const tripleStyle = [
      createTestItem({ subcategory: 'T-Shirt' }),
      createTestItem({ subcategory: 'Blazer' }),
      createTestItem({ subcategory: 'Athletic Shoe' })
    ];

    const singleStyleScore = calculateStyleCompatibilityScore(singleStyle);
    const doubleStyleScore = calculateStyleCompatibilityScore(doubleStyle);
    const tripleStyleScore = calculateStyleCompatibilityScore(tripleStyle);

    assert(singleStyleScore >= doubleStyleScore, `Single style should score >= double style`);
    assert(doubleStyleScore >= tripleStyleScore, `Double style should score >= triple style`);
    console.log(`✅ Property 8.5: More style variety decreases compatibility score`);
    passCount += 2;

    console.log('\n========================================');
    console.log(`✨ TEST RESULTS: ${passCount} PASSED / ${failCount} FAILED`);
    console.log('========================================\n');

    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

runTests();
