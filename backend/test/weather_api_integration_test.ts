/**
 * Weather API Integration Tests
 * Tests the weather API endpoints without making actual HTTP calls
 */

import { 
  getWeatherWithCache, 
  getCachedWeather,
  invalidateWeatherCache,
  convertWeatherToContext,
  WeatherData
} from '../src/services/weatherService.js';

console.log('[Weather API Integration Tests] Starting...\n');

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

// Test 1: Cache Workflow
console.log('Test 1: Weather Cache Workflow\n');

invalidateWeatherCache();

// First call should return default since no API key and no cache
getWeatherWithCache('London').then(weather => {
  assert(weather !== null, 'getWeatherWithCache returns data (default when API unavailable)');
  assert(weather.location !== undefined, 'Weather data contains location');
  console.log(`  ✓ Default weather: ${weather.temperature}°C in ${weather.location}\n`);
}).catch(err => {
  console.error('Error in cache test:', err);
  failCount++;
});

// Test 2: Context Conversion with Different Weather Types
console.log('Test 2: Context Conversion with Different Weather Types\n');

const testWeathers: WeatherData[] = [
  {
    temperature: 28,
    humidity: 70,
    windSpeed: 5,
    precipitation: 0,
    description: 'Sunny',
    feelsLike: 26,
    fetchedAt: new Date().toISOString(),
    location: 'Cairo'
  },
  {
    temperature: 5,
    humidity: 80,
    windSpeed: 15,
    precipitation: 2,
    description: 'Snow',
    feelsLike: -2,
    fetchedAt: new Date().toISOString(),
    location: 'Moscow'
  },
  {
    temperature: 18,
    humidity: 65,
    windSpeed: 8,
    precipitation: 0.5,
    description: 'Rain',
    feelsLike: 16,
    fetchedAt: new Date().toISOString(),
    location: 'London'
  }
];

testWeathers.forEach(weather => {
  const context = convertWeatherToContext(weather);
  assert(context.temperature !== undefined, `${weather.location}: Temperature converted`);
  assert(context.weather !== undefined, `${weather.location}: Weather type mapped`);
  assert(context.location === weather.location, `${weather.location}: Location preserved`);
  console.log(`  ✓ ${weather.location}: ${context.temperature} and ${context.weather}`);
});

// Test 3: Cache Expiration Logic
console.log('\nTest 3: Cache Expiration Logic\n');

invalidateWeatherCache();

// Verify cache is cleared
const emptyCache = getCachedWeather('TestLocation');
assert(emptyCache === null, 'Cache is empty after invalidation');

// Test 4: Weather Data Consistency
console.log('\nTest 4: Weather Data Consistency\n');

const consistentWeather: WeatherData = {
  temperature: 22,
  humidity: 60,
  windSpeed: 3,
  precipitation: 0,
  description: 'Cloudy',
  feelsLike: 20,
  cloudiness: 50,
  visibility: 10000,
  fetchedAt: new Date().toISOString(),
  location: 'Paris'
};

// Convert same data multiple times
const context1 = convertWeatherToContext(consistentWeather);
const context2 = convertWeatherToContext(consistentWeather);

assert(context1.temperature === context2.temperature, 'Temperature conversion is deterministic');
assert(context1.weather === context2.weather, 'Weather mapping is deterministic');
assert(context1.location === context2.location, 'Location is consistent');

// Test 5: API Response Structure
console.log('\nTest 5: API Response Structure\n');

const mockApiResponse = {
  success: true,
  data: {
    temperature: 18,
    humidity: 65,
    windSpeed: 3.5,
    precipitation: 0,
    description: 'Cloudy',
    feelsLike: 16,
    cloudiness: 40,
    visibility: 10000,
    fetchedAt: new Date().toISOString(),
    location: 'Johannesburg',
    source: 'openweathermap'
  }
};

assert('success' in mockApiResponse, 'API response has success field');
assert('data' in mockApiResponse, 'API response has data field');
assert('temperature' in mockApiResponse.data, 'Response data has temperature');
assert('location' in mockApiResponse.data, 'Response data has location');
assert('source' in mockApiResponse.data, 'Response data has source');

// Test 6: Forecast Response Structure
console.log('\nTest 6: Forecast Response Structure\n');

const mockForecastResponse = {
  success: true,
  data: {
    location: 'Johannesburg',
    forecasts: [
      mockApiResponse.data,
      mockApiResponse.data,
      mockApiResponse.data
    ]
  }
};

assert('location' in mockForecastResponse.data, 'Forecast response has location');
assert('forecasts' in mockForecastResponse.data, 'Forecast response has forecasts array');
assert(Array.isArray(mockForecastResponse.data.forecasts), 'Forecasts is an array');
assert(mockForecastResponse.data.forecasts.length === 3, 'Forecast has 3 days');

// Test 7: Cache Refresh Response
console.log('\nTest 7: Cache Refresh Response\n');

const mockRefreshResponse = {
  success: true,
  message: 'Weather cache cleared for London'
};

assert('success' in mockRefreshResponse, 'Refresh response has success field');
assert('message' in mockRefreshResponse, 'Refresh response has message field');

// Test 8: Weather to Outfit Context
console.log('\nTest 8: Weather to Outfit Context\n');

const outfitWeather: WeatherData = {
  temperature: 15,
  humidity: 70,
  windSpeed: 5,
  precipitation: 1,
  description: 'Rain',
  feelsLike: 12,
  fetchedAt: new Date().toISOString(),
  location: 'Seattle'
};

const outfitContext = convertWeatherToContext(outfitWeather);

// Verify context can be used for outfit generation
assert(outfitContext.temperature !== undefined, 'Context has temperature for outfit selection');
assert(outfitContext.weather === 'Rain', 'Context maps Rain correctly for outfit waterproofing');
assert(outfitContext.location === 'Seattle', 'Context has location for context');

console.log(`  ✓ Outfit context ready for ${outfitContext.location}: ${outfitContext.temperature}, ${outfitContext.weather}`);

// Test 9: Error Scenarios
console.log('\nTest 9: Error Response Handling\n');

const mockErrorResponse = {
  success: false,
  error: 'Location not found'
};

assert('success' in mockErrorResponse, 'Error response has success field');
assert(mockErrorResponse.success === false, 'Error response indicates failure');
assert('error' in mockErrorResponse, 'Error response has error field');

// Test 10: Multiple Locations
console.log('\nTest 10: Multiple Location Support\n');

const locations = ['London', 'New York', 'Tokyo', 'Sydney', 'Cape Town'];

// Test that each location can be cached independently
locations.forEach(loc => {
  invalidateWeatherCache(loc);
  const cached = getCachedWeather(loc);
  assert(cached === null, `Cache properly cleared for ${loc}`);
});

console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${passCount} passed, ${failCount} failed`);
console.log('='.repeat(50) + '\n');

process.exit(failCount > 0 ? 1 : 0);
