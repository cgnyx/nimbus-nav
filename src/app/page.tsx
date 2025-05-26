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

    setIsLoadingWeather(true);
    setError(null);
    setWeatherData(null); // Clear previous weather data
    setActivitySuggestions([]); // Clear previous activities

    try {
      let data;
      if (isGeoLocation && query.includes(',')) { // query is "lat,lon"
        const [lat, lon] = query.split(',').map(Number);
        data = await fetchWeatherByCoords(lat, lon);
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
  }, [toast]);


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

  const handleSearch = (query: string) => {
    setSearchQuery(query); // Update the input field text immediately
    handleFetchWeather(query);
  };
  
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLoadingWeather(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const query = `${latitude},${longitude}`;
          setSearchQuery("My Location"); // Set a user-friendly name in search bar
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
        onSearch={handleSearch} 
        onLocateMe={handleLocateMe} 
        initialQuery={searchQuery}
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
