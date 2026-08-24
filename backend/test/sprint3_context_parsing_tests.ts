/**
 * Sprint 3.2.1 Context Parsing Tests
 * 
 * Tests for context parsing functions:
 * - parseTemperatureFromRequest
 * - parseWeatherFromRequest
 * - parseOccasionFromRequest
 * - parseMoodFromRequest
 * - parseTimeOfDayFromRequest
 * - parseLocationFromRequest
 * - parseFormality
 * - normalizeRequest
 * - validateContext
 * - parseCompleteContext
 */

import {
  normalizeRequest,
  parseTemperatureFromRequest,
  parseWeatherFromRequest,
  parseOccasionFromRequest,
  parseMoodFromRequest,
  parseTimeOfDayFromRequest,
  parseLocationFromRequest,
  parseFormality,
  validateContext,
  parseCompleteContext
} from '../src/contextParser.js';
import { ContextInput } from '../src/types.js';

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`❌ FAIL: ${message}`);
    console.error(`  Expected: ${JSON.stringify(expected)}`);
    console.error(`  Actual: ${JSON.stringify(actual)}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// ============================================================================
// Test Suite: normalizeRequest
// ============================================================================
console.log('\n=== normalizeRequest Tests ===');

assertEquals(normalizeRequest('Hello, World!'), 'hello world', 'Should remove punctuation');
assertEquals(normalizeRequest('  Hello  '), 'hello', 'Should trim whitespace');
assertEquals(normalizeRequest('My BIRTHDAY is coming'), 'my birthday is coming', 'Should expand abbreviations - bday');
assertEquals(normalizeRequest('Let\'s go to the gym'), 'let\'s go to the gym workout', 'Should expand gym abbreviation');
assertEquals(normalizeRequest(''), '', 'Should handle empty string');

// ============================================================================
// Test Suite: parseTemperatureFromRequest
// ============================================================================
console.log('\n=== parseTemperatureFromRequest Tests ===');

assertEquals(parseTemperatureFromRequest('It\'s 18 degrees'), '18°C', 'Should parse explicit temperature');
assertEquals(parseTemperatureFromRequest('It\'s 25°C'), '25°C', 'Should parse temperature with degree symbol');
assertEquals(parseTemperatureFromRequest('It\'s cold'), '-5°C', 'Should map "cold" to -5°C');
assertEquals(parseTemperatureFromRequest('It\'s warm'), '22°C', 'Should map "warm" to 22°C');
assertEquals(parseTemperatureFromRequest('It\'s hot'), '28°C', 'Should map "hot" to 28°C');
assertEquals(parseTemperatureFromRequest('It\'s freezing'), '-10°C', 'Should map "freezing" to -10°C');
assertEquals(parseTemperatureFromRequest('It\'s 32 celsius'), '32°C', 'Should parse "celsius" keyword');
assertEquals(parseTemperatureFromRequest('No temperature info'), '18°C', 'Should default to 18°C');

// ============================================================================
// Test Suite: parseWeatherFromRequest
// ============================================================================
console.log('\n=== parseWeatherFromRequest Tests ===');

assertEquals(parseWeatherFromRequest('It\'s sunny'), 'Sunny', 'Should parse "sunny"');
assertEquals(parseWeatherFromRequest('The sun is bright'), 'Sunny', 'Should parse "bright"');
assertEquals(parseWeatherFromRequest('It\'s rainy'), 'Rain', 'Should parse "rainy"');
assertEquals(parseWeatherFromRequest('It\'s raining'), 'Rain', 'Should parse "raining"');
assertEquals(parseWeatherFromRequest('It\'s snowing'), 'Snow', 'Should parse "snowing"');
assertEquals(parseWeatherFromRequest('It\'s windy'), 'Windy', 'Should parse "windy"');
assertEquals(parseWeatherFromRequest('It\'s cloudy'), 'Cloudy', 'Should parse "cloudy"');
assertEquals(parseWeatherFromRequest('No weather info'), 'Cloudy', 'Should default to Cloudy');

// ============================================================================
// Test Suite: parseOccasionFromRequest
// ============================================================================
console.log('\n=== parseOccasionFromRequest Tests ===');

assertEquals(parseOccasionFromRequest('I have a work pitch'), 'Work Pitch', 'Should parse "work pitch"');
assertEquals(parseOccasionFromRequest('I have a presentation at work'), 'Work Pitch', 'Should parse "presentation"');
assertEquals(parseOccasionFromRequest('Meeting with my team'), 'Work Pitch', 'Should parse "meeting"');
assertEquals(parseOccasionFromRequest('Coffee with friends'), 'Casual Coffee', 'Should parse "coffee"');
assertEquals(parseOccasionFromRequest('Casual hangout'), 'Casual Coffee', 'Should parse "casual"');
assertEquals(parseOccasionFromRequest('Dinner date'), 'Evening Dinner', 'Should parse "date"');
assertEquals(parseOccasionFromRequest('Going out for dinner'), 'Evening Dinner', 'Should parse "dinner"');
assertEquals(parseOccasionFromRequest('Packing for a trip'), 'Weekend Travel', 'Should parse "packing"');
assertEquals(parseOccasionFromRequest('Weekend getaway'), 'Weekend Travel', 'Should parse "getaway"');
assertEquals(parseOccasionFromRequest('Going to the gym'), 'Gym & Active', 'Should parse "gym"');
assertEquals(parseOccasionFromRequest('Yoga session'), 'Gym & Active', 'Should parse "yoga"');
assertEquals(parseOccasionFromRequest('No occasion mentioned'), 'Casual Coffee', 'Should default to Casual Coffee');

// ============================================================================
// Test Suite: parseMoodFromRequest
// ============================================================================
console.log('\n=== parseMoodFromRequest Tests ===');

assertEquals(parseMoodFromRequest('I want to feel confident'), 'Confident', 'Should parse "confident"');
assertEquals(parseMoodFromRequest('I feel bold today'), 'Bold', 'Should parse "bold"');
assertEquals(parseMoodFromRequest('I want a relaxed vibe'), 'Relaxed', 'Should parse "relaxed"');
assertEquals(parseMoodFromRequest('Keep it understated'), 'Understated', 'Should parse "understated"');
assertEquals(parseMoodFromRequest('I want to be creative'), 'Creative', 'Should parse "creative"');
assertEquals(parseMoodFromRequest('Just feel playful'), 'Creative', 'Should parse "playful" as creative');
assertEquals(parseMoodFromRequest('No mood mentioned'), 'Relaxed', 'Should default to Relaxed');

// ============================================================================
// Test Suite: parseTimeOfDayFromRequest
// ============================================================================
console.log('\n=== parseTimeOfDayFromRequest Tests ===');

assertEquals(parseTimeOfDayFromRequest('Morning meeting'), 'Morning', 'Should parse "morning"');
assertEquals(parseTimeOfDayFromRequest('Breakfast at 8am'), 'Morning', 'Should parse "am"');
assertEquals(parseTimeOfDayFromRequest('Afternoon coffee'), 'Afternoon', 'Should parse "afternoon"');
assertEquals(parseTimeOfDayFromRequest('Lunch date'), 'Afternoon', 'Should parse "lunch"');
assertEquals(parseTimeOfDayFromRequest('Evening dinner'), 'Evening', 'Should parse "evening"');
assertEquals(parseTimeOfDayFromRequest('Night out'), 'Evening', 'Should parse "night"');
assertEquals(parseTimeOfDayFromRequest('No time mentioned'), undefined, 'Should return undefined when no time');

// ============================================================================
// Test Suite: parseLocationFromRequest
// ============================================================================
console.log('\n=== parseLocationFromRequest Tests ===');

assertEquals(parseLocationFromRequest('I\'m in New York'), 'New York', 'Should parse "in [City]"');
assertEquals(parseLocationFromRequest('I\'m in Johannesburg, South Africa'), 'Johannesburg', 'Should parse location with country');
assertEquals(parseLocationFromRequest('New York weather'), 'New York', 'Should parse "[City] weather"');
assertEquals(parseLocationFromRequest('Johannesburg weather'), 'Johannesburg', 'Should parse single word city');
assertEquals(parseLocationFromRequest('No location info'), 'Current Location', 'Should default to Current Location');

// ============================================================================
// Test Suite: parseFormality
// ============================================================================
console.log('\n=== parseFormality Tests ===');

assertEquals(parseFormality('Work Pitch', 'Confident'), 9, 'Work + Confident should be 9');
assertEquals(parseFormality('Work Pitch', 'Relaxed'), 7, 'Work + Relaxed should be 7');
assertEquals(parseFormality('Casual Coffee', 'Relaxed'), 1, 'Casual + Relaxed should be 1');
assertEquals(parseFormality('Evening Dinner', 'Bold'), 9, 'Dinner + Bold should be 9');
assertEquals(parseFormality('Weekend Travel', 'Relaxed'), 3, 'Travel + Relaxed should be 3');
assertEquals(parseFormality('Gym & Active', 'Confident'), 2, 'Gym + Confident should be 2');
assert(parseFormality('Unknown', 'Bold') >= 1 && parseFormality('Unknown', 'Bold') <= 10, 'Formality should always be 1-10');

// ============================================================================
// Test Suite: validateContext
// ============================================================================
console.log('\n=== validateContext Tests ===');

const validContext: ContextInput = {
  temperature: '18°C',
  weather: 'Sunny',
  occasion: 'Work Pitch',
  mood: 'Confident',
  location: 'Johannesburg',
  formalityPreference: 7
};

let validation = validateContext(validContext);
assertEquals(validation.valid, true, 'Valid context should pass validation');
assertEquals(validation.errors.length, 0, 'Valid context should have no errors');

const invalidTemp: ContextInput = {
  temperature: 'invalid',
  weather: 'Sunny',
  occasion: 'Work Pitch',
  mood: 'Confident',
  location: 'Johannesburg',
  formalityPreference: 7
};

validation = validateContext(invalidTemp);
assertEquals(validation.valid, false, 'Invalid temperature should fail validation');
assert(validation.errors.length > 0, 'Should have error for invalid temperature');

const invalidWeather: ContextInput = {
  temperature: '18°C',
  weather: 'Stormy' as any,
  occasion: 'Work Pitch',
  mood: 'Confident',
  location: 'Johannesburg',
  formalityPreference: 7
};

validation = validateContext(invalidWeather);
assertEquals(validation.valid, false, 'Invalid weather should fail validation');

const invalidFormality: ContextInput = {
  temperature: '18°C',
  weather: 'Sunny',
  occasion: 'Work Pitch',
  mood: 'Confident',
  location: 'Johannesburg',
  formalityPreference: 11
};

validation = validateContext(invalidFormality);
assertEquals(validation.valid, false, 'Formality > 10 should fail validation');

// ============================================================================
// Test Suite: parseCompleteContext
// ============================================================================
console.log('\n=== parseCompleteContext Tests ===');

let context = parseCompleteContext('I have a work pitch tomorrow, it\'s going to be cold and rainy. I want to feel confident.');
assertEquals(context.occasion, 'Work Pitch', 'Should parse Work Pitch');
assertEquals(context.weather, 'Rain', 'Should parse Rain');
assertEquals(context.temperature, '-5°C', 'Should parse cold as -5°C');
assertEquals(context.mood, 'Confident', 'Should parse Confident');
assert(context.formalityPreference >= 8, 'Work + Confident should have formality >= 8');

context = parseCompleteContext('Casual coffee with friends this afternoon');
assertEquals(context.occasion, 'Casual Coffee', 'Should parse Casual Coffee');
assertEquals(context.timeOfDay, 'Afternoon', 'Should parse Afternoon');

context = parseCompleteContext('Gym workout in New York, it\'s sunny and warm');
assertEquals(context.occasion, 'Gym & Active', 'Should parse Gym & Active');
assertEquals(context.location, 'New York', 'Should parse New York');
assertEquals(context.weather, 'Sunny', 'Should parse Sunny');

// Test with systemContext override
const systemContext: Partial<ContextInput> = {
  temperature: '25°C',
  location: 'London'
};
context = parseCompleteContext('Rainy day', systemContext);
assertEquals(context.temperature, '25°C', 'System context should override temperature');
assertEquals(context.location, 'London', 'System context should override location');
assertEquals(context.weather, 'Rain', 'Request parsing should still work for non-overridden fields');

// Test context validation in parseCompleteContext
try {
  parseCompleteContext('', { temperature: 'invalid' });
  console.error('❌ FAIL: Should throw error for invalid context');
  process.exit(1);
} catch (err) {
  console.log('✅ PASS: Should throw error for invalid context');
}

// ============================================================================
// Test Suite: Multi-dimensional requests
// ============================================================================
console.log('\n=== Multi-dimensional Request Tests ===');

context = parseCompleteContext(
  'Evening dinner in Paris, warm 22 degrees, I want to feel bold and creative'
);
assertEquals(context.occasion, 'Evening Dinner', 'Multi-context: Should parse occasion');
assertEquals(context.location, 'Paris', 'Multi-context: Should parse location');
assertEquals(context.temperature, '22°C', 'Multi-context: Should parse temperature');
assertEquals(context.mood, 'Bold', 'Multi-context: Should parse mood (first match)');
assert(context.formalityPreference >= 8, 'Multi-context: Should have high formality');

context = parseCompleteContext(
  'Morning workout, cold, sunny, in Denver, feeling relaxed'
);
assertEquals(context.timeOfDay, 'Morning', 'Multi-context: Should parse time of day');
assertEquals(context.occasion, 'Gym & Active', 'Multi-context: Should parse gym occasion');
assertEquals(context.temperature, '-5°C', 'Multi-context: Should parse cold temperature');
assertEquals(context.weather, 'Sunny', 'Multi-context: Should parse sunny weather');
assertEquals(context.location, 'Denver', 'Multi-context: Should parse location');
assertEquals(context.mood, 'Relaxed', 'Multi-context: Should parse mood');

// ============================================================================
// Summary
// ============================================================================
console.log('\n=== All Tests Passed! ===\n');
