// src/app/components/SearchBar.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';

interface Suggestion {
  reference: string;
  title: string;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const  SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced function to fetch suggestions
  const fetchSuggestions = useRef(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(q)}`, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch suggestions.');
        }

        const data = await response.json();
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } catch (err: any) {
        console.error('Error fetching suggestions:', err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    }, 300) // 300ms debounce
  ).current;

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle selection of a suggestion
  const handleSelect = (reference: string) => {
    setQuery(reference);
    setShowSuggestions(false);
    onSearch(reference);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-8" ref={suggestionsRef}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city council meetings..."
          className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions}
        />
        <button type="submit" className="hidden">
          Search
        </button>
      </form>
      {isLoading && (
        <div className="absolute right-3 top-3">
          <svg
            className="animate-spin h-5 w-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          <ul id="search-suggestions" role="listbox">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.reference}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(suggestion.reference)}
                role="option"
              >
                {suggestion.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <div className="absolute mt-1 bg-red-100 text-red-700 p-2 rounded-md w-full">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
