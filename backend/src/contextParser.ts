import { ContextInput } from './types.js';

/**
 * Preprocess request:
 * - Convert to lowercase
 * - Remove punctuation
 * - Trim whitespace
 * - Expand abbreviations
 */
export function normalizeRequest(request: string): string {
  if (!request) return '';
  
  return request
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .trim()
    // Expand common abbreviations
    .replace(/\bbday\b/g, 'birthday')
    .replace(/\bbd\b/g, 'birthday')
    .replace(/\bgym\b/g, 'gym workout');
}

/**
 * Extract temperature information from request:
 * - "It's 18 degrees" → "18°C"
 * - "cold" → "-5°C"
 * - Default: "18°C"
 */
export function parseTemperatureFromRequest(request: string): string {
  const normalized = normalizeRequest(request);
  
  // Temperature keywords mapping
  const TEMP_KEYWORDS: { [key: string]: string } = {
    'cold': '-5',
    'freezing': '-10',
    'chilly': '5',
    'cool': '10',
    'mild': '15',
    'moderate': '18',
    'warm': '22',
    'hot': '28',
    'scorching': '35'
  };
  
  // Check for temperature keywords
  for (const [keyword, temp] of Object.entries(TEMP_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return `${temp}°C`;
    }
  }
  
  // Try to extract explicit temperature (e.g., "18 degrees", "18c", "18°c")
  const tempMatch = normalized.match(/(\d{1,2})\s*(?:degree|degrees|c|celsius|°c|°)/);
  if (tempMatch) {
    const temp = parseInt(tempMatch[1], 10);
    return `${temp}°C`;
  }
  
  // Default
  return '18°C';
}

/**
 * Extract weather conditions from request:
 * - "rainy" → "Rain"
 * - "it's snowing" → "Snow"
 * - "sunny day" → "Sunny"
 * - Default: "Cloudy"
 */
export function parseWeatherFromRequest(request: string): 'Sunny' | 'Rain' | 'Cloudy' | 'Snow' | 'Windy' {
  const normalized = normalizeRequest(request);
  
  // Weather mapping
  const WEATHER_KEYWORDS: { [key: string]: 'Sunny' | 'Rain' | 'Cloudy' | 'Snow' | 'Windy' } = {
    'sunny': 'Sunny',
    'sun': 'Sunny',
    'bright': 'Sunny',
    'clear': 'Sunny',
    'beautiful': 'Sunny',
    'rainy': 'Rain',
    'rain': 'Rain',
    'drizzle': 'Rain',
    'wet': 'Rain',
    'raining': 'Rain',
    'cloudy': 'Cloudy',
    'overcast': 'Cloudy',
    'grey': 'Cloudy',
    'gray': 'Cloudy',
    'dull': 'Cloudy',
    'snowing': 'Snow',
    'snow': 'Snow',
    'snowy': 'Snow',
    'blizzard': 'Snow',
    'windy': 'Windy',
    'wind': 'Windy',
    'blustery': 'Windy'
  };
  
  // Check for weather keywords
  for (const [keyword, weather] of Object.entries(WEATHER_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return weather;
    }
  }
  
  // Default
  return 'Cloudy';
}

/**
 * Extract occasion from request:
 * - "work pitch" → "Work Pitch"
 * - "casual coffee" → "Casual Coffee"
 * - "date night" → "Evening Dinner"
 * - "packing for trip" → "Weekend Travel"
 * - "gym" → "Gym & Active"
 * - Default: "Casual Coffee"
 */
export function parseOccasionFromRequest(request: string): 'Work Pitch' | 'Casual Coffee' | 'Evening Dinner' | 'Weekend Travel' | 'Gym & Active' {
  const normalized = normalizeRequest(request);
  
  const OCCASION_KEYWORDS: { [key: string]: 'Work Pitch' | 'Casual Coffee' | 'Evening Dinner' | 'Weekend Travel' | 'Gym & Active' } = {
    'work': 'Work Pitch',
    'work pitch': 'Work Pitch',
    'pitch': 'Work Pitch',
    'presentation': 'Work Pitch',
    'meeting': 'Work Pitch',
    'business': 'Work Pitch',
    'office': 'Work Pitch',
    'professional': 'Work Pitch',
    'conference': 'Work Pitch',
    'coffee': 'Casual Coffee',
    'casual': 'Casual Coffee',
    'casual coffee': 'Casual Coffee',
    'brunch': 'Casual Coffee',
    'hangout': 'Casual Coffee',
    'friends': 'Casual Coffee',
    'dinner': 'Evening Dinner',
    'date': 'Evening Dinner',
    'evening': 'Evening Dinner',
    'night out': 'Evening Dinner',
    'going out': 'Evening Dinner',
    'party': 'Evening Dinner',
    'fancy': 'Evening Dinner',
    'formal': 'Evening Dinner',
    'trip': 'Weekend Travel',
    'packing': 'Weekend Travel',
    'travel': 'Weekend Travel',
    'vacation': 'Weekend Travel',
    'weekend': 'Weekend Travel',
    'getaway': 'Weekend Travel',
    'gym': 'Gym & Active',
    'active': 'Gym & Active',
    'exercise': 'Gym & Active',
    'workout': 'Gym & Active',
    'run': 'Gym & Active',
    'yoga': 'Gym & Active',
    'sports': 'Gym & Active'
  };
  
  // Check for occasion keywords (order matters - longer matches first)
  const sortedKeywords = Object.keys(OCCASION_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    if (normalized.includes(keyword)) {
      return OCCASION_KEYWORDS[keyword];
    }
  }
  
  // Default
  return 'Casual Coffee';
}

