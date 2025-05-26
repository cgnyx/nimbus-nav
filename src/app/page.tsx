
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { LocationSearchBar } from '@/components/LocationSearchBar';
import { ActivitySuggestionCard } from '@/components/ActivitySuggestionCard';
import { WeatherDisplayCard } from '@/components/WeatherDisplayCard';
import type { WeatherData } from '@/types';
import { fetchWeatherByLocationName, fetchWeatherByCoords } from '@/lib/weather-api';
import { suggestActivities, type SuggestActivitiesInput } from '@/ai/flows/suggest-activities';
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [activitySuggestions, setActivitySuggestions] = useState<string[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchActivitySuggestions = useCallback(async (input: SuggestActivitiesInput) => {
    setIsLoadingActivities(true);
    try {
      const suggestions = await suggestActivities(input);
      setActivitySuggestions(suggestions.activities);
    } catch (err) {
      console.error('Failed to fetch activity suggestions:', err);
      toast({
        title: "Activity Suggestion Error",
        description: "Could not fetch activity suggestions at this time.",
        variant: "default",
      });
      setActivitySuggestions([]);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [toast]);

  const performWeatherFetch = useCallback(async (query: string, isGeoCall: boolean): Promise<WeatherData | null> => {
    if (!query && !isGeoCall) {
      setIsLoadingWeather(false);
      return null;
    }

    setIsLoadingWeather(true);
    setError(null);
    // Only clear weather data if it's not a geo call that might be re-fetching for a name update
    // or if it's a new non-geo search.
    if (!isGeoCall || (isGeoCall && weatherData?.location !== query)) {
        setWeatherData(null);
    }
    setActivitySuggestions([]);

    try {
      let data;
      if (isGeoCall && query.includes(',')) {
        const [latStr, lonStr] = query.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        data = await fetchWeatherByCoords(lat, lon);
      } else {
        data = await fetchWeatherByLocationName(query);
      }
      setWeatherData(data);

      if (data && data.condition !== "Generic") {
        fetchActivitySuggestions({ weatherCondition: data.condition, location: data.location });
      } else if (data && data.condition === "Generic") {
         toast({
          title: "Weather Information",
          description: `Displaying generic weather for "${query}". This might indicate an issue with specific data.`,
          variant: "default",
        });
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
      setError(errorMessage); // This will be displayed by WeatherDisplayCard if needed
      toast({
        title: "Weather Error",
        description: errorMessage,
        variant: "destructive",
      });
      setWeatherData(null);
      return null;
    } finally {
      setIsLoadingWeather(false);
    }
  }, [toast, fetchActivitySuggestions, weatherData?.location]);


  const handleDebouncedSearch = useCallback(async (query: string) => {
    await performWeatherFetch(query, false);
  }, [performWeatherFetch]);


  const handleGeoLocationSearch = useCallback(async () => {
    setSearchQuery('Locating...');
    setIsLoadingWeather(true);
    setError(null);
    // Do not clear weather data here, allow performWeatherFetch to manage it
    setActivitySuggestions([]);

    const defaultToBangalore = async (failureReason: string) => {
      const cleanedReason = failureReason.endsWith('.') ? failureReason.slice(0, -1) : failureReason;
      toast({
        title: "Location Error",
        description: `${cleanedReason}. Defaulting to Bangalore.`,
        variant: "default",
      });
      setSearchQuery('Bangalore');
      await performWeatherFetch('Bangalore', false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          if (typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
            await defaultToBangalore("Failed to get valid coordinates");
            return;
          }

          const coordQuery = `${latitude},${longitude}`;
          const weatherResult = await performWeatherFetch(coordQuery, true);

          if (weatherResult && weatherResult.location) {
            const newLocationName = weatherResult.location.split(',')[0].trim();
            const isCoordBasedName = newLocationName.startsWith("Coords:") || newLocationName === "Unknown Coordinates";
            
            if (!isCoordBasedName) {
              setSearchQuery(newLocationName); 
            } else {
              toast({
                title: "Location Information",
                description: "Showing weather for your coordinates. City name not found, search defaults to Bangalore.",
                variant: "default",
              });
              setSearchQuery('Bangalore'); 
              // If weatherResult for coords was successful, it's already displayed.
              // No need to re-fetch Bangalore unless weatherResult was null.
              if (!weatherData) { // If the coord fetch failed to set weather data
                await performWeatherFetch('Bangalore', false);
              }
            }
          } else {
            // performWeatherFetch failed for coordinates or returned no location
            await defaultToBangalore("Could not fetch weather for your location");
          }
        },
        async (geoError: GeolocationPositionError) => {
          await defaultToBangalore(`Geolocation failed: ${geoError.message}`);
        }
      );
    } else {
      await defaultToBangalore("Geolocation is not supported by your browser");
    }
  }, [performWeatherFetch, toast, weatherData]); 

  useEffect(() => {
    // Only on initial load if no query/data and not already loading
    if (!searchQuery && !weatherData && !isLoadingWeather) {
        handleGeoLocationSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount


  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center w-full">
      <Header />
      <LocationSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleDebouncedSearch}
        onLocateMe={handleGeoLocationSearch}
        isLoading={isLoadingWeather}
      />

      {error && !isLoadingWeather && !weatherData && (
        <div className="text-destructive text-center my-4 p-4 bg-destructive/10 rounded-md">{error}</div>
      )}

      <WeatherDisplayCard weatherData={weatherData} isLoading={isLoadingWeather} error={error} />

      {weatherData && weatherData.condition !== "Generic" && (
        <ActivitySuggestionCard
          activities={activitySuggestions}
          isLoading={isLoadingActivities}
          weatherCondition={weatherData?.condition}
        />
      )}
    </div>
  );
}

