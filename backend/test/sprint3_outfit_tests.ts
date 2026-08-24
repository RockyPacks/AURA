import { generateOutfitsFromWardrobe, swapOutfitItem } from '../src/aiEngine.js';
import { 
  addWardrobeItem, 
  getAllWardrobeItems,
  deleteWardrobeItem,
  logWearEvent
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

// Helper to create test items
function createTestItem(overrides?: Partial<WardrobeItem>): WardrobeItem {
  const id = `test-item-${Date.now()}-${Math.random()}`;
  return {
    id,
    name: 'Test Item',
    category: 'Tops' as GarmentCategory,
    subcategory: 'T-Shirt',
    colorPrimary: '#1E293B',
    pattern: 'Solid',
    material: '100% Cotton',
    brand: null,
    formalityScore: 5,
    seasonality: ['Spring', 'Summer', 'Fall', 'Winter'],
    estimatedValueUSD: 50,
    condition: 'Excellent',
    timesWorn: 0,
    status: 'clean',
    dateAdded: new Date().toISOString().split('T')[0],
    ...overrides
  };
}

async function runTests() {
  console.log('\n========================================');
  console.log('Sprint 3.1.1: Outfit Generation Tests');
  console.log('========================================\n');

  try {
    // Test 1: Item Filtering by Clean Status
    console.log('📋 Test Suite 1: Item Filtering by Clean Status\n');
    
    // Create clean and dirty items
    const cleanTop = addWardrobeItem(createTestItem({
      id: `clean-top-${Date.now()}`,
      name: 'Clean White Tee',
      category: 'Tops',
      status: 'clean'
    }));

    const cleanBottom = addWardrobeItem(createTestItem({
      id: `clean-bottom-${Date.now()}`,
      name: 'Clean Navy Jeans',
      category: 'Bottoms',
      status: 'clean'
    }));

    const dirtyItem = addWardrobeItem(createTestItem({
      id: `dirty-item-${Date.now()}`,
      name: 'Dirty Sweater',
      category: 'Tops',
      status: 'in_wash',
      isDirty: true
    }));

    const context: ContextInput = {
      temperature: '18°C',
      weather: 'Cloudy',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Johannesburg',
      formalityPreference: 4
    };

    const outfits = await generateOutfitsFromWardrobe(context);
    assert(Array.isArray(outfits), 'Should return array of outfits');
    assert(outfits.length > 0, 'Should generate at least 1 outfit from available clean items');

    // Check that dirty items are not in the generated outfits
    const allOutfitItemIds = new Set<string>();
    outfits.forEach(outfit => {
      outfit.itemIds.forEach(id => allOutfitItemIds.add(id));
    });
    
    assert(!allOutfitItemIds.has(dirtyItem.id), 'Dirty items should not be included in outfits');
    assert(allOutfitItemIds.has(cleanTop.id) || allOutfitItemIds.has(cleanBottom.id), 'Should include at least one clean item');

    // Test 2: Minimum Outfit Generation
    console.log('\n📋 Test Suite 2: Minimum Outfit Generation\n');

    const minOutfits = await generateOutfitsFromWardrobe({
      temperature: '20°C',
      weather: 'Sunny',
      occasion: 'Work Pitch',
      mood: 'Confident',
      location: 'Johannesburg',
      formalityPreference: 7
    });

    assert(minOutfits.length >= 1, 'Should generate at least 1 outfit');
    assert(minOutfits.length <= 10, 'Should generate at most 10 outfits');

    // Test 3: Outfit Structure and Scoring
    console.log('\n📋 Test Suite 3: Outfit Structure and Scoring\n');

    const firstOutfit = minOutfits[0];
    assert(firstOutfit.id !== undefined && firstOutfit.id !== '', 'Outfit should have unique ID');
    assert(firstOutfit.title !== undefined && firstOutfit.title !== '', 'Outfit should have title');
    assert(firstOutfit.explanation !== undefined && firstOutfit.explanation !== '', 'Outfit should have explanation');
    assert(Array.isArray(firstOutfit.itemIds), 'Outfit should have itemIds array');
    assert(firstOutfit.itemIds.length >= 2, 'Outfit should have at least 2 items (top + bottom)');
    assert(firstOutfit.formalityScore >= 1 && firstOutfit.formalityScore <= 10, 'Formality score should be 1-10');
    assert(firstOutfit.weatherMatchScore >= 0 && firstOutfit.weatherMatchScore <= 100, 'Weather score should be 0-100');
    assert(firstOutfit.confidenceScore >= 0 && firstOutfit.confidenceScore <= 100, 'Confidence score should be 0-100');
    assert(Array.isArray(firstOutfit.whyReasons), 'Should have reasons array');

    // Test 4: Outfit Item Variety
    console.log('\n📋 Test Suite 4: Outfit Item Variety\n');

    // Add diverse items
    const blueShirt = addWardrobeItem(createTestItem({
      id: `blue-shirt-${Date.now()}`,
      name: 'Blue Oxford Shirt',
      category: 'Tops',
      colorPrimary: '#1E40AF',
      formalityScore: 7
    }));

    const greyPants = addWardrobeItem(createTestItem({
      id: `grey-pants-${Date.now()}`,
      name: 'Grey Trousers',
      category: 'Bottoms',
      colorPrimary: '#6B7280',
      formalityScore: 8
    }));

    const casualJeans = addWardrobeItem(createTestItem({
      id: `casual-jeans-${Date.now()}`,
      name: 'Casual Blue Jeans',
      category: 'Bottoms',
      colorPrimary: '#1E1B4B',
      formalityScore: 3
    }));

    const casualShirt = addWardrobeItem(createTestItem({
      id: `casual-shirt-${Date.now()}`,
      name: 'White Casual Tee',
      category: 'Tops',
      colorPrimary: '#F8FAFC',
      formalityScore: 2
    }));

    const diverseOutfits = await generateOutfitsFromWardrobe(context);
    assert(diverseOutfits.length >= 1, 'Should generate diverse outfits with varied items');

    // Check variety across outfits
    if (diverseOutfits.length > 1) {
      const firstOutfitIds = new Set(diverseOutfits[0].itemIds);
      const secondOutfitIds = new Set(diverseOutfits[1].itemIds);
      const differentItems = [...firstOutfitIds].filter(id => !secondOutfitIds.has(id)).length > 0;
      assert(differentItems, 'Multiple outfits should use different items for variety');
    }

    // Test 5: Empty Wardrobe Handling
    console.log('\n📋 Test Suite 5: Empty/Sparse Wardrobe Handling\n');

    // Delete all test items temporarily
    const allItems = getAllWardrobeItems();
    const testItemIds = [cleanTop.id, cleanBottom.id, dirtyItem.id, blueShirt.id, greyPants.id, casualJeans.id, casualShirt.id];
    testItemIds.forEach(id => {
      const item = allItems.find(i => i.id === id);
      if (item) deleteWardrobeItem(id);
    });

    const emptyWardrobe = getAllWardrobeItems().filter(i => i.status !== 'in_wash' && !i.isDirty);
    if (emptyWardrobe.length < 2) {
      const sparseOutfits = await generateOutfitsFromWardrobe(context);
      assert(Array.isArray(sparseOutfits), 'Should handle sparse wardrobe gracefully');
      assert(sparseOutfits.length >= 1, 'Should return at least 1 outfit even with sparse wardrobe');
      if (sparseOutfits[0]) {
        assert(sparseOutfits[0].explanation !== '', 'Should provide explanation even for sparse wardrobe');
      }
    }

    // Test 6: Context-Based Filtering
    console.log('\n📋 Test Suite 6: Context-Based Filtering\n');

    // Re-add items for context testing
    const formalBlazzer = addWardrobeItem(createTestItem({
      id: `blazer-${Date.now()}`,
      name: 'Italian Wool Blazer',
      category: 'Outerwear',
      formalityScore: 9,
      colorPrimary: '#1E293B'
    }));

    const formalPants = addWardrobeItem(createTestItem({
      id: `formal-pants-${Date.now()}`,
      name: 'Dress Trousers',
      category: 'Bottoms',
      formalityScore: 8,
      colorPrimary: '#1E1B4B'
    }));

    const formalContext: ContextInput = {
      temperature: '18°C',
      weather: 'Cloudy',
      occasion: 'Work Pitch',
      mood: 'Confident',
      location: 'Johannesburg',
      formalityPreference: 8
    };

    const formalOutfits = await generateOutfitsFromWardrobe(formalContext);
    assert(formalOutfits.length > 0, 'Should generate formal outfits for work occasion');
    
    if (formalOutfits[0]) {
      const formalityScores = formalOutfits.map(o => o.formalityScore);
      const avgFormality = formalityScores.reduce((a, b) => a + b, 0) / formalityScores.length;
      assert(avgFormality >= 5, 'Formal context should generally yield higher formality scores');
    }

    // Test 7: Weather-Based Recommendations
    console.log('\n📋 Test Suite 7: Weather-Based Recommendations\n');

    const coldContext: ContextInput = {
      temperature: '5°C',
      weather: 'Snow',
      occasion: 'Weekend Travel',
      mood: 'Relaxed',
      location: 'Johannesburg',
      formalityPreference: 4
    };

    const warmWoolItem = addWardrobeItem(createTestItem({
      id: `wool-sweater-${Date.now()}`,
      name: 'Merino Wool Sweater',
      category: 'Tops',
      material: '100% Merino Wool',
      seasonality: ['Fall', 'Winter', 'Spring'],
      formalityScore: 6
    }));

    const coldOutfits = await generateOutfitsFromWardrobe(coldContext);
    assert(coldOutfits.length > 0, 'Should generate cold-weather appropriate outfits');

    // Test 8: Outfit Item Compatibility
    console.log('\n📋 Test Suite 8: Outfit Item Compatibility\n');

    const allOutfits = await generateOutfitsFromWardrobe(context);
    assert(allOutfits.length > 0, 'Should generate outfits');

    allOutfits.forEach((outfit, idx) => {
      assert(outfit.itemIds.length >= 2, `Outfit ${idx} should have at least 2 items`);
      
      const categories = new Map<GarmentCategory, number>();
      outfit.itemIds.forEach(itemId => {
        const item = getAllWardrobeItems().find(w => w.id === itemId);
        if (item) {
          categories.set(item.category, (categories.get(item.category) || 0) + 1);
        }
      });

      // Ensure variety in categories (not all same type)
      assert(categories.size >= 2, `Outfit ${idx} should have items from different categories`);
    });

    // Test 9: Item Swap Functionality
    console.log('\n📋 Test Suite 9: Item Swap Functionality\n');

    if (formalOutfits.length > 0) {
      const outfit = formalOutfits[0];
      const topInOutfit = outfit.itemIds.find(id => {
        const item = getAllWardrobeItems().find(w => w.id === id);
        return item?.category === 'Tops';
      });

      const alternativeTop = getAllWardrobeItems().find(i => 
        i.category === 'Tops' && 
        i.status === 'clean' && 
        !outfit.itemIds.includes(i.id)
      );

      if (topInOutfit && alternativeTop) {
        const swapped = swapOutfitItem(outfit.itemIds, topInOutfit, alternativeTop.id);
        assert(Array.isArray(swapped.updatedItemIds), 'Swap should return updated item IDs');
        assert(swapped.updatedItemIds.includes(alternativeTop.id), 'Swap should include replacement item');
        assert(swapped.recalculatedScore >= 0 && swapped.recalculatedScore <= 100, 'Recalculated score should be valid');
        assert(swapped.compatibilityNote !== '', 'Swap should include compatibility note');
      }
    }

    // Test 10: Recent Wear Avoidance
    console.log('\n📋 Test Suite 10: Recent Wear Avoidance\n');

    if (formalOutfits.length > 0) {
      const outfit1 = formalOutfits[0];
      
      // Log a wear event for these items
      logWearEvent({
        outfitId: 'test-outfit-1',
        outfitTitle: 'Test Wear Event',
        itemIds: outfit1.itemIds.slice(0, 2),
        context,
        feedback: 'loved'
      });

      // Generate new outfits and check that worn items are deprioritized
      const laterOutfits = await generateOutfitsFromWardrobe(context);
      assert(laterOutfits.length > 0, 'Should generate outfits after wear event');
      
      if (laterOutfits.length > 1) {
        // First outfit should ideally be different from recently worn
        const recentlyWornIds = new Set(outfit1.itemIds.slice(0, 2));
        const firstNewOutfit = laterOutfits[0];
        const reuseCount = firstNewOutfit.itemIds.filter(id => recentlyWornIds.has(id)).length;
        
        // It's okay if some items are reused, but there should be variety
        assert(reuseCount < firstNewOutfit.itemIds.length, 'Should avoid immediately reusing recently worn items');
      }
    }

    // Cleanup test items
    console.log('\n📋 Cleanup\n');
    const cleanupIds = [
      formalBlazzer.id, 
      formalPants.id, 
      warmWoolItem.id
    ];
    cleanupIds.forEach(id => deleteWardrobeItem(id));

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