/**
 * Extract mood/style preference:
 * - "feel bold" → "Bold"
 * - "want to be relaxed" → "Relaxed"
 * - "confident vibes" → "Confident"
 * - "creative energy" → "Creative"
 * - Default: "Relaxed"
 */
export function parseMoodFromRequest(request: string): 'Confident' | 'Relaxed' | 'Bold' | 'Understated' | 'Creative' {
  const normalized = normalizeRequest(request);
  
  const MOOD_KEYWORDS: { [key: string]: 'Confident' | 'Relaxed' | 'Bold' | 'Understated' | 'Creative' } = {
    'confident': 'Confident',
    'confidence': 'Confident',
    'assured': 'Confident',
    'strong': 'Confident',
    'power': 'Confident',
    'bold': 'Bold',
    'daring': 'Bold',
    'statement': 'Bold',
    'eye catching': 'Bold',
    'relaxed': 'Relaxed',
    'chill': 'Relaxed',
    'casual': 'Relaxed',
    'comfortable': 'Relaxed',
    'easy': 'Relaxed',
    'laid back': 'Relaxed',
    'understated': 'Understated',
    'minimal': 'Understated',
    'simple': 'Understated',
    'subtle': 'Understated',
    'quiet': 'Understated',
    'low key': 'Understated',
    'creative': 'Creative',
    'artistic': 'Creative',
    'fun': 'Creative',
    'playful': 'Creative',
    'experimental': 'Creative',
    'unique': 'Creative',
    'expression': 'Creative'
  };
  
  // Check for mood keywords (order matters - longer matches first)
  const sortedKeywords = Object.keys(MOOD_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    if (normalized.includes(keyword)) {
      return MOOD_KEYWORDS[keyword];
    }
  }
  
  // Default
  return 'Relaxed';
}

/**
 * Extract time of day:
 * - "morning meeting" → "Morning"
 * - "afternoon coffee" → "Afternoon"
 * - "evening dinner" → "Evening"
 * - Default: undefined
 */
export function parseTimeOfDayFromRequest(request: string): 'Morning' | 'Afternoon' | 'Evening' | undefined {
  const normalized = normalizeRequest(request);
  
  const TIME_KEYWORDS: { [key: string]: 'Morning' | 'Afternoon' | 'Evening' } = {
    'morning': 'Morning',
    'early': 'Morning',
    'breakfast': 'Morning',
    'am': 'Morning',
    'afternoon': 'Afternoon',
    'lunch': 'Afternoon',
    'daytime': 'Afternoon',
    'pm': 'Afternoon',
    'midday': 'Afternoon',
    'evening': 'Evening',
    'night': 'Evening',
    'dinner': 'Evening',
    'sunset': 'Evening',
    'dusk': 'Evening'
  };
  
  // Check for time keywords
  for (const [keyword, time] of Object.entries(TIME_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return time;
    }
  }
  
  // Default: undefined (use current time)
  return undefined;
}

/**
 * Extract location if mentioned:
 * - "I'm in New York" → "New York"
 * - "Johannesburg weather" → "Johannesburg"
 * - Default: "Current Location"
 */
export function parseLocationFromRequest(request: string): string {
  // Look for common location patterns (preserve case)
  
  // Pattern 1: "in [City]" or "in [City], [Country]"
  const inPattern = /in\s+([A-Za-z\s,]+?)(?:\.|,|$)/i;
  const inMatch = request.match(inPattern);
  if (inMatch) {
    return inMatch[1].trim().replace(/,.*$/, '').trim(); // Remove country if present
  }
  
  // Pattern 2: "[City] weather"
  const weatherPattern = /([A-Za-z]+)\s+weather/i;
  const weatherMatch = request.match(weatherPattern);
  if (weatherMatch) {
    return weatherMatch[1];
  }
  
  // Pattern 3: Look for city names (capitalized)
  const cityPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/;
  const cityMatch = request.match(cityPattern);
  if (cityMatch) {
    const city = cityMatch[1];
    // Filter out common words that aren't cities
    if (!['The', 'It', 'I', 'This'].includes(city)) {
      return city;
    }
  }
  
  // Default
  return 'Current Location';
}

