import { analyzeGarmentImage } from '../src/aiEngine.js';
import { 
  addWardrobeItem, 
  getAllWardrobeItems, 
  updateWardrobeItem,
  deleteWardrobeItem 
} from '../src/store.js';
import { WardrobeItem, GarmentCategory } from '../src/types.js';

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

async function runTests() {
  console.log('\n========================================');
  console.log('Sprint 2: AI Clothing Recognition Tests');
  console.log('========================================\n');

  try {
    // Test 1: Image ingestion
    console.log('📋 Test Suite 1: Image Ingestion\n');
    const minimalJpeg = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
    
    const result = await analyzeGarmentImage(minimalJpeg, 'image/jpeg');
    assert(result.name !== undefined && result.name !== '', 'Should accept valid JPEG image data');
    assert(result.name !== undefined && result.name !== '', 'Should have name property');
    assert(result.category !== undefined, 'Should have category property');
    assert(['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'One-Piece'].includes(result.category), 'Category should be valid');

    // Test 2: Handle empty image gracefully
    console.log('\n📋 Test Suite 2: Error Handling\n');
    const emptyResult = await analyzeGarmentImage('', 'image/jpeg');
    assert(emptyResult !== null, 'Should handle empty image gracefully');
    assert(emptyResult.confidence >= 0.5 && emptyResult.confidence <= 1.0, 'Confidence should be in valid range');

    // Test 3: All required fields present
    console.log('\n📋 Test Suite 3: Structured Output\n');
    assert(result.name !== undefined, 'Should have name');
    assert(result.category !== undefined, 'Should have category');
    assert(result.subcategory !== undefined, 'Should have subcategory');
    assert(result.colorPrimary !== undefined, 'Should have colorPrimary');
    assert(result.pattern !== undefined, 'Should have pattern');
    assert(result.material !== undefined, 'Should have material');
    assert(result.formalityScore >= 1 && result.formalityScore <= 10, 'Formality score should be 1-10');
    assert(Array.isArray(result.seasonality), 'Seasonality should be array');
    assert(result.estimatedValueUSD >= 0, 'Estimated value should be >= 0');
    assert(['New', 'Excellent', 'Good', 'Worn'].includes(result.condition), 'Condition should be valid');

    // Test 4: Confidence scores
    console.log('\n📋 Test Suite 4: Confidence Handling\n');
    assert(result.confidence >= 0.5 && result.confidence <= 1.0, 'Overall confidence should be between 0.5-1.0');
    if (result.fieldConfidences && result.fieldConfidences.length > 0) {
      result.fieldConfidences.forEach(fc => {
        assert(typeof fc.confidence === 'number', `Field ${fc.field} should have numeric confidence`);
        assert(fc.confidence >= 0 && fc.confidence <= 1.0, `Field ${fc.field} confidence should be 0-1.0`);
        assert(typeof fc.isLowConfidence === 'boolean', `Field ${fc.field} should have boolean isLowConfidence`);
        assert(fc.isLowConfidence === (fc.confidence < 0.7), `Field ${fc.field} isLowConfidence flag should match threshold`);
      });
    }

    // Test 5: User correction and save flow
    console.log('\n📋 Test Suite 5: Correction & Persistence\n');
    const testItem: WardrobeItem = {
      id: `test-item-${Date.now()}`,
      name: 'User Corrected Item',
      category: 'Tops' as GarmentCategory,
      subcategory: 'T-Shirt',
      colorPrimary: '#FF0000',
      pattern: 'Solid',
      material: 'Cotton',
      brand: null,
      formalityScore: 3,
      seasonality: ['Spring', 'Summer'],
      estimatedValueUSD: 50,
      condition: 'Excellent',
      timesWorn: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      aiMetadata: {
        confidence: 0.88,
        detectedCategory: 'Tops'
      },
      imageUrl: minimalJpeg
    };

    const saved = addWardrobeItem(testItem);
    assert(saved.id === testItem.id, 'Saved item should have correct ID');
    assert(saved.name === testItem.name, 'Saved item should preserve name');
    assert(saved.imageUrl === testItem.imageUrl, 'Saved item should preserve image');
    assert(saved.aiMetadata !== undefined, 'Saved item should preserve AI metadata');

    // Test 6: Corrections override AI suggestions
    console.log('\n📋 Test Suite 6: Override AI Suggestions\n');
    const correctedFormality = 7;
    const updated = updateWardrobeItem(saved.id, { formalityScore: correctedFormality });
    assert(updated !== null, 'Update should succeed');
    assert(updated!.formalityScore === correctedFormality, 'Formality should be corrected');
    assert(updated!.name === testItem.name, 'Other fields should be preserved');

    // Test 7: Persistence across retrieval
    console.log('\n📋 Test Suite 7: Full Persistence\n');
    const retrieved = getAllWardrobeItems().find(i => i.id === saved.id);
    assert(retrieved !== undefined, 'Item should be retrievable');
    assert(retrieved!.name === testItem.name, 'Retrieved item name should match');
    assert(retrieved!.imageUrl === testItem.imageUrl, 'Retrieved item should have image');
    assert(retrieved!.formalityScore === correctedFormality, 'Retrieved item should have corrected value');

    // Test 8: Complete acceptance flow
    console.log('\n📋 Test Suite 8: Acceptance Flow\n');
    const acceptanceItem: WardrobeItem = {
      id: `acceptance-${Date.now()}`,
      name: 'Acceptance Test Item',
      category: 'Bottoms' as GarmentCategory,
      subcategory: 'Jeans',
      colorPrimary: '#1E40AF',
      pattern: 'Solid',
      material: 'Denim',
      brand: 'Levi\'s',
      formalityScore: 3,
      seasonality: ['Spring', 'Fall'],
      estimatedValueUSD: 120,
      condition: 'Good',
      timesWorn: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      imageUrl: minimalJpeg
    };

    const acceptanceSaved = addWardrobeItem(acceptanceItem);
    assert(acceptanceSaved.imageUrl === minimalJpeg, 'Acceptance test should preserve image');
    
    const deleted = deleteWardrobeItem(acceptanceSaved.id);
    assert(deleted === true, 'Delete should succeed');
    
    const notFound = getAllWardrobeItems().find(i => i.id === acceptanceSaved.id);
    assert(notFound === undefined, 'Item should be removed after delete');

    // Cleanup test items
    deleteWardrobeItem(saved.id);

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

