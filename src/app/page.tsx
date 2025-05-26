
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

  const weatherDataRef = useRef<WeatherData | null>(null);
  useEffect(() => {
    weatherDataRef.current = weatherData;
  }, [weatherData]);

  const fetchActivitySuggestions = useCallback(async (input: SuggestActivitiesInput) => {
    setIsLoadingActivities(true);
    try {
      const suggestions = await suggestActivities(input);
      setActivitySuggestions(suggestions.activities);
    } catch (err) {
      let toastTitle = "Activity Suggestion Error";
      let toastDescription = "Could not fetch activity suggestions at this time.";
      let toastVariant: "default" | "destructive" = "destructive";

      if (err instanceof Error) {
        if (err.message.includes('429') || err.message.toLowerCase().includes('quota')) {
          toastTitle = "Suggestion Limit Reached";
          toastDescription = "Too many requests for activity suggestions. Please try again in a few minutes.";
          toastVariant = "default";
          console.warn('Activity suggestion rate limit hit:', err.message);
        } else {
          console.error('Failed to fetch activity suggestions:', err.message);
        }
      } else {
        console.error('Failed to fetch activity suggestions: An unknown error occurred', err);
        toastDescription = "An unexpected error occurred while fetching activity suggestions.";
      }
      toast({ title: toastTitle, description: toastDescription, variant: toastVariant });
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

    const currentWeatherData = weatherDataRef.current;
    let preventDataClear = false;
    if (!isGeoCall && currentWeatherData && currentWeatherData.location) {
      const currentLocCity = currentWeatherData.location.split(',')[0].trim().toLowerCase();
      const queryLc = query.toLowerCase();
      if (queryLc === currentLocCity) {
        preventDataClear = true;
      }
    }

    setIsLoadingWeather(true);
    setError(null);
    if (!preventDataClear) {
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

      if (data) {
        setWeatherData(data);
        if (data.condition !== "Generic") {
          fetchActivitySuggestions({ weatherCondition: data.condition, location: data.location });
        } else {
           toast({
            title: "Weather Information",
            description: `Displaying generic weather for "${query}". This might indicate an issue with specific data.`,
            variant: "default",
          });
        }
      } else {
         if (!preventDataClear) setWeatherData(null);
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
      setError(errorMessage);
      toast({ title: "Weather Error", description: errorMessage, variant: "destructive" });
      if (!preventDataClear) setWeatherData(null);
      return null;
    } finally {
      setIsLoadingWeather(false);
    }
  }, [toast, fetchActivitySuggestions]);


  const defaultToBangalore = useCallback((failureReason: string) => {
    const cleanedReason = failureReason.endsWith('.') ? failureReason.slice(0, -1) : failureReason;
    toast({
      title: "Location Error",
      description: `${cleanedReason}. Defaulting to Bangalore.`,
      variant: "default",
    });
    setSearchQuery('Bangalore'); // This will trigger debounced search
    setIsLoadingWeather(false); // Ensure loading state is reset if this was part of a sequence
  }, [toast]);


  const handleGeoLocationSearch = useCallback(async () => {
    setSearchQuery('Locating...');
    setIsLoadingWeather(true);
    setError(null);
    setActivitySuggestions([]);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
            defaultToBangalore("Failed to get valid coordinates");
            return;
          }
          const coordQuery = `${latitude},${longitude}`;
          const weatherResultFromCoords = await performWeatherFetch(coordQuery, true);

          if (weatherResultFromCoords && weatherResultFromCoords.location) {
            const locationNameFromCoords = weatherResultFromCoords.location.split(',')[0].trim();
            const isCoordBasedName = locationNameFromCoords.startsWith("Coords:") || locationNameFromCoords === "Unknown Coordinates";
            if (!isCoordBasedName) {
              setSearchQuery(locationNameFromCoords); // Triggers debounced search for this city
            } else {
              toast({
                title: "Location Information",
                description: "Showing weather for your coordinates. City name not found, search defaults to Bangalore.",
                variant: "default",
              });
              setSearchQuery('Bangalore'); // Triggers debounced search for Bangalore
            }
          } else {
            defaultToBangalore("Could not fetch weather for your location");
          }
          setIsLoadingWeather(false); 
        },
        async (geoError: GeolocationPositionError) => {
          defaultToBangalore(`Geolocation failed: ${geoError.message}`);
        }
      );
    } else {
      defaultToBangalore("Geolocation is not supported by your browser");
    }
  }, [performWeatherFetch, toast, defaultToBangalore]);

  const handleDebouncedSearch = useCallback(async (query: string) => {
    if (query === 'Locating...' || !query.trim()) {
      return; // Don't search for placeholder or empty strings
    }
    await performWeatherFetch(query, false);
  }, [performWeatherFetch]);

  useEffect(() => {
    const currentWeatherData = weatherDataRef.current;
    if (!searchQuery && !currentWeatherData && !isLoadingWeather) {
        handleGeoLocationSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount to attempt geolocation


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
