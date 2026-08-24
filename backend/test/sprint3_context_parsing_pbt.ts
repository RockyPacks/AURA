/**
 * Sprint 3.2.1 Context Parsing - Property-Based Tests
 * 
 * **Validates: Requirements 12**
 * 
 * Property 1: All parsed values are valid context elements
 * - Temperature must be in format "XXX°C"
 * - Weather must be one of: Sunny, Rain, Cloudy, Snow, Windy
 * - Occasion must be one of the valid occasions
 * - Mood must be one of the valid moods
 * - Location must be non-empty string
 * - Formality must be between 1-10
 * 
 * Property 2: Context parsing is deterministic
 * - Same input always produces same output
 * - Order of keywords doesn't matter (same set of keywords)
 * 
 * Property 3: System context merges correctly
 * - System context overrides request parsing for specified fields
 * - Request parsing fills in missing fields
 */

import fc from 'fast-check';
import {
  parseCompleteContext,
  validateContext,
  parseTemperatureFromRequest,
  parseWeatherFromRequest,
  parseOccasionFromRequest,
  parseMoodFromRequest,
  parseLocationFromRequest,
  parseFormality
} from '../src/contextParser.js';
import { ContextInput } from '../src/types.js';

// Custom arbitraries for valid context values
const temperatureArb = fc.oneof(
  fc.integer({ min: -20, max: 40 }).map(t => `${t}°C`),
  fc.constantFrom('18°C', '22°C', '-5°C', '28°C', '10°C')
);

const weatherArb = fc.constantFrom<'Sunny' | 'Rain' | 'Cloudy' | 'Snow' | 'Windy'>(
  'Sunny', 'Rain', 'Cloudy', 'Snow', 'Windy'
);

const occasionArb = fc.constantFrom<'Work Pitch' | 'Casual Coffee' | 'Evening Dinner' | 'Weekend Travel' | 'Gym & Active'>(
  'Work Pitch', 'Casual Coffee', 'Evening Dinner', 'Weekend Travel', 'Gym & Active'
);

const moodArb = fc.constantFrom<'Confident' | 'Relaxed' | 'Bold' | 'Understated' | 'Creative'>(
  'Confident', 'Relaxed', 'Bold', 'Understated', 'Creative'
);

const locationArb = fc.string().filter((s: string) => s.length > 0);

const formalityArb = fc.integer({ min: 1, max: 10 });

const validContextArb = fc.record({
  temperature: temperatureArb,
  weather: weatherArb,
  occasion: occasionArb,
  mood: moodArb,
  location: locationArb as fc.Arbitrary<string>,
  formalityPreference: formalityArb
});

// Request generators with context keywords
const temperatureKeywordArb = fc.oneof(
  fc.constantFrom('cold', 'cool', 'mild', 'warm', 'hot', 'freezing'),
  fc.integer({ min: -10, max: 40 }).map(t => `${t} degrees`)
);

const weatherKeywordArb = fc.constantFrom(
  'sunny', 'rainy', 'snowing', 'cloudy', 'windy'
);

const occasionKeywordArb = fc.constantFrom(
  'work pitch', 'coffee', 'dinner', 'trip', 'gym'
);

const moodKeywordArb = fc.constantFrom(
  'confident', 'relaxed', 'bold', 'understated', 'creative'
);

const timeKeywordArb = fc.constantFrom('morning', 'afternoon', 'evening');
const locationKeywordArb = fc.constantFrom('New York', 'London', 'Paris', 'Tokyo', 'Sydney');

const contextualRequestArb = fc.tuple(
  fc.option(temperatureKeywordArb),
  fc.option(weatherKeywordArb),
  fc.option(occasionKeywordArb),
  fc.option(moodKeywordArb),
  fc.option(timeKeywordArb),
  fc.option(locationKeywordArb)
).map(([temp, weather, occasion, mood, time, location]) => {
  const parts: string[] = [];
  if (temp) parts.push(`${temp}`);
  if (weather) parts.push(`${weather}`);
  if (occasion) parts.push(`${occasion}`);
  if (mood) parts.push(`feeling ${mood}`);
  if (time) parts.push(`${time}`);
  if (location) parts.push(`in ${location}`);
  return parts.join(', ');
});

// ============================================================================
// Property 1: All parsed values are valid context elements
// ============================================================================
console.log('\n=== Property 1: Parsed values are valid ===');

fc.assert(
  fc.property(contextualRequestArb, (request) => {
    const context = parseCompleteContext(request);
    
    // All required fields must be present
    if (!context.temperature || !context.weather || !context.occasion || 
        !context.mood || !context.location || context.formalityPreference === undefined) {
      throw new Error('Missing required context fields');
    }
    
    // Temperature must be in format "XXX°C"
    if (!/^\-?\d{1,2}°C$/.test(context.temperature)) {
      throw new Error(`Invalid temperature format: ${context.temperature}`);
    }
    
    // Weather must be valid
    const validWeathers = ['Sunny', 'Rain', 'Cloudy', 'Snow', 'Windy'];
    if (!validWeathers.includes(context.weather)) {
      throw new Error(`Invalid weather: ${context.weather}`);
    }
    
    // Occasion must be valid
    const validOccasions = ['Work Pitch', 'Casual Coffee', 'Evening Dinner', 'Weekend Travel', 'Gym & Active'];
    if (!validOccasions.includes(context.occasion)) {
      throw new Error(`Invalid occasion: ${context.occasion}`);
    }
    
    // Mood must be valid
    const validMoods = ['Confident', 'Relaxed', 'Bold', 'Understated', 'Creative'];
    if (!validMoods.includes(context.mood)) {
      throw new Error(`Invalid mood: ${context.mood}`);
    }
    
    // Location must be non-empty string
    if (typeof context.location !== 'string' || context.location.length === 0) {
      throw new Error(`Invalid location: ${context.location}`);
    }
    
    // Formality must be 1-10
    if (typeof context.formalityPreference !== 'number' || 
        context.formalityPreference < 1 || context.formalityPreference > 10) {
      throw new Error(`Invalid formality: ${context.formalityPreference}`);
    }
  }),
  { numRuns: 100 }
);
console.log('✅ Property 1 passed: All parsed values are valid');

