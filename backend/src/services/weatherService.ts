import { ContextInput } from '../types.js';
import { get as httpsGet } from 'https';
import { IncomingMessage } from 'http';

// Weather Data Interfaces
export interface WeatherData {
  temperature: number;           // Celsius
  humidity: number;              // 0-100%
  windSpeed: number;             // m/s
  precipitation: number;         // mm/hour
  description: string;           // "Sunny", "Rainy", etc.
  feelsLike: number;
  uvIndex?: number;
  visibility?: number;
  cloudiness?: number;           // 0-100%
  fetchedAt: string;             // ISO timestamp
  location: string;              // Location name
}

interface WeatherCache {
  data: WeatherData;
  fetchedAt: string;
  expiresAt: string;
}

interface OpenWeatherMapResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure?: number;
  };
  wind: {
    speed: number;
    deg?: number;
  };
  clouds?: {
    all: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  visibility?: number;
  rain?: {
    '1h': number;
  };
  sys?: {
    country?: string;
  };
  name?: string;
}

// Weather Mapping
const WEATHER_MAP: Record<string, string> = {
  'Clear': 'Sunny',
  'Sunny': 'Sunny',
  'Clouds': 'Cloudy',
  'Overcast': 'Cloudy',
  'Rain': 'Rain',
  'Drizzle': 'Rain',
  'Snow': 'Snow',
  'Thunderstorm': 'Rain',
  'Mist': 'Cloudy',
  'Smoke': 'Cloudy',
  'Haze': 'Cloudy',
  'Dust': 'Cloudy',
  'Fog': 'Cloudy',
  'Sand': 'Cloudy',
  'Ash': 'Cloudy',
  'Squall': 'Windy',
  'Tornado': 'Windy'
};

// In-Memory Cache
const weatherCache = new Map<string, WeatherCache>();
const CACHE_TTL = Number(process.env.WEATHER_CACHE_TTL) || 15 * 60 * 1000; // 15 minutes in milliseconds

// Default Fallback Weather
const DEFAULT_WEATHER: WeatherData = {
  temperature: 18,
  humidity: 50,
  windSpeed: 3,
  precipitation: 0,
  description: 'Cloudy',
  feelsLike: 18,
  fetchedAt: new Date().toISOString(),
  location: 'Unknown'
};

/**
 * Fetch weather data from OpenWeatherMap API
 * @param location - Location string (city name or "lat,lon")
 * @returns WeatherData or null on error
 */
