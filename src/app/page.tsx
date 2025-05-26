
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
        variant: "default", // Changed from destructive as it's a secondary feature
      });
      setActivitySuggestions([]); // Clear previous suggestions on error
    } finally {
      setIsLoadingActivities(false);
    }
  }, [toast]);

  const performWeatherFetch = useCallback(async (query: string, isGeoCall: boolean): Promise<WeatherData | null> => {
    if (!query && !isGeoCall) { // If query is empty and it's not a geo call, do nothing.
      setIsLoadingWeather(false); // Ensure loading is false if we bail early.
      return null;
    }

    setIsLoadingWeather(true);
    setError(null);
    setWeatherData(null); // Clear previous weather data before new fetch
    setActivitySuggestions([]); // Clear activity suggestions too

    try {
      let data;
      if (isGeoCall && query.includes(',')) {
        const [latStr, lonStr] = query.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        // fetchWeatherByCoords will throw if lat/lon are NaN or invalid
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
      return data; // Return data for the caller to inspect (e.g., handleGeoLocationSearch)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
      setError(errorMessage);
      toast({
        title: "Weather Error",
        description: errorMessage,
        variant: "destructive",
      });
      setWeatherData(null); // Ensure weather data is null on error
      return null; // Return null on error
    } finally {
      setIsLoadingWeather(false);
    }
  }, [toast, fetchActivitySuggestions]);


  const handleDebouncedSearch = useCallback(async (query: string) => {
    // For debounced search, the searchQuery is already set by user input.
    // We just need to fetch.
    await performWeatherFetch(query, false);
  }, [performWeatherFetch]);


  const handleGeoLocationSearch = useCallback(async () => {
    setSearchQuery('Locating...'); // Visual feedback
    setIsLoadingWeather(true);
    setError(null);
    setWeatherData(null);
    setActivitySuggestions([]);

    const defaultToBangalore = async (reason: string) => {
      toast({
        title: "Location Error",
        description: `${reason}. Defaulting to Bangalore.`,
        variant: "default",
      });
      setSearchQuery('Bangalore');
      await performWeatherFetch('Bangalore', false);
      // setIsLoadingWeather(false); // performWeatherFetch handles this
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
              setSearchQuery(newLocationName); // Update search bar to the resolved city name
            } else {
              // Weather for coords is shown, but search bar/query defaults to Bangalore
              toast({
                title: "Location Information",
                description: "Showing weather for your coordinates. City name not found, search defaults to Bangalore.",
                variant: "default",
              });
              setSearchQuery('Bangalore'); 
              // Do not re-fetch here if weatherResult for coords was successful,
              // as performWeatherFetch already displayed it.
              // If we wanted to *replace* coords weather with Bangalore weather, we'd fetch here.
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
  }, [performWeatherFetch, toast]); // searchQuery removed as it's managed internally now

  useEffect(() => {
    if (!searchQuery && !weatherData) { // Only on initial load if no query/data
        handleGeoLocationSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGeoLocationSearch]); // handleGeoLocationSearch is stable


  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center w-full">
      <Header />
      <LocationSearchBar
        value={searchQuery}
        onChange={setSearchQuery} // Allow LocationSearchBar to update searchQuery
        onSearch={handleDebouncedSearch} // Pass the debounced search handler
        onLocateMe={handleGeoLocationSearch}
        isLoading={isLoadingWeather}
      />

      {error && !isLoadingWeather && !weatherData && ( // Only show general error if no data and not loading
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