/**
 * Calculate formality preference (1-10):
 * - Work Pitch + Confident → 8-9
 * - Casual Coffee + Relaxed → 2-3
 * - Evening Dinner + Bold → 8-10
 * - Weekend Travel + Relaxed → 4-5
 * - Default: 5
 */
export function parseFormality(occasion: string, mood: string): number {
  // Base formality by occasion
  const occasionFormality: { [key: string]: number } = {
    'Work Pitch': 8,
    'Casual Coffee': 2,
    'Evening Dinner': 8,
    'Weekend Travel': 4,
    'Gym & Active': 1
  };
  
  // Mood adjustments
  const moodAdjustment: { [key: string]: number } = {
    'Confident': 1,
    'Bold': 1,
    'Relaxed': -1,
    'Understated': 0,
    'Creative': 1
  };
  
  const base = occasionFormality[occasion] || 5;
  const adjustment = moodAdjustment[mood] || 0;
  
  // Clamp between 1-10
  return Math.max(1, Math.min(10, base + adjustment));
}

/**
 * Validate context fields:
 * - Check temperature is valid format
 * - Check weather is one of valid options
 * - Check occasion is valid
 * - Check mood is valid
 * - Check formality is 1-10
 * - Check location is non-empty string
 */
export function validateContext(context: ContextInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate temperature
  if (!context.temperature || !context.temperature.match(/^\d{1,2}°?C$/)) {
    errors.push('Temperature must be in format like "18°C"');
  }
  
  // Validate weather
  const validWeather = ['Sunny', 'Rain', 'Cloudy', 'Snow', 'Windy'];
  if (!validWeather.includes(context.weather)) {
    errors.push(`Weather must be one of: ${validWeather.join(', ')}`);
  }
  
  // Validate occasion
  const validOccasion = ['Work Pitch', 'Casual Coffee', 'Evening Dinner', 'Weekend Travel', 'Gym & Active'];
  if (!validOccasion.includes(context.occasion)) {
    errors.push(`Occasion must be one of: ${validOccasion.join(', ')}`);
  }
  
  // Validate mood
  const validMood = ['Confident', 'Relaxed', 'Bold', 'Understated', 'Creative'];
  if (!validMood.includes(context.mood)) {
    errors.push(`Mood must be one of: ${validMood.join(', ')}`);
  }
  
  // Validate formality
  if (typeof context.formalityPreference !== 'number' || context.formalityPreference < 1 || context.formalityPreference > 10) {
    errors.push('Formality preference must be a number between 1 and 10');
  }
  
  // Validate location
  if (!context.location || typeof context.location !== 'string' || context.location.trim().length === 0) {
    errors.push('Location must be a non-empty string');
  }
  
  // Validate timeOfDay (optional)
  if (context.timeOfDay) {
    const validTimeOfDay = ['Morning', 'Afternoon', 'Evening'];
    if (!validTimeOfDay.includes(context.timeOfDay)) {
      errors.push(`Time of day must be one of: ${validTimeOfDay.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Master function that:
 * - Normalizes request
 * - Calls individual parsers
 * - Merges with system context
 * - Returns complete ContextInput
 * - Validates all fields present
 */
export function parseCompleteContext(
  request: string,
  systemContext?: Partial<ContextInput>
): ContextInput {
  // Parse individual fields from request
  const temperature = parseTemperatureFromRequest(request);
  const weather = parseWeatherFromRequest(request);
  const occasion = parseOccasionFromRequest(request);
  const mood = parseMoodFromRequest(request);
  const timeOfDay = parseTimeOfDayFromRequest(request);
  const location = parseLocationFromRequest(request);
  const formalityPreference = parseFormality(occasion, mood);
  
  // Merge with system context (system context takes precedence if provided)
  const context: ContextInput = {
    temperature: systemContext?.temperature || temperature,
    weather: systemContext?.weather || weather,
    occasion: systemContext?.occasion || occasion,
    mood: systemContext?.mood || mood,
    location: systemContext?.location || location,
    formalityPreference: systemContext?.formalityPreference !== undefined ? systemContext.formalityPreference : formalityPreference,
    timeOfDay: systemContext?.timeOfDay || timeOfDay
  };
  
  // Validate context
  const validation = validateContext(context);
  if (!validation.valid) {
    throw new Error(`Invalid context: ${validation.errors.join(', ')}`);
  }
  
  return context;
}
