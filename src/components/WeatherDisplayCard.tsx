
import type { WeatherData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatedWeatherIcon } from '@/components/AnimatedWeatherIcon';
import { GenericWeatherIcon } from './weather-icons/GenericWeatherIcon';
import { Droplets, Wind, Thermometer, Sunrise, Sunset, Gauge, Eye, MapPin, AlertTriangle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherDisplayCardProps {
  weatherData: WeatherData | null;
  isLoading: boolean;
  error?: string | null; // Pass error specifically for "not found" type messages tied to a location
}

const DetailItem = ({ icon: Icon, label, value, unit }: { icon: React.ElementType, label: string, value?: string | number, unit?: string }) => (
  <div className="flex items-center space-x-2 text-sm sm:text-base text-foreground/80">
    <Icon className="w-5 h-5 text-primary" />
    <span>{label}:</span>
    <strong className="text-foreground">{value ?? 'N/A'}{unit}</strong>
  </div>
);

const formatTime = (timestamp?: number, timezoneOffset?: number): string => {
  if (timestamp === undefined || timezoneOffset === undefined) return 'N/A';
  // Create a date object assuming the timestamp is UTC, then adjust by the offset
  const date = new Date((timestamp + timezoneOffset) * 1000); 
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: true });
};


export function WeatherDisplayCard({ weatherData, isLoading, error }: WeatherDisplayCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl shadow-xl rounded-xl overflow-hidden fade-in-up">
        <CardHeader className="bg-primary/10 p-4 sm:p-6">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto mt-1" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
          <div className="flex flex-col items-center">
            <Skeleton className="w-32 h-32 rounded-full mb-2" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-6 w-32 mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 w-full sm:w-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If there's an error message (like location not found) and no weather data, display it
  if (error && !weatherData) {
    return (
      <Card className="w-full max-w-2xl shadow-xl rounded-xl p-8 text-center fade-in-up bg-destructive/10 border-destructive">
        <CardHeader>
            <div className="flex items-center justify-center gap-2 text-destructive">
                 <AlertTriangle className="w-8 h-8" />
                <CardTitle className="text-2xl">{error.startsWith('Location not found:') ? 'Location Not Found' : 'Error'}</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-lg text-destructive/90">
              {error.startsWith('Location not found:') ? 
               `We couldn't find weather data for "${error.substring('Location not found:'.length).trim()}". Please check the spelling or try another location.` 
               : error}
            </p>
            <GenericWeatherIcon className="w-32 h-32 mx-auto mt-4 opacity-30" />
        </CardContent>
      </Card>
    );
  }
  
  if (!weatherData) {
    return (
       <Card className="w-full max-w-2xl shadow-xl rounded-xl p-8 text-center fade-in-up">
        <CardHeader>
            <CardTitle className="text-2xl text-muted-foreground">Welcome to Nimbus Navigator!</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-lg text-muted-foreground">Enter a location above or use the locate button to get started.</p>
            <GenericWeatherIcon className="w-32 h-32 mx-auto mt-4 opacity-50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-xl rounded-xl overflow-hidden bg-card/80 backdrop-blur-sm border-primary/20 fade-in-up">
      <CardHeader className="bg-gradient-to-br from-primary/20 to-accent/10 p-4 sm:p-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">{weatherData.location}</CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base text-foreground/70 mt-1">{weatherData.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-center justify-around gap-6 md:gap-10">
          <div className="flex flex-col items-center text-center">
            <AnimatedWeatherIcon condition={weatherData.icon} className="mb-2 w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40" />
            <p className="text-5xl sm:text-6xl font-bold text-foreground">{weatherData.temperature}°C</p>
            <p className="text-lg text-foreground/80">{weatherData.condition}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-4 text-left w-full md:w-auto">
            <DetailItem icon={Thermometer} label="Feels like" value={weatherData.feelsLike} unit="°C" />
            <DetailItem icon={Droplets} label="Humidity" value={weatherData.humidity} unit="%" />
            <DetailItem icon={Wind} label="Wind" value={weatherData.windSpeed} unit=" km/h" />
            <DetailItem icon={Gauge} label="Pressure" value={weatherData.pressure} unit=" hPa" />
            {weatherData.visibility !== undefined && 
              <DetailItem icon={Eye} label="Visibility" value={(weatherData.visibility / 1000).toFixed(1)} unit=" km" />
            }
            {weatherData.sunrise !== undefined && weatherData.timezone !== undefined &&
              <DetailItem icon={Sunrise} label="Sunrise" value={formatTime(weatherData.sunrise, weatherData.timezone)} />
            }
            {weatherData.sunset !== undefined && weatherData.timezone !== undefined &&
              <DetailItem icon={Sunset} label="Sunset" value={formatTime(weatherData.sunset, weatherData.timezone)} />
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
