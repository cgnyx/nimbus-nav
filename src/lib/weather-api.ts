
import type { WeatherData, WeatherConditionKey } from '@/types';

const GEOCODING_API_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_API_BASE_URL = "https://api.open-meteo.com/v1/forecast";

const wmoCodeToDescription = (code: number): { main: string, description: string } => {
  const codes: Record<number, { main: string, description: string }> = {
    0: { main: "Clear", description: "Clear sky" },
    1: { main: "Mostly Clear", description: "Mainly clear" },
    2: { main: "Partly Cloudy", description: "Partly cloudy" },
    3: { main: "Cloudy", description: "Overcast" },
    45: { main: "Fog", description: "Fog" },
    48: { main: "Fog", description: "Depositing rime fog" },
    51: { main: "Drizzle", description: "Light drizzle" },
    53: { main: "Drizzle", description: "Moderate drizzle" },
    55: { main: "Drizzle", description: "Dense drizzle" },
    56: { main: "Freezing Drizzle", description: "Light freezing drizzle" },
    57: { main: "Freezing Drizzle", description: "Dense freezing drizzle" },
    61: { main: "Rain", description: "Slight rain" },
    63: { main: "Rain", description: "Moderate rain" },
    65: { main: "Rain", description: "Heavy rain" },
    66: { main: "Freezing Rain", description: "Light freezing rain" },
    67: { main: "Freezing Rain", description: "Heavy freezing rain" },
    71: { main: "Snow", description: "Slight snow fall" },
    73: { main: "Snow", description: "Moderate snow fall" },
    75: { main: "Snow", description: "Heavy snow fall" },
    77: { main: "Snow", description: "Snow grains" },
    80: { main: "Rain Showers", description: "Slight rain showers" },
    81: { main: "Rain Showers", description: "Moderate rain showers" },
    82: { main: "Rain Showers", description: "Violent rain showers" },
    85: { main: "Snow Showers", description: "Slight snow showers" },
    86: { main: "Snow Showers", description: "Heavy snow showers" },
    95: { main: "Thunderstorm", description: "Thunderstorm" }, // Simplified main
    96: { main: "Thunderstorm", description: "Thunderstorm with slight hail" },
    99: { main: "Thunderstorm", description: "Thunderstorm with heavy hail" },
  };
  return codes[code] || { main: "Unknown", description: "Unknown weather code" };
};

const mapWmoCodeToIconKey = (wmoCode: number): WeatherConditionKey => {
  if (wmoCode === 0) return 'Sunny';
  if (wmoCode >= 1 && wmoCode <= 2) return 'PartlyCloudy';
  if (wmoCode === 3) return 'Cloudy';
  if (wmoCode === 45 || wmoCode === 48) return 'Foggy';
  if ((wmoCode >= 51 && wmoCode <= 57) || (wmoCode >= 61 && wmoCode <= 67) || (wmoCode >= 80 && wmoCode <= 82)) return 'Rainy';
  if ((wmoCode >= 71 && wmoCode <= 77) || (wmoCode >= 85 && wmoCode <= 86)) return 'Snowy';
  if (wmoCode >= 95 && wmoCode <= 99) return 'Thunderstorm';
  return 'Generic';
};