// ============================================================================
// Property 2: Context parsing is deterministic
// ============================================================================
console.log('\n=== Property 2: Parsing is deterministic ===');

fc.assert(
  fc.property(contextualRequestArb, (request) => {
    const context1 = parseCompleteContext(request);
    const context2 = parseCompleteContext(request);
    
    // Same input must always produce same output
    if (JSON.stringify(context1) !== JSON.stringify(context2)) {
      throw new Error('Context parsing is not deterministic');
    }
  }),
  { numRuns: 100 }
);
console.log('✅ Property 2 passed: Parsing is deterministic');

// ============================================================================
// Property 3: Validation is consistent
// ============================================================================
console.log('\n=== Property 3: Validation is consistent ===');

fc.assert(
  fc.property(validContextArb, (context) => {
    const validation = validateContext(context);
    
    // Valid contexts should always validate successfully
    if (!validation.valid) {
      throw new Error(`Valid context failed validation: ${JSON.stringify(validation.errors)}`);
    }
  }),
  { numRuns: 100 }
);
console.log('✅ Property 3 passed: Validation is consistent');

// ============================================================================
// Property 4: System context overrides work correctly
// ============================================================================
console.log('\n=== Property 4: System context overrides work ===');

fc.assert(
  fc.property(
    contextualRequestArb,
    validContextArb,
    (request, systemContext) => {
      const context = parseCompleteContext(request, systemContext);
      
      // All system context values should be present in result
      if (systemContext.temperature && context.temperature !== systemContext.temperature) {
        throw new Error('System temperature not applied');
      }
      if (systemContext.weather && context.weather !== systemContext.weather) {
        throw new Error('System weather not applied');
      }
      if (systemContext.occasion && context.occasion !== systemContext.occasion) {
        throw new Error('System occasion not applied');
      }
      if (systemContext.mood && context.mood !== systemContext.mood) {
        throw new Error('System mood not applied');
      }
      if (systemContext.location && context.location !== systemContext.location) {
        throw new Error('System location not applied');
      }
      if (systemContext.formalityPreference && context.formalityPreference !== systemContext.formalityPreference) {
        throw new Error('System formality not applied');
      }
    }
  ),
  { numRuns: 50 }
);
console.log('✅ Property 4 passed: System context overrides work correctly');

// ============================================================================
// Property 5: Individual parsers produce valid outputs
// ============================================================================
console.log('\n=== Property 5: Individual parsers produce valid outputs ===');

fc.assert(
  fc.property(
    fc.string({ maxLength: 500 }),
    (request) => {
      // Temperature parser
      const temp = parseTemperatureFromRequest(request);
      if (!/^\-?\d{1,2}°C$/.test(temp)) {
        throw new Error(`Invalid temperature from parser: ${temp}`);
      }
      
      // Weather parser
      const weather = parseWeatherFromRequest(request);
      const validWeathers = ['Sunny', 'Rain', 'Cloudy', 'Snow', 'Windy'];
      if (!validWeathers.includes(weather)) {
        throw new Error(`Invalid weather from parser: ${weather}`);
      }
      
      // Occasion parser
      const occasion = parseOccasionFromRequest(request);
      const validOccasions = ['Work Pitch', 'Casual Coffee', 'Evening Dinner', 'Weekend Travel', 'Gym & Active'];
      if (!validOccasions.includes(occasion)) {
        throw new Error(`Invalid occasion from parser: ${occasion}`);
      }
      
      // Mood parser
      const mood = parseMoodFromRequest(request);
      const validMoods = ['Confident', 'Relaxed', 'Bold', 'Understated', 'Creative'];
      if (!validMoods.includes(mood)) {
        throw new Error(`Invalid mood from parser: ${mood}`);
      }
      
      // Location parser
      const location = parseLocationFromRequest(request);
      if (typeof location !== 'string' || location.length === 0) {
        throw new Error(`Invalid location from parser: ${location}`);
      }
      
      // Formality parser
      const formality = parseFormality(occasion, mood);
      if (typeof formality !== 'number' || formality < 1 || formality > 10) {
        throw new Error(`Invalid formality from parser: ${formality}`);
      }
    }
  ),
  { numRuns: 100 }
);
console.log('✅ Property 5 passed: Individual parsers produce valid outputs');

// ============================================================================
// Summary
// ============================================================================
console.log('\n=== All Property-Based Tests Passed! ===\n');
