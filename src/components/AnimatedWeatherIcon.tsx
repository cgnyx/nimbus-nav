import type { WeatherConditionKey } from '@/types';
import { SunnyIcon } from './weather-icons/SunnyIcon';
import { CloudyIcon } from './weather-icons/CloudyIcon';
import { RainyIcon } from './weather-icons/RainyIcon';
import { SnowyIcon } from './weather-icons/SnowyIcon';
import { PartlyCloudyIcon } from './weather-icons/PartlyCloudyIcon';
import { WindyIcon } from './weather-icons/WindyIcon';
import { ThunderstormIcon } from './weather-icons/ThunderstormIcon';
import { FoggyIcon } from './weather-icons/FoggyIcon';
import { GenericWeatherIcon } from './weather-icons/GenericWeatherIcon';

interface AnimatedWeatherIconProps {
  condition: WeatherConditionKey;
  className?: string;
}

export function AnimatedWeatherIcon({ condition, className = "w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40" }: AnimatedWeatherIconProps) {
  switch (condition) {
    case 'Sunny':
      return <SunnyIcon className={className} />;
    case 'Cloudy':
      return <CloudyIcon className={className} />;
    case 'Rainy':
      return <RainyIcon className={className} />;
    case 'Snowy':
      return <SnowyIcon className={className} />;
    case 'PartlyCloudy':
      return <PartlyCloudyIcon className={className} />;
    case 'Windy':
      return <WindyIcon className={className} />;
    case 'Thunderstorm':
      return <ThunderstormIcon className={className} />;
    case 'Foggy':
      return <FoggyIcon className={className} />;
    case 'Generic':
    default:
      return <GenericWeatherIcon className={className} />;
  }
}
