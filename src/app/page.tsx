
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { LocationSearchBar } from '@/components/LocationSearchBar';
import { WeatherDisplayCard } from '@/components/WeatherDisplayCard';
import { ActivitySuggestionCard } from '@/components/ActivitySuggestionCard';
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

  const handleFetchWeather = useCallback(async (query: string, isGeoLocation: boolean = false) => {
    if (!query && !isGeoLocation) return;

    // If the query is just "My Location" and we are not in geolocation mode,
    // it means it came from debouncing after "Locate Me" button set the text.
    // The actual weather fetch for geolocation already happened with coordinates.
    // So, we can skip fetching by the literal string "My Location" if it's not a user-typed search.
    // However, if the user *types* "My Location", they might expect a search. This is tricky.
    // For simplicity, let's assume for now if query is "My Location" and it's not a geo call,
    // it's a follow-up from the locate me button setting the text, and we might not need to re-fetch
    // if the weather data for "My Location" by name is not desired/different from coord-based.
    // The current setup WILL fetch by name "My Location" after coord fetch.
    // This can be refined if specific behavior for "My Location" string is needed.
    
    setIsLoadingWeather(true);
    setError(null);
    setWeatherData(null); // Clear previous weather data
    setActivitySuggestions([]); // Clear previous activities

    try {
      let data;
      if (isGeoLocation && query.includes(',')) { // query is "lat,lon"
        const [lat, lon] = query.split(',').map(Number);
        data = await fetchWeatherByCoords(lat, lon);
         // Update search bar to a friendly name if geolocation was successful
        setSearchQuery(data.location.split(',')[0]); // Show city name from geolocation result
      } else {
        data = await fetchWeatherByLocationName(query);
      }
      setWeatherData(data);
      if (data && data.condition !== "Generic") { // Don't fetch activities for "not found"
        fetchActivitySuggestions({ weatherCondition: data.condition, location: data.location });
      } else if (data && data.condition === "Generic" && data.location.includes("(not found")) {
        toast({
          title: "Location Not Found",
          description: `Could not find weather for "${query.split('(')[0].trim()}". Please try another location.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
      setError(errorMessage);
      toast({
        title: "Weather Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingWeather(false);
    }
  }, [toast]); // setSearchQuery removed as a dependency for now, as it caused issues.


  const fetchActivitySuggestions = async (input: SuggestActivitiesInput) => {
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
      setActivitySuggestions([]); // Clear suggestions on error
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLoadingWeather(true);
      setError(null); // Clear previous errors
      setWeatherData(null); // Clear previous weather
      setActivitySuggestions([]); // Clear previous suggestions
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const query = `${latitude},${longitude}`;
          // setSearchQuery("My Location"); // Set a user-friendly name in search bar, handleFetchWeather will update it based on API response
          handleFetchWeather(query, true);
        },
        (err) => {
          setError('Unable to retrieve your location. Please enter manually or check permissions.');
          toast({
            title: "Location Error",
            description: "Could not get your current location. Please enable location services or search manually.",
            variant: "destructive",
          });
          setIsLoadingWeather(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };
  
  // Attempt to get location on initial load
  useEffect(() => {
    handleLocateMe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount


  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center w-full">
      <Header />
      <LocationSearchBar 
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleFetchWeather} 
        onLocateMe={handleLocateMe} 
        isLoading={isLoadingWeather}
      />

      {error && !isLoadingWeather && (
        <div className="text-destructive text-center my-4 p-4 bg-destructive/10 rounded-md">{error}</div>
      )}
      
      <WeatherDisplayCard weatherData={weatherData} isLoading={isLoadingWeather} />
      
      {weatherData && weatherData.condition !== "Generic" && ( // Only show if weatherData is valid
        <ActivitySuggestionCard 
          activities={activitySuggestions} 
          isLoading={isLoadingActivities}
          weatherCondition={weatherData?.condition}
        />
      )}
    </div>
  );
}
