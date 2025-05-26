import type { WeatherData, WeatherConditionKey } from '@/types';

// A simplified mapping from OpenWeatherMap main conditions to our WeatherConditionKey
const mapConditionToIconKey = (condition: string): WeatherConditionKey => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('clear')) return 'Sunny';
  if (lowerCondition.includes('clouds')) {
    if (lowerCondition.includes('few clouds') || lowerCondition.includes('scattered clouds')) return 'PartlyCloudy';
    return 'Cloudy';
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return 'Rainy';
  if (lowerCondition.includes('thunderstorm')) return 'Thunderstorm';
  if (lowerCondition.includes('snow')) return 'Snowy';
  if (lowerCondition.includes('mist') || lowerCondition.includes('smoke') || lowerCondition.includes('haze') || lowerCondition.includes('dust') || lowerCondition.includes('fog') || lowerCondition.includes('sand') || lowerCondition.includes('ash') || lowerCondition.includes('squall') || lowerCondition.includes('tornado')) return 'Foggy'; // Grouping these as 'Foggy' for simplicity, can be expanded
  // 'Windy' is often derived from wind speed, not a direct condition string from OWM main.
  // We will handle windy display based on windSpeed value in the component.
  return 'Generic'; // Default fallback
};


// This is a MOCK function. In a real app, you would fetch from a live API.
// The structure here mimics a response from an API like OpenWeatherMap.
const MOCK_API_RESPONSES: Record<string, any> = {
  "new york": {
    coord: { lon: -74.006, lat: 40.7128 },
    weather: [{ id: 803, main: "Clouds", description: "broken clouds", icon: "04d" }],
    base: "stations",
    main: { temp: 12.3, feels_like: 11.5, temp_min: 10.5, temp_max: 13.5, pressure: 1012, humidity: 60 },
    visibility: 10000,
    wind: { speed: 5.1, deg: 200 }, // speed in m/s
    clouds: { all: 75 },
    dt: Date.now() / 1000,
    sys: { type: 1, id: 4610, country: "US", sunrise: 1661834238, sunset: 1661882218 },
    timezone: -14400, // Shift in seconds from UTC
    id: 5128581,
    name: "New York",
    cod: 200,
  },
  "london": {
    coord: { lon: -0.1276, lat: 51.5072 },
    weather: [{ id: 500, main: "Rain", description: "light rain", icon: "10d" }],
    main: { temp: 10.0, feels_like: 9.0, pressure: 1005, humidity: 85 },
    wind: { speed: 7.2, deg: 240 }, // m/s
    name: "London",
    sys: { country: "GB", sunrise: 1661830000, sunset: 1661878000 },
    timezone: 3600,
  },
   "tokyo": {
    coord: { lon: 139.6917, lat: 35.6895 },
    weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
    main: { temp: 25.0, feels_like: 26.0, pressure: 1015, humidity: 50 },
    wind: { speed: 2.5, deg: 180 }, // m/s
    name: "Tokyo",
    sys: { country: "JP", sunrise: 1661810000, sunset: 1661858000 },
    timezone: 32400,
  },
};

// Mock geolocation API
export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  // In a real app, find the closest city or use a reverse geocoding API
  // For mock, let's just return London's data if it's somewhat near, else New York
  let mockDataKey = "new york"; // Default
  if (Math.abs(lat - 51.5) < 5 && Math.abs(lon - 0.12) < 5) { // Roughly near London
      mockDataKey = "london";
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const rawData = MOCK_API_RESPONSES[mockDataKey];
      resolve(transformApiDataToWeatherData(rawData, rawData.name));
    }, 500);
  });
}


export async function fetchWeatherByLocationName(locationName: string): Promise<WeatherData> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const query = locationName.toLowerCase();
      const rawData = MOCK_API_RESPONSES[query];
      if (rawData) {
        resolve(transformApiDataToWeatherData(rawData, locationName));
      } else {
        // Simulate a "city not found" scenario
        const defaultData = MOCK_API_RESPONSES["new york"]; // Fallback to a default
        const notFoundData = {
          ...transformApiDataToWeatherData(defaultData, locationName),
          location: `${locationName} (not found, showing default)`,
          condition: "Generic",
          icon: "Generic" as WeatherConditionKey,
          description: "Location not found. Displaying default weather."
        };
         resolve(notFoundData); // Resolve with modified default data to indicate not found
      }
    }, 500);
  });
}

function transformApiDataToWeatherData(apiData: any, locationDisplayName: string): WeatherData {
  const weatherConditionMain = apiData.weather && apiData.weather.length > 0 ? apiData.weather[0].main : "Unknown";
  const weatherDescription = apiData.weather && apiData.weather.length > 0 ? apiData.weather[0].description : "No description";
  
  // Convert wind speed from m/s to km/h
  const windSpeedKmh = apiData.wind && typeof apiData.wind.speed === 'number' 
    ? parseFloat((apiData.wind.speed * 3.6).toFixed(1)) 
    : 0;

  let iconKey = mapConditionToIconKey(weatherConditionMain);
  // If wind speed is high, consider it "Windy" regardless of primary condition, unless it's a storm
  if (windSpeedKmh > 30 && iconKey !== "Thunderstorm" && iconKey !== "Snowy" && iconKey !== "Rainy") {
    iconKey = "Windy";
  }

  return {
    temperature: Math.round(apiData.main.temp),
    humidity: apiData.main.humidity,
    windSpeed: windSpeedKmh,
    condition: weatherConditionMain,
    description: weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1),
    location: `${apiData.name}${apiData.sys?.country ? ', ' + apiData.sys.country : ''}`,
    icon: iconKey,
    feelsLike: apiData.main.feels_like ? Math.round(apiData.main.feels_like) : undefined,
    pressure: apiData.main.pressure,
    visibility: apiData.visibility,
    sunrise: apiData.sys?.sunrise,
    sunset: apiData.sys?.sunset,
    timezone: apiData.timezone,
    country: apiData.sys?.country,
  };
}

// Placeholder for actual API key, not used in mock
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || "YOUR_API_KEY";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// Example of how real fetch functions would look (NOT USED BY THE MOCK)
/*
export async function fetchRealWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  const data = await response.json();
  return transformApiDataToWeatherData(data, data.name);
}

export async function fetchRealWeatherByLocationName(locationName: string): Promise<WeatherData> {
  const response = await fetch(`${BASE_URL}?q=${locationName}&appid=${API_KEY}&units=metric`);
  if (!response.ok) {
     if (response.status === 404) {
        throw new Error(`City not found: ${locationName}`);
     }
    throw new Error('Failed to fetch weather data');
  }
  const data = await response.json();
  return transformApiDataToWeatherData(data, locationName);
}
*/
