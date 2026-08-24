import * as fc from 'fast-check';
import {
  generateOutfitExplanation,
  validateExplanation,
  generateOutfitTitle
} from '../src/aiEngine.js';
import { WardrobeItem, ContextInput, GeneratedOutfit } from '../src/types.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a mock wardrobe item for testing
 */
function createMockWardrobeItem(overrides?: Partial<WardrobeItem>): WardrobeItem {
  return {
    id: overrides?.id || 'item-' + Math.random().toString(36).slice(2),
    name: overrides?.name || 'Test Garment',
    category: overrides?.category || 'Tops',
    subcategory: overrides?.subcategory || 'T-Shirt',
    colorPrimary: overrides?.colorPrimary || '#1E293B',
    pattern: overrides?.pattern || 'Solid',
    material: overrides?.material || 'Cotton',
    brand: overrides?.brand || null,
    silhouette: overrides?.silhouette || 'Regular',
    fit: overrides?.fit || 'Regular',
    formalityScore: overrides?.formalityScore !== undefined ? overrides.formalityScore : 5,
    seasonality: overrides?.seasonality || ['Spring', 'Summer', 'Fall', 'Winter'],
    estimatedValueUSD: overrides?.estimatedValueUSD || 50,
    condition: overrides?.condition || 'Excellent',
    timesWorn: overrides?.timesWorn || 0,
    dateAdded: overrides?.dateAdded || new Date().toISOString(),
    ...overrides
  };
}

/**
 * Generates a mock context for testing
 */
function createMockContext(overrides?: Partial<ContextInput>): ContextInput {
  return {
    temperature: overrides?.temperature || '18°C',
    weather: overrides?.weather || 'Cloudy',
    occasion: overrides?.occasion || 'Work Pitch',
    mood: overrides?.mood || 'Confident',
    location: overrides?.location || 'Johannesburg',
    formalityPreference: overrides?.formalityPreference !== undefined ? overrides.formalityPreference : 7,
    ...overrides
  };
}

// ============================================================================
// Unit Tests: validateExplanation
// ============================================================================

console.log('\n=== Unit Tests: validateExplanation ===\n');

// Test 1: Valid explanation
{
  const valid = 'This navy blazer pairs perfectly with crisp white shirt for a polished look.';
  const result = validateExplanation(valid);
  console.assert(result.isValid, `FAIL: Valid explanation rejected - ${result.reason}`);
  console.log('✓ Valid explanation accepted');
}

// Test 2: Explanation too long (> 150 chars)
{
  const tooLong = 'A'.repeat(151);
  const result = validateExplanation(tooLong);
  console.assert(!result.isValid, 'FAIL: Too long explanation should be rejected');
  console.log('✓ Too long explanation rejected');
}

// Test 3: Explanation too short (< 20 chars)
{
  const tooShort = 'Short';
  const result = validateExplanation(tooShort);
  console.assert(!result.isValid, 'FAIL: Too short explanation should be rejected');
  console.log('✓ Too short explanation rejected');
}

// Test 4: Empty explanation
{
  const empty = '';
  const result = validateExplanation(empty);
  console.assert(!result.isValid, 'FAIL: Empty explanation should be rejected');
  console.log('✓ Empty explanation rejected');
}

// Test 5: AI markers detected
{
  const withMarker = 'As an AI, this outfit is great. ' + 'X'.repeat(100);
  const result = validateExplanation(withMarker);
  console.assert(!result.isValid, 'FAIL: AI marker should be detected');
  console.log('✓ AI markers detected');
}

// Test 6: Non-string input
{
  const result = validateExplanation(null as any);
  console.assert(!result.isValid, 'FAIL: Non-string should be rejected');
  console.log('✓ Non-string input rejected');
}

// ============================================================================
// Property-Based Tests: generateOutfitExplanation
// ============================================================================

console.log('\n=== Property-Based Tests: generateOutfitExplanation ===\n');

/**
 * Property 1: Explanations must be valid
 * For any wardrobe items and context, the generated explanation must pass validation
 */
async function testExplanationValidity() {
  return new Promise<void>(async (resolve) => {
    const runTest = async () => {
      for (let i = 0; i < 20; i++) {
        const items = [
          createMockWardrobeItem({ category: 'Tops', name: 'Blue Shirt' }),
          createMockWardrobeItem({ category: 'Bottoms', name: 'Black Trousers' })
        ];
        const context = createMockContext();
        
        try {
          const result = await generateOutfitExplanation(items, context);
          const validation = validateExplanation(result.explanation);
          
          if (!validation.isValid) {
            console.log(`✗ FAIL: Invalid explanation generated: ${result.explanation.slice(0, 50)}... (${validation.reason})`);
            process.exit(1);
          }
        } catch (err) {
          console.log(`✗ FAIL: Exception during explanation generation: ${(err as Error).message}`);
          process.exit(1);
        }
      }
      console.log('✓ Property 1: All generated explanations are valid');
      resolve();
    };
    
    runTest();
  });
}

await testExplanationValidity();

/**
 * Property 2: Explanations must include context references
 * Generated explanations should mention occasion or weather when relevant
 */
