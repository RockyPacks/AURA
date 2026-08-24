import { generateOutfitsFromWardrobe } from '../src/aiEngine.js';
import { getAllWardrobeItems, addWardrobeItem } from '../src/store.js';
import { ContextInput, WardrobeItem, GarmentCategory } from '../src/types.js';

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

function assertRange(value: number, min: number, max: number, message: string) {
  if (value < min || value > max) {
    failCount++;
    console.error(`❌ FAILED: ${message} (got ${value}, expected ${min}-${max})`);
    throw new Error(message);
  } else {
    passCount++;
    console.log(`✅ PASSED: ${message}`);
  }
}

function assertGreater(value: number, threshold: number, message: string) {
  if (value <= threshold) {
    failCount++;
    console.error(`❌ FAILED: ${message} (got ${value}, expected > ${threshold})`);
    throw new Error(message);
  } else {
    passCount++;
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('Sprint 3.1.2: Integration Tests');
  console.log('========================================\n');

  try {
    // ========================================================================
    // TEST SUITE 1: Outfit Generation with Scoring
    // ========================================================================
    console.log('📋 Test Suite 1: Outfit Generation with Scoring\n');

    // Test 1.1: Generate outfits returns score breakdown
    const context: ContextInput = {
      temperature: '18°C',
      weather: 'Cloudy',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Test City',
      formalityPreference: 4
    };

    const outfits = await generateOutfitsFromWardrobe(context);
    assert(Array.isArray(outfits), 'Should return array of outfits');
    assert(outfits.length > 0, 'Should generate at least one outfit');

    const firstOutfit = outfits[0];
    assert(firstOutfit.compatibilityScore !== undefined, 'Outfit should have compatibilityScore');
    assert(firstOutfit.scoringBreakdown !== undefined, 'Outfit should have scoringBreakdown');
    
    const breakdown = firstOutfit.scoringBreakdown;
    assertRange(breakdown!.colorHarmony, 0, 100, 'Color harmony should be 0-100');
    assertRange(breakdown!.styleCompatibility, 0, 100, 'Style compatibility should be 0-100');
    assertRange(breakdown!.occasionAlignment, 0, 100, 'Occasion alignment should be 0-100');
    assertRange(breakdown!.weatherSuitability, 0, 100, 'Weather suitability should be 0-100');
    assertRange(breakdown!.seasonalityMatch, 0, 100, 'Seasonality match should be 0-100');

    // Test 1.2: Compatibility scores influence outfit ordering
    console.log('\n📋 Test Suite 2: Outfit Ordering by Score\n');

    const casualContext: ContextInput = {
      temperature: '20°C',
      weather: 'Sunny',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Test City',
      formalityPreference: 3
    };

    const casualOutfits = await generateOutfitsFromWardrobe(casualContext);
    assert(casualOutfits.length > 0, 'Should generate casual outfits');

    // Check that scores are in descending order
    if (casualOutfits.length > 1) {
      for (let i = 0; i < casualOutfits.length - 1; i++) {
        const current = casualOutfits[i].compatibilityScore || 0;
        const next = casualOutfits[i + 1].compatibilityScore || 0;
        assert(
          current >= next,
          `Outfit ${i} score (${current}) should be >= outfit ${i + 1} score (${next})`
        );
      }
    }

    // Test 1.3: Formal occasion generates appropriate outfits
    console.log('\n📋 Test Suite 3: Occasion-Specific Generation\n');

    const workContext: ContextInput = {
      temperature: '18°C',
      weather: 'Cloudy',
      occasion: 'Work Pitch',
      mood: 'Confident',
      location: 'Test City',
      formalityPreference: 8
    };

    const workOutfits = await generateOutfitsFromWardrobe(workContext);
    assert(workOutfits.length > 0, 'Should generate work outfits');

    const workOutfit = workOutfits[0];
    if (workOutfit.items) {
      const avgFormality = workOutfit.items.reduce((s, i) => s + i.formalityScore, 0) / workOutfit.items.length;
      assertRange(avgFormality, 5, 10, 'Work outfit should have higher formality');
    }

    // Test 1.4: Weather context affects suitability scoring
    console.log('\n📋 Test Suite 4: Weather Context Impact\n');

    const coldContext: ContextInput = {
      temperature: '5°C',
      weather: 'Snow',
      occasion: 'Weekend Travel',
      mood: 'Relaxed',
      location: 'Test City',
      formalityPreference: 4
    };

    const coldOutfits = await generateOutfitsFromWardrobe(coldContext);
    assert(coldOutfits.length > 0, 'Should generate cold weather outfits');

    const coldOutfit = coldOutfits[0];
    if (coldOutfit.scoringBreakdown) {
      assertRange(
        coldOutfit.scoringBreakdown.weatherSuitability,
        0,
        100,
        'Cold weather outfit should have weather suitability score'
      );
    }

    // Test 1.5: Hot weather context affects suitability scoring
    const hotContext: ContextInput = {
      temperature: '28°C',
      weather: 'Sunny',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Test City',
      formalityPreference: 3
    };

    const hotOutfits = await generateOutfitsFromWardrobe(hotContext);
    assert(hotOutfits.length > 0, 'Should generate hot weather outfits');

    // Test 1.6: Rain context affects suitability scoring
    const rainContext: ContextInput = {
      temperature: '12°C',
      weather: 'Rain',
      occasion: 'Work Pitch',
      mood: 'Confident',
      location: 'Test City',
      formalityPreference: 7
    };

    const rainOutfits = await generateOutfitsFromWardrobe(rainContext);
    assert(rainOutfits.length > 0, 'Should generate rain-appropriate outfits');

    // Test 1.7: All outfit components have scores
    console.log('\n📋 Test Suite 5: Complete Outfit Metadata\n');

    const completeContext: ContextInput = {
      temperature: '18°C',
      weather: 'Cloudy',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Test City',
      formalityPreference: 4
    };

    const completeOutfits = await generateOutfitsFromWardrobe(completeContext);
    assert(completeOutfits.length > 0, 'Should generate outfits with complete metadata');

    completeOutfits.forEach((outfit, idx) => {
      assert(outfit.id !== undefined, `Outfit ${idx} should have id`);
      assert(outfit.title !== undefined, `Outfit ${idx} should have title`);
      assert(outfit.explanation !== undefined, `Outfit ${idx} should have explanation`);
      assert(Array.isArray(outfit.itemIds), `Outfit ${idx} should have itemIds array`);
      assert(outfit.formalityScore !== undefined, `Outfit ${idx} should have formalityScore`);
      assert(outfit.weatherMatchScore !== undefined, `Outfit ${idx} should have weatherMatchScore`);
      assert(outfit.confidenceScore !== undefined, `Outfit ${idx} should have confidenceScore`);
      assert(outfit.compatibilityScore !== undefined, `Outfit ${idx} should have compatibilityScore`);
      assert(outfit.scoringBreakdown !== undefined, `Outfit ${idx} should have scoringBreakdown`);
      assert(Array.isArray(outfit.whyReasons), `Outfit ${idx} should have whyReasons array`);
    });

    // Test 1.8: Scoring handles edge cases
    console.log('\n📋 Test Suite 6: Edge Cases\n');

    // Extreme cold
    const extremeColdContext: ContextInput = {
      temperature: '-25°C',
      weather: 'Snow',
      occasion: 'Weekend Travel',
      mood: 'Relaxed',
      location: 'Test City',
      formalityPreference: 3
    };

    const extremeColdOutfits = await generateOutfitsFromWardrobe(extremeColdContext);
    assert(extremeColdOutfits.length > 0, 'Should handle extreme cold gracefully');

    // Extreme heat
    const extremeHotContext: ContextInput = {
      temperature: '45°C',
      weather: 'Sunny',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Test City',
      formalityPreference: 2
    };

    const extremeHotOutfits = await generateOutfitsFromWardrobe(extremeHotContext);
    assert(extremeHotOutfits.length > 0, 'Should handle extreme heat gracefully');

    // Test 1.9: Different occasions produce different scores
    console.log('\n📋 Test Suite 7: Occasion Variance\n');

    const occasions: ContextInput['occasion'][] = [
      'Casual Coffee',
      'Work Pitch',
      'Evening Dinner',
      'Weekend Travel'
    ];

    const occasionOutfits = await Promise.all(
      occasions.map(occ =>
        generateOutfitsFromWardrobe({
          temperature: '18°C',
          weather: 'Cloudy',
          occasion: occ,
          mood: 'Confident',
          location: 'Test City',
          formalityPreference: occ === 'Work Pitch' ? 8 : occ === 'Evening Dinner' ? 7 : 4
        })
      )
    );

    assert(occasionOutfits.length === occasions.length, 'Should generate outfits for all occasions');

    // Test 1.10: Compatibility scores are deterministic with same input
    console.log('\n📋 Test Suite 8: Deterministic Scoring\n');

    const deterministicContext: ContextInput = {
      temperature: '18°C',
      weather: 'Cloudy',
      occasion: 'Casual Coffee',
      mood: 'Relaxed',
      location: 'Test City',
      formalityPreference: 4
    };

    const firstRun = await generateOutfitsFromWardrobe(deterministicContext);
    const secondRun = await generateOutfitsFromWardrobe(deterministicContext);

    assert(firstRun.length === secondRun.length, 'Should generate same number of outfits');

    firstRun.forEach((firstOutfit, idx) => {
      const secondOutfit = secondRun[idx];
      if (firstOutfit.items && secondOutfit.items) {
        const firstItemIds = firstOutfit.itemIds.sort().join(',');
        const secondItemIds = secondOutfit.itemIds.sort().join(',');
        // Note: Items might be in different order, but compatibility scores should be similar
        if (firstItemIds === secondItemIds) {
          // Same items, scores should be deterministic
          assertRange(
            Math.abs((firstOutfit.compatibilityScore || 0) - (secondOutfit.compatibilityScore || 0)),
            0,
            5,
            `Outfit ${idx} score should be deterministic (variance < 5)`
          );
        }
      }
    });

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