async function getGeocodingData(locationName: string): Promise<any> {
  const response = await fetch(`${GEOCODING_API_BASE_URL}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch geocoding data for ${locationName}`);
  }
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Location not found: ${locationName}`);
  }
  return data.results[0];
}

async function getGeocodingDataByCoords(lat: number, lon: number): Promise<any> {
  const response = await fetch(`${GEOCODING_API_BASE_URL}?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`);
   if (!response.ok) {
    console.warn(`Failed to fetch geocoding data for coords ${lat},${lon}. Status: ${response.status}`);
    return null; // Return null instead of throwing, to allow fallback display name
  }
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
     console.warn(`No geocoding results for coords ${lat},${lon}`);
    return null; // Return null for the same reason
  }
  return data.results[0];
}


export async function fetchWeatherByLocationName(locationName: string): Promise<WeatherData> {
  const geoData = await getGeocodingData(locationName);
  const { latitude, longitude, name, country_code, timezone, admin1, utc_offset_seconds } = geoData;
  
  const displayName = (admin1 && admin1.toLowerCase() !== name.toLowerCase()) ? `${name}, ${admin1}` : name;

  const weatherApiUrl = `${FORECAST_API_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility&daily=sunrise,sunset&wind_speed_unit=kmh&timezone=${timezone}`;
  const weatherResponse = await fetch(weatherApiUrl);
  if (!weatherResponse.ok) {
    throw new Error(`Failed to fetch weather data for ${displayName}`);
  }
  const weatherApiData = await weatherResponse.json();
  return transformApiDataToWeatherData(weatherApiData, displayName, country_code, utc_offset_seconds || 0);
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  if (typeof lat !== 'number' || isNaN(lat) || typeof lon !== 'number' || isNaN(lon)) {
    console.error('Invalid coordinates provided to fetchWeatherByCoords:', lat, lon);
    throw new Error(`Invalid coordinates: Latitude and Longitude must be valid numbers.`);
  }

  let displayName: string;
  let countryCode = "";
  let timezoneIdentifier = "auto"; 
  let utcOffsetSeconds = 0; 

  try {
    const geoData = await getGeocodingDataByCoords(lat, lon);
    if (geoData && geoData.name) { 
      displayName = (geoData.admin1 && geoData.admin1.toLowerCase() !== geoData.name.toLowerCase())
                     ? `${geoData.name}, ${geoData.admin1}`
                     : geoData.name;
      countryCode = geoData.country_code || "";
      timezoneIdentifier = geoData.timezone || "auto"; 
      utcOffsetSeconds = geoData.utc_offset_seconds || 0;
    } else {
      displayName = `Coords: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      console.warn(`Using coordinates as display name because geocoding for ${lat},${lon} failed or returned no name.`);
    }
  } catch (e) {
    // This catch is for errors during getGeocodingDataByCoords itself or processing its result
    console.warn("Error during geocoding by coords, using coordinates as display name.", e);
    displayName = `Coords: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }

  const weatherApiUrl = `${FORECAST_API_BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility&daily=sunrise,sunset&wind_speed_unit=kmh&timezone=${timezoneIdentifier}`;
  const weatherResponse = await fetch(weatherApiUrl);
  if (!weatherResponse.ok) {
    throw new Error(`Failed to fetch weather data for ${displayName}`);
  }
  const weatherApiData = await weatherResponse.json();
  
  const finalUtcOffsetSeconds = utcOffsetSeconds || weatherApiData.utc_offset_seconds || 0;

  return transformApiDataToWeatherData(weatherApiData, displayName, countryCode, finalUtcOffsetSeconds);
}

function transformApiDataToWeatherData(
  apiData: any, 
  locationDisplayName: string, 
  countryCode: string | undefined,
  utcOffsetSeconds: number
): WeatherData {
  const { current, daily } = apiData;
  const { main: conditionMain, description: conditionDescription } = wmoCodeToDescription(current.weather_code);
  
  const windSpeedKmh = parseFloat(current.wind_speed_10m.toFixed(1));
  let iconKey = mapWmoCodeToIconKey(current.weather_code);

  if (windSpeedKmh > 30 && iconKey !== "Thunderstorm" && iconKey !== "Snowy" && iconKey !== "Rainy") {
    iconKey = "Windy";
  }
  
  const sunriseTimestamp = daily.sunrise && daily.sunrise[0] ? Math.floor(new Date(daily.sunrise[0]).getTime() / 1000) : undefined;
  const sunsetTimestamp = daily.sunset && daily.sunset[0] ? Math.floor(new Date(daily.sunset[0]).getTime() / 1000) : undefined;

  return {
    temperature: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: windSpeedKmh,
    condition: conditionMain,
    description: conditionDescription,
    location: `${locationDisplayName}${countryCode ? ', ' + countryCode.toUpperCase() : ''}`,
    icon: iconKey,
    feelsLike: current.apparent_temperature ? Math.round(current.apparent_temperature) : undefined,
    pressure: current.surface_pressure ? Math.round(current.surface_pressure) : undefined,
    visibility: current.visibility, 
    sunrise: sunriseTimestamp,
    sunset: sunsetTimestamp,
    timezone: utcOffsetSeconds, 
    country: countryCode ? countryCode.toUpperCase() : undefined,
  };
}
