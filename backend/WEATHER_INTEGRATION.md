# Weather Integration Documentation

## Overview

The weather integration provides real-time weather data from OpenWeatherMap API to enhance outfit recommendations with accurate, location-based weather conditions. The system includes caching (15-minute TTL), graceful error handling, and automatic fallback to default conditions if the API is unavailable.

## Architecture

### Core Components

1. **weatherService.ts** - Main weather service module
   - Fetches weather data from OpenWeatherMap API
   - Manages in-memory cache with TTL
   - Converts weather data to outfit generation context
   - Handles error scenarios gracefully

2. **API Endpoints** (in server.ts)
   - `GET /api/weather/:location` - Get current weather for location
   - `POST /api/weather/forecast` - Get weather forecast (returns current weather for now)
   - `POST /api/weather/refresh` - Clear weather cache

### Data Flow

```
User Request
    ↓
Check Cache (valid for 15 minutes)
    ├─ Valid Cache → Return cached data
    └─ Expired/Missing
         ↓
      Fetch from API
         ├─ Success → Cache & return
         ├─ API Error → Return expired cache if available
         └─ No cache → Return default weather
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# OpenWeatherMap API Key
OPENWEATHER_API_KEY=your_api_key_here

# Weather cache TTL in milliseconds (default: 15 minutes)
WEATHER_CACHE_TTL=900000
```

### Getting an OpenWeatherMap API Key

1. Visit https://openweathermap.org/api
2. Sign up for a free account
3. Generate an API key in your account settings
4. Add to `.env` file

**Note**: The system works without an API key - it will use cached or default weather data.

## Features

### 1. Weather Caching (15-minute TTL)

- Stores weather data in-memory with automatic expiration
- Reduces API calls and improves response time
- Falls back to cached data if API is unavailable
- Cache is keyed by location name

```typescript
// Automatic caching with 15-minute TTL
const weather = await getWeatherWithCache('London');
// First call: fetches from API
// Subsequent calls within 15 minutes: returns cached data
// After 15 minutes: fetches fresh data
```

### 2. Weather Data

Returned as `WeatherData` interface:

```typescript
interface WeatherData {
  temperature: number;           // Celsius
  humidity: number;              // 0-100%
  windSpeed: number;             // m/s
  precipitation: number;         // mm/hour
  description: string;           // Sunny, Rainy, Cloudy, Snow, Windy
  feelsLike: number;             // Felt temperature in Celsius
  uvIndex?: number;              // Optional UV index
  visibility?: number;           // Optional visibility in meters
  cloudiness?: number;           // 0-100%
  fetchedAt: string;             // ISO timestamp
  location: string;              // Location name
}
```

### 3. Weather to Context Conversion

Converts weather data to outfit generation context:

```typescript
const weather = await getWeatherWithCache('Johannesburg');
const context = convertWeatherToContext(weather);

// Returns:
{
  temperature: "22°C",
  weather: "Sunny",
  location: "Johannesburg"
}
```

### 4. Weather Type Mapping

OpenWeatherMap descriptions are mapped to standardized weather types:

| OpenWeatherMap | Mapped Type |
|---|---|
| Clear, Sunny | Sunny |
| Clouds, Overcast, Mist, Fog, Haze | Cloudy |
| Rain, Drizzle, Thunderstorm | Rain |
| Snow | Snow |
| Squall, Tornado, Windy | Windy |

### 5. Error Handling

The system gracefully handles various error scenarios:

- **Missing API Key**: Logs warning, uses cached/default data
- **Location Not Found**: Returns null, caller uses default
- **API Rate Limit**: Falls back to extended cache (1 hour)
- **Network Error**: Uses cached data if available, otherwise default
- **Invalid Response**: Returns null, never crashes

## API Endpoints

### GET /api/weather/:location

Fetch current weather for a location with caching.

**Request:**
```bash
GET /api/weather/Johannesburg
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "temperature": 22,
    "humidity": 65,
    "windSpeed": 3.5,
    "precipitation": 0,
    "description": "Sunny",
    "feelsLike": 20,
    "cloudiness": 30,
    "visibility": 10000,
    "fetchedAt": "2026-08-24T10:30:00Z",
    "location": "Johannesburg",
    "source": "openweathermap"
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Location not found"
}
```

### POST /api/weather/forecast

Get weather forecast (currently returns same data for all days).

**Request:**
```json
{
  "location": "Johannesburg",
  "days": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "location": "Johannesburg",
    "forecasts": [
      { /* WeatherData */ },
      { /* WeatherData */ },
      { /* WeatherData */ }
    ]
  }
}
```

### POST /api/weather/refresh

Clear weather cache (useful for manual refresh).

