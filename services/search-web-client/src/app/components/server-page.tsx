import AppBar from "@/app/components/AppBar";
import Loading from "@/app/components/Loading";
import SearchBar from "@/app/components/SearchBar";
import FullSearchResults from "@/app/components/FullSearchResults";
import { Suspense } from "react";

/**
 * Server-side HomePage implementation that directly interfaces with search backends.
 * 
 * This module:
 * - Uses Next.js server components for server-side rendering
 * - Keeps search credentials and sensitive data secure on the server
 * - Minimizes client-server round trips by fetching data during server render
 * 
 * The search flow:
 * 1. User enters a search query
 * 2. The server-side component fetches the query results from Elasticsearch
 * 3. Results are rendered server-side and sent as pre-rendered HTML to the client
 * 
 * @module HomePage/server-page
 */

export default async function Home({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const query = searchParams?.query || ""; // Safely handle undefined queries

  return (
    <div className="bg-base-200 min-h-screen flex flex-col">
      <AppBar />
      <SearchBar onSearch={(q) => console.log(`Search initiated: ${q}`)} />
      {query && (
        <Suspense fallback={<Loading message="Loading search results..." />}>
          {/* Use FullSearchResults to render the search results */}
          <FullSearchResults query={query} />
        </Suspense>
      )}
    </div>
  );
}
