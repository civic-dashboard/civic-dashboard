// src/app/components/FullSearchResults.tsx

'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Loading from './Loading';

interface AgendaItem {
  title: string;
  summary?: string;
  ai_summary?: HighlightInfo[];
  recommendation?: HighlightInfo[];
  decisionRecommendations?: HighlightInfo[];
  decisionAdvice?: HighlightInfo[];
  itemStatus?: string;
  reference: string;
  meetingDate: string;
}

interface HighlightInfo {
  text: string;
  highlight: boolean;
}

interface SearchResultsData {
  total: number;
  limit: number;
  results: AgendaItem[];
  highlightedResults: AgendaItem[];
}

const FullSearchResults: React.FC<{ query: string }> = ({ query }) => {
  const [results, setResults] = useState<AgendaItem[]>([]);
  const [highlightedResults, setHighlightedResults] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const resultsPerPage = 10;
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHighlightedResults([]);
      setTotal(0);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const from = (currentPage - 1) * resultsPerPage;
        const response = await fetch(
          `/api/search/full?query=${encodeURIComponent(query)}&from=${from}&size=${resultsPerPage}`,
          {
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch search results.');
        }

        const data: SearchResultsData = await response.json();
        setResults(data.results);
        setHighlightedResults(data.highlightedResults);
        setTotal(data.total);
      } catch (err: any) {
        console.error('Error fetching full search results:', err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage]);

  const totalPages = Math.ceil(total / resultsPerPage);

  if (isLoading) {
    return <Loading message="Loading search results..." />;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (results.length === 0) {
    return <div className="text-center">No results found.</div>;
  }

  return (
    <div className="flex flex-col p-10">
      <div className="flex flex-col w-full space-y-4">
        {results.map((agendaItem, index) => (
          <div key={agendaItem.reference} className="flex flex-col w-full p-2">
            <div className="card w-full bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="prose w-full bg-base-100">
                  <h2>{agendaItem.title}</h2>
                  <div className="flex flex-row gap-3 items-start flex-wrap">
                    <span className="badge badge-primary">{agendaItem.meetingDate}</span>
                    <span className="badge badge-secondary">{agendaItem.reference}</span>
                    {agendaItem.itemStatus && <span className="badge badge-info">{agendaItem.itemStatus}</span>}
                  </div>
                </div>
                {agendaItem.ai_summary && (
                  <div className="prose mt-4">
                    <div className="alert alert-info">
                      <span>AI Summary:</span>
                      <p>
                        {agendaItem.ai_summary.map((info, idx) => (
                          <span key={idx} className={info.highlight ? 'font-bold' : ''}>
                            {info.text}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                )}
                <div className="prose mt-4">
                  <div className="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" name={`${agendaItem.reference}_details`} className="peer" />
                    <div className="collapse-title text-m font-m underline">Details</div>
                    <div className="collapse-content">
                      {agendaItem.recommendation && <p><strong>Recommendation:</strong> {agendaItem.recommendation.map((rec, idx) => <span key={idx} className={rec.highlight ? 'font-bold' : ''}>{rec.text}</span>)}</p>}
                      {agendaItem.decisionAdvice && <p><strong>Decision Advice:</strong> {agendaItem.decisionAdvice.map((adv, idx) => <span key={idx} className={adv.highlight ? 'font-bold' : ''}>{adv.text}</span>)}</p>}
                      {agendaItem.decisionRecommendations && <p><strong>Decision Recommendations:</strong> {agendaItem.decisionRecommendations.map((rec, idx) => <span key={idx} className={rec.highlight ? 'font-bold' : ''}>{rec.text}</span>)}</p>}
                      {agendaItem.summary && <p><strong>Summary:</strong> {agendaItem.summary}</p>}
                    </div>
                  </div>
                </div>
                <div className="prose mt-4">
                  <p>
                    <Link
                      href={`https://secure.toronto.ca/council/agenda-item.do?item=${agendaItem.reference}`}
                      passHref
                    >
                      <a target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        View Agenda Item
                      </a>
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FullSearchResults;