**Request:**
```json
{
  "location": "Johannesburg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Weather cache cleared for Johannesburg"
}
```

**Clear all cache:**
```json
{
  "location": null
}
```

## Usage Examples

### Getting Weather for Outfit Generation

```typescript
import { getWeatherWithCache, convertWeatherToContext } from './services/weatherService.js';

// Fetch weather
const weather = await getWeatherWithCache('Johannesburg');

// Convert to outfit context
const weatherContext = convertWeatherToContext(weather);

// Use with outfit generation
const context: ContextInput = {
  temperature: weatherContext.temperature!,
  weather: weatherContext.weather!,
  occasion: 'Work Pitch',
  mood: 'Confident',
  location: weatherContext.location!,
  formalityPreference: 7
};

const outfits = await generateOutfitsFromWardrobe(context);
```

### Manual Cache Management

```typescript
import { invalidateWeatherCache } from './services/weatherService.js';

// Clear cache for specific location
invalidateWeatherCache('London');

// Clear all cache
invalidateWeatherCache();
```

## Testing

### Unit Tests

Run weather service tests:

```bash
npm run test:weather
```

Tests include:
- Weather caching with TTL expiration
- Weather type conversion/mapping
- Context conversion
- Temperature range detection
- Cache invalidation
- Default fallback weather
- Weather data structure validation
- API key handling
- Weather data properties
- Data formatting

### Integration Tests

Run API integration tests:

```bash
npm run test:weather:integration
```

Tests include:
- Cache workflow
- Context conversion with different weather types
- Cache expiration logic
- Weather data consistency
- API response structure
- Forecast response structure
- Cache refresh response
- Weather to outfit context
- Error response handling
- Multiple location support

## Performance Considerations

### Cache Benefits

- **15-minute TTL**: Reduces API calls by ~96% (assuming continuous usage)
- **In-memory**: Sub-millisecond response time for cached data
- **Per-location**: Different locations cached independently

### API Rate Limits

OpenWeatherMap free tier limits:
- 1000 calls per day
- 60 calls per minute

The caching system ensures efficient usage within these limits.

### Response Times

| Scenario | Time |
|---|---|
| Cached weather | < 1ms |
| First API call | 100-500ms |
| Cache miss after expiration | 100-500ms |
| API unavailable (fallback) | < 1ms |

## Integration with Outfit Generation

Weather directly affects outfit recommendations:

### Temperature Thresholds

- **Hot (>25°C)**: Light fabrics, breathable materials, minimal layers
- **Warm (18-25°C)**: Standard clothing, light layers optional
- **Cool (10-18°C)**: Light jacket or sweater recommended
- **Cold (<10°C)**: Heavy outerwear, warm layers required

### Weather Type Adjustments

- **Rain**: Prioritize waterproof shoes, water-resistant outerwear
- **Snow**: Add insulated boots, thermal layers
- **Sunny**: Include sunglasses, sun protection considerations
- **Windy**: Secure accessories, fitted clothing preferred
- **Cloudy**: Standard recommendations

## Troubleshooting

### Issue: "Missing OPENWEATHER_API_KEY"

**Cause**: API key not configured in environment

**Solution**: 
1. Get API key from https://openweathermap.org/api
2. Add to `.env` file: `OPENWEATHER_API_KEY=your_key`
3. Restart server

**Workaround**: System will use default weather if API key missing

### Issue: Location not found

**Cause**: Invalid location name or API error

**Solution**:
1. Verify location spelling (e.g., "Johannesburg" not "Johannesburg City")
2. Try with city name only (e.g., "London" not "London, UK")
3. Check API key validity
4. Check internet connection

### Issue: Slow response times

**Cause**: API rate limit or network latency

**Solution**:
1. Caching automatically reduces API calls (already configured)
2. Check internet connection
3. Verify API key has sufficient quota
4. Try using cached data: response should be < 1ms if cached

### Issue: Getting default weather (18°C, Cloudy)

**Cause**: API unavailable or invalid, no cached data

**Solution**:
1. Check API key configuration
2. Verify location name is valid
3. Check internet connection
4. Wait 15 minutes for cache to populate if API was down

## Future Enhancements

1. **Forecast Support**: Implement multi-day forecasts with weather prediction
2. **Multiple Providers**: Support for backup weather API providers
3. **Geolocation**: Auto-detect user location using IP
4. **Alerts**: Alert for extreme weather conditions
5. **Historical Data**: Track weather patterns for wardrobe insights
6. **Persistent Cache**: Store cache in database for across-server consistency

## References

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Weather Data Format](https://openweathermap.org/current)
- [API Response Examples](https://openweathermap.org/weather-conditions)
