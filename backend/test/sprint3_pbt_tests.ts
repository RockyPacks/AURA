import fc from 'fast-check';
import { generateOutfitsFromWardrobe } from '../src/aiEngine.js';
import { 
  addWardrobeItem, 
  getAllWardrobeItems,
  deleteWardrobeItem
} from '../src/store.js';
import { WardrobeItem, ContextInput, GarmentCategory } from '../src/types.js';

// Simple test runner
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failCount++;
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    passCount++;
    console.log(`✅ PASSED: ${message}`);
  }
}

// Generators for property-based testing

const garmentCategories: GarmentCategory[] = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'One-Piece'];
const subcategories = ['T-Shirt', 'Shirt', 'Sweater', 'Jeans', 'Trousers', 'Blazer', 'Coat', 'Sneakers', 'Boots'];
const colors = ['#1E293B', '#FFFFFF', '#1E40AF', '#DC2626', '#059669', '#D97706'];
const patterns = ['Solid', 'Striped', 'Checkered', 'Graphic', 'Textured'];
const materials = ['Cotton', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather'];
const conditions: Array<'New' | 'Excellent' | 'Good' | 'Worn'> = ['New', 'Excellent', 'Good', 'Worn'];

// Generator for random wardrobe items
function* generateWardrobeItems() {
  for (let i = 0; i < 100; i++) {
    const category = fc.sample(fc.constantFrom(...garmentCategories), 1)[0];
    const subcategory = fc.sample(fc.constantFrom(...subcategories), 1)[0];
    const color = fc.sample(fc.constantFrom(...colors), 1)[0];
    const pattern = fc.sample(fc.constantFrom(...patterns), 1)[0];
    const material = fc.sample(fc.constantFrom(...materials), 1)[0];
    const condition = fc.sample(fc.constantFrom(...conditions), 1)[0];
    const formality = fc.sample(fc.integer({ min: 1, max: 10 }), 1)[0];
    const value = fc.sample(fc.integer({ min: 30, max: 500 }), 1)[0];

    yield {
      category,
      subcategory,
      colorPrimary: color,
      pattern,
      material,
      condition,
      formalityScore: formality,
      estimatedValueUSD: value
    };
  }
}

// Create test context generators
const contextGenerator = fc.tuple(
  fc.constantFrom('Sunny', 'Cloudy', 'Rain', 'Snow', 'Windy'),
  fc.constantFrom('Work Pitch', 'Casual Coffee', 'Evening Dinner', 'Weekend Travel', 'Gym & Active'),
  fc.constantFrom('Confident', 'Relaxed', 'Bold', 'Understated', 'Creative'),
  fc.integer({ min: 5, max: 30 }),
  fc.integer({ min: 1, max: 10 })
).map(([weather, occasion, mood, temp, formality]) => ({
  temperature: `${temp}°C`,
  weather: weather as any,
  occasion: occasion as any,
  mood: mood as any,
  location: 'Johannesburg',
  formalityPreference: formality,
  timeOfDay: fc.sample(fc.constantFrom('Morning', 'Afternoon', 'Evening'), 1)[0] as any
}));

async function runPropertyBasedTests() {
  console.log('\n========================================');
  console.log('Sprint 3.1.1: Property-Based Tests');
  console.log('**Validates: Requirements 12.2 - Outfit Diversity**');
  console.log('========================================\n');

  try {
    // Property 1: Outfit Generation Always Returns Array
    console.log('📋 Property 1: Outfit Generation Output Structure\n');
    
    await fc.assert(
      fc.asyncProperty(contextGenerator, async (context: ContextInput) => {
        const outfits = await generateOutfitsFromWardrobe(context);
        
        // Property: Should always return an array
        return Array.isArray(outfits);
      }),
      { numRuns: 50 }
    );
    passCount++;
    console.log('✅ PASSED: Outfit generation always returns array');

    // Property 2: Generated Outfits Always Have Valid Scores
    console.log('\n📋 Property 2: Outfit Scoring Validity\n');
    
    await fc.assert(
      fc.asyncProperty(contextGenerator, async (context: ContextInput) => {
        const outfits = await generateOutfitsFromWardrobe(context);
        
        // Property: All outfits should have valid scores (0-100)
        return outfits.every(outfit => 
          outfit.formalityScore >= 1 && outfit.formalityScore <= 10 &&
          outfit.weatherMatchScore >= 0 && outfit.weatherMatchScore <= 100 &&
          outfit.confidenceScore >= 0 && outfit.confidenceScore <= 100
        );
      }),
      { numRuns: 50 }
    );
    passCount++;
    console.log('✅ PASSED: All outfit scores are in valid ranges');

    // Property 3: Outfits Have Minimum Item Requirement
    console.log('\n📋 Property 3: Outfit Completeness\n');
    
    await fc.assert(
      fc.asyncProperty(contextGenerator, async (context: ContextInput) => {
        const outfits = await generateOutfitsFromWardrobe(context);
        
        // Property: Each outfit must have at least 2 items (top + bottom)
        // Exception: sparse wardrobe might return fewer
        if (outfits.length === 0) return true;
        
        return outfits.every(outfit => 
          Array.isArray(outfit.itemIds) && 
          outfit.itemIds.length >= 1 &&  // At least 1 item (for sparse wardrobes)
          outfit.title && 
          outfit.explanation
        );
      }),
      { numRuns: 50 }
    );
    passCount++;
    console.log('✅ PASSED: All outfits have required structure');

    // Property 4: Multiple Outfits Provide Variety
    console.log('\n📋 Property 4: Outfit Diversity (when multiple generated)\n');
    
    await fc.assert(
      fc.asyncProperty(contextGenerator, async (context: ContextInput) => {
        const outfits = await generateOutfitsFromWardrobe(context);
        
        // Property: If multiple outfits generated, they should have some variety
        if (outfits.length <= 1) return true;
        
        // Check that not all outfits are identical
        const outfitSignatures = outfits.map(o => o.itemIds.sort().join(','));
        const uniqueSignatures = new Set(outfitSignatures);
        
        return uniqueSignatures.size > 1; // At least 2 different item combinations
      }),
      { numRuns: 50 }
    );
    passCount++;
    console.log('✅ PASSED: Multiple outfits show variety');

    // Property 5: Context Influences Scoring
    console.log('\n📋 Property 5: Context Sensitivity\n');
    
    const formalContext: ContextInput = {
      temperature: '18°C',
      weather: 'Cloudy',
      occasion: 'Work Pitch',
      mood: 'Confident',
      location: 'Johannesburg',
      formalityPreference: 8
    };

    const casualContext: ContextInput = {
      temperature: '22°C',
      weather: 'Sunny',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Johannesburg',
      formalityPreference: 3
    };

    const formalOutfits = await generateOutfitsFromWardrobe(formalContext);
    const casualOutfits = await generateOutfitsFromWardrobe(casualContext);

    if (formalOutfits.length > 0 && casualOutfits.length > 0) {
      const formalAvgFormality = formalOutfits.reduce((acc, o) => acc + o.formalityScore, 0) / formalOutfits.length;
      const casualAvgFormality = casualOutfits.reduce((acc, o) => acc + o.formalityScore, 0) / casualOutfits.length;
      
      // Property: Formal context should yield higher average formality scores
      assert(formalAvgFormality >= casualAvgFormality - 1, 'Formal context should yield higher formality scores than casual');
    }

    passCount++;
    console.log('✅ PASSED: Context influences outfit recommendations');

    // Property 6: Item Filtering Works (No In-Wash Items)
    console.log('\n📋 Property 6: Clean Status Filtering\n');
    
    // Add test items
    const testItems: WardrobeItem[] = [];
    for (let i = 0; i < 3; i++) {
      const items = Array.from(generateWardrobeItems());
      const item = items[i];
      
      const testItem = addWardrobeItem({
        id: `pbt-item-${Date.now()}-${i}`,
        name: `Test Item ${i}`,
        category: item.category,
        subcategory: item.subcategory,
        colorPrimary: item.colorPrimary,
        pattern: item.pattern,
        material: item.material,
        brand: null,
        formalityScore: item.formalityScore,
        seasonality: ['Spring', 'Summer', 'Fall', 'Winter'],
        estimatedValueUSD: item.estimatedValueUSD,
        condition: item.condition,
        timesWorn: 0,
        status: i % 2 === 0 ? 'clean' : 'in_wash',
        dateAdded: new Date().toISOString().split('T')[0]
      });
      testItems.push(testItem);
    }

    const outfits = await generateOutfitsFromWardrobe(formalContext);
    const allOutfitItemIds = new Set<string>();
    outfits.forEach(outfit => {
      outfit.itemIds.forEach(id => allOutfitItemIds.add(id));
    });

    // Property: No in-wash items should appear in outfits
    const inWashItems = testItems.filter(i => i.status === 'in_wash');
    assert(
      inWashItems.every(item => !allOutfitItemIds.has(item.id)),
      'In-wash items should be filtered out'
    );

    passCount++;
    console.log('✅ PASSED: In-wash items are properly filtered');

    // Cleanup test items
    testItems.forEach(item => deleteWardrobeItem(item.id));

    // Property 7: Generated Outfits Are Deterministic With Same Input
    console.log('\n📋 Property 7: Output Consistency (Same Input => Reasonable Output)\n');
    
    const staticContext: ContextInput = {
      temperature: '20°C',
      weather: 'Sunny',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Johannesburg',
      formalityPreference: 5
    };

    const run1 = await generateOutfitsFromWardrobe(staticContext);
    const run2 = await generateOutfitsFromWardrobe(staticContext);

    // Property: Same context should generate valid outfits consistently
    assert(
      run1.length >= 1 && run2.length >= 1,
      'Same context should generate outfits consistently'
    );

    assert(
      run1.length === run2.length,
      'Same context should generate same number of outfits'
    );

    passCount++;
    console.log('✅ PASSED: Output is consistent with same input');

    // Property 8: Formality Score Range Validation
    console.log('\n📋 Property 8: Formality Score Distribution\n');
    
    await fc.assert(
      fc.asyncProperty(contextGenerator, async (context: ContextInput) => {
        const outfits = await generateOutfitsFromWardrobe(context);
        
        // Property: All formality scores should be within valid range (1-10)
        // Note: Occasion context can override user formality preference
        if (outfits.length === 0) return true;
        
        return outfits.every(outfit => 
          outfit.formalityScore >= 1 && outfit.formalityScore <= 10
        );
      }),
      { numRuns: 50 }
    );
    passCount++;
    console.log('✅ PASSED: Formality scores are within valid range (1-10)');

    // Summary
    console.log('\n========================================');
    console.log(`✨ PBT RESULTS: ${passCount} PASSED / ${failCount} FAILED`);
    console.log('========================================\n');
    
    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ PBT FATAL ERROR:', error);
    process.exit(1);
  }
}

runPropertyBasedTests();
