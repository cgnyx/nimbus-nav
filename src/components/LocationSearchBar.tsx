'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, LocateFixed } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface LocationSearchBarProps {
  onSearch: (query: string) => void;
  onLocateMe: () => void;
  initialQuery?: string;
  isLoading?: boolean;
}

export function LocationSearchBar({ onSearch, onLocateMe, initialQuery = '', isLoading = false }: LocationSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.trim() !== '') {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);
  
  useEffect(() => {
    // If initialQuery changes from outside, update internal state
    if(initialQuery !== query && initialQuery.trim() !== '') {
      setQuery(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim() !== '') {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl flex gap-2 items-center mb-8">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter city name, e.g., London"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
