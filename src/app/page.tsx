
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { LocationSearchBar } from '@/components/LocationSearchBar';
import { WeatherDisplayCard } from '@/components/WeatherDisplayCard';
import type { ActivitySuggestionCard } from '@/components/ActivitySuggestionCard'; // Corrected import name if necessary
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
    setWeatherData(null); 
    setActivitySuggestions([]); 

    try {
      let data;
      if (isGeoLocation && query.includes(',')) { 
        const [lat, lon] = query.split(',').map(Number);
        data = await fetchWeatherByCoords(lat, lon);
      } else {
        data = await fetchWeatherByLocationName(query);
      }
      setWeatherData(data);
      if (data && data.location && data.condition !== "Generic") {
        setSearchQuery(data.location.split(',')[0]); 
      }


      if (data && data.condition !== "Generic") { 
        fetchActivitySuggestions({ weatherCondition: data.condition, location: data.location });
      } else if (data && data.condition === "Generic") {
         toast({
          title: "Weather Information",
          description: `Displaying generic weather for "${query}". This might indicate an issue with specific data.`,
          variant: "default",
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
      setWeatherData(null); 
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
      setActivitySuggestions([]); 
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLoadingWeather(true);
      setError(null); 
      setWeatherData(null); 
      setActivitySuggestions([]); 
      setSearchQuery('Locating...'); 
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const query = `${latitude},${longitude}`;
          handleFetchWeather(query, true);
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
          setSearchQuery(''); 
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
    }
  };
  
  useEffect(() => {
    handleLocateMe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center w-full">
      <Header />
      <LocationSearchBar 
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={(query) => handleFetchWeather(query, false)}
        onLocateMe={handleLocateMe} 
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