export async function fetchWeatherByLocation(location: string): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn('[Weather Service] Missing OPENWEATHER_API_KEY - weather features unavailable');
    return null;
  }

  try {
    const units = 'metric'; // Always use metric (Celsius)
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${units}`;
    
    const weatherData = await fetchFromOpenWeatherMap(url, location);
    return weatherData;
  } catch (error) {
    console.warn(`[Weather Service] Failed to fetch weather for ${location}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Fetch weather with caching (15-minute TTL)
 * @param location - Location string
 * @returns WeatherData (cached, fresh, or default)
 */
export async function getWeatherWithCache(location: string): Promise<WeatherData> {
  // Check cache first
  const cached = getCachedWeather(location);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetchWeatherByLocation(location);
  if (fresh) {
    // Cache the result
    const expiresAt = new Date(Date.now() + CACHE_TTL).toISOString();
    weatherCache.set(location, {
      data: fresh,
      fetchedAt: new Date().toISOString(),
      expiresAt
    });
    return fresh;
  }

  // Check if we have expired cache to use as fallback
  const expiredCache = weatherCache.get(location);
  if (expiredCache) {
    console.warn(`[Weather Service] Using expired cache for ${location} (API unavailable)`);
    return expiredCache.data;
  }

  // Fall back to default
  console.warn(`[Weather Service] Using default weather for ${location}`);
  return { ...DEFAULT_WEATHER, location };
}

/**
 * Get cached weather if exists and not expired
 * @param location - Location string
 * @returns WeatherData or null if expired/missing
 */
export function getCachedWeather(location: string): WeatherData | null {
  const cached = weatherCache.get(location);
  if (!cached) {
    return null;
  }

  // Check if expired
  if (new Date(cached.expiresAt) < new Date()) {
    weatherCache.delete(location);
    return null;
  }

  return cached.data;
}

/**
 * Invalidate weather cache for specific location or all
 * @param location - Optional location to clear (clears all if omitted)
 */
export function invalidateWeatherCache(location?: string): void {
  if (location) {
    weatherCache.delete(location);
    console.log(`[Weather Service] Cleared cache for ${location}`);
  } else {
    weatherCache.clear();
    console.log('[Weather Service] Cleared all weather cache');
  }
}

/**
 * Convert weather data to ContextInput format
 * @param weather - WeatherData object
 * @returns Partial ContextInput for use in outfit generation
 */
export function convertWeatherToContext(weather: WeatherData): Partial<ContextInput> {
  // Map temperature to range string
  const tempRange = getTemperatureRange(weather.temperature);

  // Map weather description to enum
  const weatherType = mapWeatherDescription(weather.description);

  return {
    temperature: `${Math.round(weather.temperature)}°C`,
    weather: weatherType,
    location: weather.location,
    // timeOfDay would be determined separately based on actual time
  };
}

/**
 * Get temperature range category
 */
function getTemperatureRange(temp: number): string {
  if (temp > 25) return 'Hot';
  if (temp >= 18) return 'Warm';
  if (temp >= 10) return 'Cool';
  return 'Cold';
}

/**
 * Map OpenWeatherMap description to our enum
 */
function mapWeatherDescription(description: string): 'Sunny' | 'Rain' | 'Cloudy' | 'Snow' | 'Windy' {
  const mapped = WEATHER_MAP[description];
  if (mapped === 'Sunny') return 'Sunny';
  if (mapped === 'Rain') return 'Rain';
  if (mapped === 'Cloudy') return 'Cloudy';
  if (mapped === 'Snow') return 'Snow';
  if (mapped === 'Windy') return 'Windy';
  return 'Cloudy'; // Default fallback
}

/**
 * Fetch data from OpenWeatherMap API
 */
function fetchFromOpenWeatherMap(url: string, location: string): Promise<WeatherData> {
  return new Promise((resolve, reject) => {
    httpsGet(url, (res: IncomingMessage) => {
      let data = '';

      res.on('data', (chunk: Buffer) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            reject(new Error(`Location not found: ${location}`));
            return;
          }

          if (res.statusCode === 401) {
            reject(new Error('Invalid OpenWeatherMap API key'));
            return;
          }

          if (res.statusCode === 429) {
            reject(new Error('OpenWeatherMap API rate limit exceeded'));
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`OpenWeatherMap API error: ${res.statusCode}`));
            return;
          }

          const response: OpenWeatherMapResponse = JSON.parse(data);
          const weatherData = parseWeatherResponse(response);
          resolve(weatherData);
        } catch (err) {
          reject(new Error(`Failed to parse weather data: ${err instanceof Error ? err.message : String(err)}`));
        }
      });
    }).on('error', (err: Error) => {
      reject(new Error(`Network error fetching weather: ${err.message}`));
    });
  });
}

/**
 * Parse OpenWeatherMap API response
 */
function parseWeatherResponse(response: OpenWeatherMapResponse): WeatherData {
  const weather = response.weather?.[0] || { main: 'Clouds', description: 'overcast clouds' };
  const description = mapWeatherDescription(weather.main);
  
  const precipitation = response.rain?.['1h'] || 0;
  const visibility = response.visibility ? response.visibility / 1000 : 10; // Convert to km

  return {
    temperature: Math.round(response.main.temp * 10) / 10,
    humidity: response.main.humidity,
    windSpeed: response.wind.speed,
    precipitation,
    description,
    feelsLike: Math.round(response.main.feels_like * 10) / 10,
    cloudiness: response.clouds?.all || 0,
    visibility,
    fetchedAt: new Date().toISOString(),
    location: response.name || 'Unknown'
  };
}