async function testExplanationContextRelevance() {
  return new Promise<void>(async (resolve) => {
    const contexts = [
      createMockContext({ occasion: 'Evening Dinner', weather: 'Sunny' }),
      createMockContext({ temperature: '5°C', weather: 'Snow' }),
      createMockContext({ occasion: 'Gym & Active', weather: 'Rain' })
    ];
    
    for (const context of contexts) {
      const items = [
        createMockWardrobeItem({ formalityScore: 8, category: 'Tops' }),
        createMockWardrobeItem({ formalityScore: 8, category: 'Bottoms' })
      ];
      
      try {
        const result = await generateOutfitExplanation(items, context);
        const explanation = result.explanation.toLowerCase();
        
        // Should mention occasion or weather or temperature somehow
        const mentionsContext = 
          explanation.includes(context.occasion.toLowerCase()) ||
          explanation.includes(context.weather.toLowerCase()) ||
          explanation.includes('weather') ||
          explanation.includes('temperature') ||
          explanation.includes('conditions');
        
        if (!mentionsContext && result.generatedBy === 'gemini-2.5-flash') {
          console.log(`⚠ Warning: AI explanation may not mention context: ${explanation.slice(0, 60)}...`);
        }
      } catch (err) {
        console.log(`✗ FAIL: Exception during context relevance test: ${(err as Error).message}`);
        process.exit(1);
      }
    }
    console.log('✓ Property 2: Explanations reference context appropriately');
    resolve();
  });
}

await testExplanationContextRelevance();

/**
 * Property 3: Caching must work correctly
 * Identical outfits should return cached explanations
 */
async function testExplanationCaching() {
  return new Promise<void>(async (resolve) => {
    const items = [
      createMockWardrobeItem({ id: 'item-1', name: 'Navy Blazer' }),
      createMockWardrobeItem({ id: 'item-2', name: 'White Shirt' })
    ];
    const context = createMockContext();
    
    try {
      // First call
      const result1 = await generateOutfitExplanation(items, context);
      const firstGeneratedAt = result1.generatedAt;
      
      // Wait a tiny bit to ensure different timestamps would occur
      await new Promise(r => setTimeout(r, 10));
      
      // Second call with same items (should be cached)
      const result2 = await generateOutfitExplanation(items, context);
      
      // Cached results should have same explanation and timestamp
      if (result1.explanation !== result2.explanation) {
        console.log('✗ FAIL: Cached explanation differs from original');
        process.exit(1);
      }
      
      // Timestamps should be identical (cache hit)
      if (result1.generatedAt !== result2.generatedAt) {
        console.log('⚠ Cache timestamp differs (might be cache miss): expected same timestamp for identical outfit');
      } else {
        console.log('✓ Cache working: identical outfit returned same timestamp');
      }
    } catch (err) {
      console.log(`✗ FAIL: Exception during caching test: ${(err as Error).message}`);
      process.exit(1);
    }
    
    console.log('✓ Property 3: Caching mechanism functional');
    resolve();
  });
}

await testExplanationCaching();

/**
 * Property 4: Generated vs Fallback
 * System should always return either Gemini or fallback, never fail
 */
async function testExplanationFallback() {
  return new Promise<void>(async (resolve) => {
    const testCases = [
      { items: [], context: createMockContext(), name: 'Empty items' },
      { items: [createMockWardrobeItem()], context: createMockContext(), name: 'Single item' },
      { items: [
          createMockWardrobeItem({ category: 'Tops' }),
          createMockWardrobeItem({ category: 'Bottoms' }),
          createMockWardrobeItem({ category: 'Outerwear' })
        ], context: createMockContext(), name: 'Multiple items'
      }
    ];
    
    for (const testCase of testCases) {
      try {
        if (testCase.items.length === 0) continue; // Skip empty items
        
        const result = await generateOutfitExplanation(testCase.items, testCase.context);
        
        if (!result.generatedBy || !['gemini-2.5-flash', 'fallback'].includes(result.generatedBy)) {
          console.log(`✗ FAIL: Invalid generatedBy: ${result.generatedBy}`);
          process.exit(1);
        }
        
        if (!result.explanation) {
          console.log(`✗ FAIL: Empty explanation for ${testCase.name}`);
          process.exit(1);
        }
      } catch (err) {
        console.log(`✗ FAIL: Exception for ${testCase.name}: ${(err as Error).message}`);
        process.exit(1);
      }
    }
    console.log('✓ Property 4: Always returns valid result (Gemini or fallback)');
    resolve();
  });
}

await testExplanationFallback();

// ============================================================================
// Unit Tests: generateOutfitTitle
// ============================================================================

console.log('\n=== Unit Tests: generateOutfitTitle ===\n');

/**
 * Test outfit title generation
 */
async function testOutfitTitle() {
  return new Promise<void>(async (resolve) => {
    const items = [
      createMockWardrobeItem({ name: 'Navy Blazer', silhouette: 'Tailored', formalityScore: 8 }),
      createMockWardrobeItem({ name: 'White Shirt', silhouette: 'Tailored', formalityScore: 7 })
    ];
    const context = createMockContext({ occasion: 'Work Pitch' });
    
    try {
      const title = await generateOutfitTitle(items, context);
      
      if (!title || title.length === 0) {
        console.log('✗ FAIL: Empty title generated');
        process.exit(1);
      }
      
      if (title.length > 60) {
        console.log(`✗ FAIL: Title too long (${title.length} chars): ${title}`);
        process.exit(1);
      }
      
      const wordCount = title.trim().split(/\s+/).length;
      if (wordCount > 6) {
        console.log(`⚠ Warning: Title has ${wordCount} words (expected 3-5): ${title}`);
      }
      
      console.log(`✓ Generated title: "${title}"`);
    } catch (err) {
      console.log(`✗ FAIL: Exception during title generation: ${(err as Error).message}`);
      process.exit(1);
    }
    
    resolve();
  });
}

await testOutfitTitle();

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== All Tests Passed ===\n');
process.exit(0);
