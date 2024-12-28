'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from '@/app/components/SearchBar';
import FullSearchResults from '@/app/components/FullSearchResults';

const HomePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get('query')?.trim() || '';

  const handleSearch = (searchQuery: string) => {
    if (searchQuery) {
      // Navigate to the same page with updated query parameters
      router.push(`/?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="bg-base-200 text-base-content min-h-screen">
      <header className="navbar bg-base-100 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-center text-3xl font-bold">City Council Meetings Search</h1>
        </div>
      </header>
      <main className="p-4">
        <SearchBar onSearch={handleSearch} />
        {query && <FullSearchResults query={query} />}
      </main>
    </div>
  );
};

export default HomePage;
