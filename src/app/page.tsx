
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
      return data;
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

  const handleDebouncedSearch = useCallback(async (query: string) => {
    await performWeatherFetch(query, false);
  }, [performWeatherFetch]);

  const handleGeoLocationSearch = useCallback(async () => {
    if (navigator.geolocation) {
      setSearchQuery('Locating...');
      setIsLoadingWeather(true); 
      setError(null);
      setWeatherData(null);
      setActivitySuggestions([]);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coordQuery = `${latitude},${longitude}`;
          const weatherResult = await performWeatherFetch(coordQuery, true); 

          if (weatherResult && weatherResult.location) {
            const newLocationName = weatherResult.location.split(',')[0];
            setSearchQuery(newLocationName);
          } else {
            toast({
              title: "Location Information",
              description: "Could not determine your specific location. Defaulting to Bangalore.",
              variant: "default",
            });
            setSearchQuery('Bangalore');
            await performWeatherFetch('Bangalore', false);
          }
        },
        async (geoError: GeolocationPositionError) => {
          setIsLoadingWeather(false);
          const errorMessage = `Geolocation failed: ${geoError.message}. Defaulting to Bangalore.`;
          // setError will be set by performWeatherFetch if Bangalore fails, or cleared if it succeeds.
          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "default", // Not destructive as we are falling back
          });
          setSearchQuery('Bangalore');
          await performWeatherFetch('Bangalore', false);
        }
      );
    } else {
      setIsLoadingWeather(false); 
      const description = "Geolocation is not supported by your browser. Defaulting to Bangalore.";
      // setError will be set by performWeatherFetch
      toast({
        title: "Location Error",
        description: description,
        variant: "default",
      });
      setSearchQuery('Bangalore');
      await performWeatherFetch('Bangalore', false);
    }
  }, [performWeatherFetch, toast]); 

  useEffect(() => {
    // Only call handleGeoLocationSearch if searchQuery is not already set (e.g. by user interaction before mount effect)
    // and weatherData is not already loaded. This prevents re-fetching on hot reloads if data exists.
    if (!searchQuery && !weatherData) {
        handleGeoLocationSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGeoLocationSearch]); // handleGeoLocationSearch is stable. Add other missing dependencies if ESLint suggests and they are truly needed.


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
