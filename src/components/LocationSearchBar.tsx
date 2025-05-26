
'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, LocateFixed } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface LocationSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  onSearch: (query: string) => void;
  onLocateMe: () => void;
  isLoading?: boolean;
}

export function LocationSearchBar({ 
  value, 
  onChange, 
  onSearch, 
  onLocateMe, 
  isLoading = false 
}: LocationSearchBarProps) {
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    // Only call onSearch if debouncedValue has content and is not "My Location" if it's the initial auto-locate value.
    // The actual fetch for "My Location" (by name) happens after geolocation gives coords.
    if (debouncedValue.trim() !== '') {
      // Check if the value is a result of direct typing or if it's "My Location" set programmatically.
      // We want to avoid an extra search for "My Location" string if it was just set by handleLocateMe,
      // as handleLocateMe already fetches by coordinates.
      // However, if user explicitly types "My Location", they might expect it to search.
      // This logic can be tricky. For now, let's assume any non-empty debounced value should trigger a search.
      onSearch(debouncedValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, onSearch]); // onSearch (handleFetchWeather) is stable due to useCallback

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim() !== '') {
      onSearch(value); // Perform search immediately on submit
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl flex gap-2 items-center mb-8">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter city name, e.g., London"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg rounded-lg shadow-sm focus:ring-accent focus:border-accent"
          aria-label="Search location"
          disabled={isLoading}
        />
      </div>
      <Button 
        type="button" 
        onClick={onLocateMe} 
        variant="outline" 
        size="icon" 
        className="rounded-lg shadow-sm aspect-square h-full p-3 hover:bg-accent/10"
        aria-label="Use current location"
        disabled={isLoading}
      >
        <LocateFixed className="h-5 w-5 text-primary" />
      </Button>
    </form>
  );
}
