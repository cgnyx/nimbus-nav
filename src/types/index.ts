export type WeatherConditionKey = 
  | "Sunny" 
  | "Rainy" 
  | "Cloudy" 
  | "Snowy" 
  | "Windy" 
  | "PartlyCloudy" 
  | "Thunderstorm" 
  | "Foggy"
  | "Generic"; // For unknown or default states

export interface WeatherData {
  temperature: number; // Celsius
  humidity: number; // Percentage
  windSpeed: number; // km/h
  condition: string; // Main condition string, e.g., "Clouds", "Rain"
  description: string; // Detailed description, e.g., "overcast clouds"
  location: string; // City name, e.g., "London, UK"
  icon: WeatherConditionKey; // Key for AnimatedWeatherIcon component
  country?: string; // Country code
  feelsLike?: number; // "Feels like" temperature
  pressure?: number; // Atmospheric pressure in hPa
  visibility?: number; // Visibility in meters
  sunrise?: number; // Unix timestamp
  sunset?: number; // Unix timestamp
  timezone?: number; // Shift in seconds from UTC
}

export interface ActivitySuggestion {
  id: string;
  name: string;
  description?: string;
}
