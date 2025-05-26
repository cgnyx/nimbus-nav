
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

  // Core weather fetching logic, designed to be stable.
  // It does not directly set searchQuery state from API response for typed searches.
  const performWeatherFetch = useCallback(async (query: string, isGeoCall: boolean): Promise<WeatherData | null> => {
    if (!query && !isGeoCall) {
      // If query is empty and it's not a geolocation call (which uses coordinates in query string), do nothing.
      // Geolocation calls will have a query string like "lat,lon".
      setIsLoadingWeather(false); // Ensure loading is stopped if we bail early
      return null;
    }

    setIsLoadingWeather(true); // This is line 26 from the error
    setError(null);
    setWeatherData(null);
    setActivitySuggestions([]);

    try {
      let data;
      if (isGeoCall && query.includes(',')) {
        const [lat, lon] = query.split(',').map(Number);
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
      return data; // Return data so the caller can decide about searchQuery
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
      setError(errorMessage);
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
  }, [toast, fetchActivitySuggestions]);


  // Handler for debounced text search from LocationSearchBar
  const handleDebouncedSearch = useCallback(async (query: string) => {
    await performWeatherFetch(query, false);
    // For text searches, searchQuery is already up-to-date from user input.
    // We don't set searchQuery here based on API response to avoid loops.
  }, [performWeatherFetch]);

  // Handler for "Locate Me" button and initial geolocation
  const handleGeoLocationSearch = useCallback(async () => {
    if (navigator.geolocation) {
      setSearchQuery('Locating...'); // Update input to show locating status
      setIsLoadingWeather(true); // Manage loading state for this action
      setError(null);
      setWeatherData(null);
      setActivitySuggestions([]);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coordQuery = `${latitude},${longitude}`;
          const weatherResult = await performWeatherFetch(coordQuery, true); // isGeoCall is true

          if (weatherResult && weatherResult.location) {
            // Update searchQuery with the actual city name from API for geolocation
            const newLocationName = weatherResult.location.split(',')[0];
            setSearchQuery(newLocationName);
          }
          // performWeatherFetch will set isLoadingWeather to false in its finally block
        },
        (geoError: GeolocationPositionError) => {
          setIsLoadingWeather(false);
          const errorMessage = `Geolocation failed: ${geoError.message}`;
          setError(errorMessage);
          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
          setSearchQuery(''); // Clear "Locating..."
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      setSearchQuery('');
      setIsLoadingWeather(false); // Ensure loading is stopped
    }
  }, [performWeatherFetch, toast ]); // Dependencies for handleGeoLocationSearch

  useEffect(() => {
    handleGeoLocationSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGeoLocationSearch]); // Runs once on mount as handleGeoLocationSearch is stable

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center w-full">
      <Header />
      <LocationSearchBar
        value={searchQuery}
        onChange={setSearchQuery} // Directly sets searchQuery state
        onSearch={handleDebouncedSearch} // Memoized handler for debounced search
        onLocateMe={handleGeoLocationSearch} // Memoized handler for locate me button
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
