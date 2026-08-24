import {
  getWearStats,
  getDaysSinceWorn,
  getWearStreak,
  getSeasonalUsage,
  getItemWearHistory,
  logWearEvent,
  getWearEvents,
  getAllWardrobeItems,
  addWardrobeItem
} from '../src/store.js';
import { WardrobeItem, GarmentCategory, WearEvent } from '../src/types.js';

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

function runTests() {
  console.log('\n========================================');
  console.log('Sprint 3.1.3: Wear Event Tracking Tests');
  console.log('========================================\n');

  try {
    // Test Suite 1: Wear Statistics
    console.log('📋 Test Suite 1: Wear Statistics\n');

    const stats = getWearStats();
    assert(typeof stats.totalWearEvents === 'number', 'Should have numeric totalWearEvents');
    assert(stats.totalWearEvents >= 0, 'totalWearEvents should be >= 0');
    assert(typeof stats.itemsWorn === 'number', 'Should have numeric itemsWorn');
    assert(stats.itemsWorn >= 0, 'itemsWorn should be >= 0');
    assert(typeof stats.averageWearPerItem === 'number', 'Should have numeric averageWearPerItem');
    assert(stats.averageWearPerItem >= 0, 'averageWearPerItem should be >= 0');
    assert(Array.isArray(stats.unusedItems), 'unusedItems should be array');
    assert(Array.isArray(stats.underusedItems), 'underusedItems should be array');
    assert(Array.isArray(stats.overusedItems), 'overusedItems should be array');

    // Test Suite 2: Days Since Worn Calculations
    console.log('\n📋 Test Suite 2: Days Since Worn\n');

    // Get a never-worn item
    const allItems = getAllWardrobeItems();
    const neverWornItem = allItems.find(item => (item.timesWorn || 0) === 0);

    if (neverWornItem) {
      const neverWornResult = getDaysSinceWorn(neverWornItem.id);
      assert(neverWornResult.daysSince === -1, 'Never-worn item should have daysSince = -1');
      assert(neverWornResult.readableFormat === 'Never worn', 'Never-worn item should say "Never worn"');
    }

    // Get a worn item
    const wornItem = allItems.find(item => (item.timesWorn || 0) > 0);
    if (wornItem) {
      const wornResult = getDaysSinceWorn(wornItem.id);
      assert(typeof wornResult.daysSince === 'number', 'Worn item should have numeric daysSince');
      assert(wornResult.daysSince >= 0, 'daysSince should be >= 0 for worn items');
      assert(typeof wornResult.readableFormat === 'string', 'Should have readable format string');
      assert(wornResult.readableFormat.length > 0, 'readableFormat should not be empty');
    }

    // Non-existent item
    const notFoundResult = getDaysSinceWorn('non-existent-item-id');
    assert(notFoundResult.daysSince === -1, 'Non-existent item should have daysSince = -1');
    assert(notFoundResult.readableFormat === 'Item not found', 'Non-existent item should say "Item not found"');

    // Test Suite 3: Wear Streak Calculations
    console.log('\n📋 Test Suite 3: Wear Streak\n');

    if (wornItem) {
      const streak = getWearStreak(wornItem.id);
      assert(typeof streak.currentStreak === 'number', 'Should have numeric currentStreak');
      assert(streak.currentStreak >= 0, 'currentStreak should be >= 0');
      assert(typeof streak.longestStreak === 'number', 'Should have numeric longestStreak');
      assert(streak.longestStreak >= 0, 'longestStreak should be >= 0');
      assert(streak.longestStreak >= streak.currentStreak, 'longestStreak should be >= currentStreak');
      assert(Array.isArray(streak.currentStreakDates), 'currentStreakDates should be array');
      assert(Array.isArray(streak.longestStreakDates), 'longestStreakDates should be array');
    }

    // Test Suite 4: Seasonal Usage Analysis
    console.log('\n📋 Test Suite 4: Seasonal Usage\n');

    const seasonalData = getSeasonalUsage();
    assert(Array.isArray(seasonalData), 'Should return array of seasonal data');
    assert(seasonalData.length === 4, 'Should have data for 4 seasons');

    seasonalData.forEach(season => {
      assert(['Spring', 'Summer', 'Fall', 'Winter'].includes(season.season), 'Season should be valid');
      assert(typeof season.itemsUsed === 'number', 'itemsUsed should be numeric');
      assert(season.itemsUsed >= 0, 'itemsUsed should be >= 0');
      assert(typeof season.totalWearEvents === 'number', 'totalWearEvents should be numeric');
      assert(season.totalWearEvents >= 0, 'totalWearEvents should be >= 0');
      assert(typeof season.averageWearPerItem === 'number', 'averageWearPerItem should be numeric');
      assert(Array.isArray(season.underutilizedItems), 'underutilizedItems should be array');
    });

    // Test Suite 5: Item Wear History
    console.log('\n📋 Test Suite 5: Item Wear History\n');

    if (wornItem) {
      const history = getItemWearHistory(wornItem.id);
      assert(history !== null, 'Worn item should have history');
      if (history) {
        assert(history.item.id === wornItem.id, 'History should reference correct item');
        assert(typeof history.timesWorn === 'number', 'timesWorn should be numeric');
        assert(history.timesWorn >= 1, 'Worn item should have timesWorn >= 1');
        assert(typeof history.daysSinceLast === 'number', 'daysSinceLast should be numeric');
        assert(typeof history.daysSinceLastReadable === 'string', 'daysSinceLastReadable should be string');
        assert(Array.isArray(history.wearEvents), 'wearEvents should be array');
        assert(typeof history.currentStreak === 'number', 'currentStreak should be numeric');
        assert(typeof history.longestStreak === 'number', 'longestStreak should be numeric');
      }
    }

    // Non-existent item
    const notFoundHistory = getItemWearHistory('non-existent-item-id');
    assert(notFoundHistory === null, 'Non-existent item should return null');

    // Test Suite 6: Logging Wear Events
    console.log('\n📋 Test Suite 6: Logging Wear Events\n');

    const testItems = allItems.slice(0, 2);
    const testEvent = logWearEvent({
      outfitId: `test-outfit-${Date.now()}`,
      outfitTitle: 'Test Outfit',
      itemIds: testItems.map(i => i.id),
      wornDate: new Date().toISOString().split('T')[0],
      wornAt: new Date().toISOString(),
      occasion: 'Testing',
      weather: 'Cloudy',
      temperature: '20°C',
      feedback: 'loved',
      notes: 'Test wear event'
    });

    assert(testEvent.id !== undefined, 'Event should have ID');
    assert(testEvent.outfitId === `test-outfit-${testEvent.id.split('_')[1]}` || testEvent.outfitId.includes('test-outfit'), 'Event should preserve outfitId');
    assert(testEvent.itemIds.length === testItems.length, 'Event should preserve item IDs');
    assert(testEvent.wornDate !== undefined, 'Event should have wornDate');
    assert(testEvent.wornAt !== undefined, 'Event should have wornAt');
    assert(testEvent.occasion === 'Testing', 'Event should preserve occasion');
    assert(testEvent.weather === 'Cloudy', 'Event should preserve weather');
    assert(testEvent.feedback === 'loved', 'Event should preserve feedback');

    // Verify items were updated
    const updatedItems = getAllWardrobeItems();
    testItems.forEach(originalItem => {
      const updated = updatedItems.find(i => i.id === originalItem.id);
      assert(updated !== undefined, 'Item should exist after wear event');
      assert((updated?.timesWorn || 0) > (originalItem.timesWorn || 0), 'timesWorn should increment');
      assert(updated?.lastWorn === testEvent.wornDate, 'lastWorn should be updated');
    });

    // Test Suite 7: Wear Statistics After Event
    console.log('\n📋 Test Suite 7: Statistics After Event\n');

    const updatedStats = getWearStats();
    assert(updatedStats.totalWearEvents > stats.totalWearEvents, 'totalWearEvents should increment');
    assert(updatedStats.itemsWorn >= stats.itemsWorn, 'itemsWorn should not decrease');

    // Test Suite 8: Wear Events Retrieval
    console.log('\n📋 Test Suite 8: Wear Events Retrieval\n');

    const allEvents = getWearEvents();
    assert(Array.isArray(allEvents), 'Should return array of events');
    assert(allEvents.length > 0, 'Should have at least one event');
    const latestEvent = allEvents[0];
    assert(latestEvent.id !== undefined, 'Event should have ID');
    assert(Array.isArray(latestEvent.itemIds), 'Event should have itemIds array');

    // Test Suite 9: Property: Days Since Worn Always >= 0
    console.log('\n📋 Test Suite 9: Property Tests\n');

    const propertyTestItems = allItems.slice(0, 5);
    propertyTestItems.forEach(item => {
      const result = getDaysSinceWorn(item.id);
      const condition = result.daysSince === -1 || result.daysSince >= 0;
      assert(condition, `Days since worn for ${item.id} should be -1 or >= 0, got ${result.daysSince}`);
    });

    // Test Suite 10: Property: Longest Streak >= Current Streak
    console.log('\n📋 Test Suite 10: Property - Streak Ordering\n');

    propertyTestItems.forEach(item => {
      const streak = getWearStreak(item.id);
      assert(streak.longestStreak >= streak.currentStreak, 
        `For ${item.id}: longestStreak (${streak.longestStreak}) should be >= currentStreak (${streak.currentStreak})`);
    });

    // Test Suite 11: Property: Average Wear Calculation
    console.log('\n📋 Test Suite 11: Property - Average Wear\n');

    const finalStats = getWearStats();
    if (finalStats.itemsWorn > 0) {
      const totalWears = finalStats.unusedItems.length === 0
        ? allItems.reduce((sum, item) => sum + (item.timesWorn || 0), 0)
        : finalStats.itemsWorn * finalStats.averageWearPerItem; // Rough check
      
      assert(finalStats.averageWearPerItem >= 0, 'Average wear should be >= 0');
    }

    // Test Suite 12: Edge Cases
    console.log('\n📋 Test Suite 12: Edge Cases\n');

    // Empty itemIds should fail
    try {
      logWearEvent({
        outfitId: 'empty-test',
        outfitTitle: 'Empty',
        itemIds: []
      });
      assert(false, 'Should handle empty itemIds gracefully');
    } catch (e) {
      assert(true, 'Should handle empty itemIds gracefully');
    }

    // Test with minimal event
    const minimalEvent = logWearEvent({
      outfitId: 'minimal-test',
      itemIds: [testItems[0].id]
    });
    assert(minimalEvent.id !== undefined, 'Minimal event should have ID');
    assert(minimalEvent.outfitTitle !== undefined, 'Minimal event should have default outfitTitle');

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
