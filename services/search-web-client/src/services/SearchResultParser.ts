// src/services/SearchResultParser.ts

import sanitizeHtml from 'sanitize-html';

interface SearchResult {
  _source: {
    agendaItemTitle: string;
    agendaItemSummary?: string;
    agendaItemRecommendation?: string;
    decisionRecommendations?: string;
    decisionAdvice?: string;
    ai_summary?: string;
    recommendation?: string;
    itemStatus?: string;
    reference: string;
    meetingDate: string;
  };
  highlight?: {
    ai_summary?: string[];
    agendaItemSummary?: string[];
    agendaItemRecommendation?: string[];
    decisionRecommendations?: string[];
    decisionAdvice?: string[];
  };
}

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

/**
 * Sanitizes raw search results from Elasticsearch.
 * @param {SearchResult[]} searchResults - Raw search results.
 * @returns {AgendaItem[]} - Sanitized search results.
 */
export function sanitizeSearchResults(searchResults: SearchResult[]): AgendaItem[] {
  return searchResults.map((result: SearchResult) => ({
    title: sanitizeHtml(result._source.agendaItemTitle, { allowedTags: [], allowedAttributes: {} }),
    summary: result._source.agendaItemSummary
      ? sanitizeHtml(result._source.agendaItemSummary, { allowedTags: [], allowedAttributes: {} })
      : undefined,
    ai_summary: result._source.ai_summary
      ? parseHighlights(result.highlight?.ai_summary, result._source.ai_summary)
      : undefined,
    recommendation: result._source.agendaItemRecommendation
      ? parseHighlights(result.highlight?.agendaItemRecommendation, result._source.agendaItemRecommendation)
      : undefined,
    decisionRecommendations: result._source.decisionRecommendations
      ? parseHighlights(result.highlight?.decisionRecommendations, result._source.decisionRecommendations)
      : undefined,
    decisionAdvice: result._source.decisionAdvice
      ? parseHighlights(result.highlight?.decisionAdvice, result._source.decisionAdvice)
      : undefined,
    itemStatus: sanitizeHtml(result._source.itemStatus || '', { allowedTags: [], allowedAttributes: {} }),
    reference: sanitizeHtml(result._source.reference, { allowedTags: [], allowedAttributes: {} }),
    meetingDate: sanitizeHtml(result._source.meetingDate, { allowedTags: [], allowedAttributes: {} }),
  }));
}

/**
 * Parses highlighted phrases from search results.
 * @param {string[] | undefined} highlights - Highlighted phrases from Elasticsearch.
 * @param {string} text - Original text.
 * @returns {HighlightInfo[]} - Parsed and sanitized highlighted information.
 */
function parseHighlights(highlights: string[] | undefined, text: string): HighlightInfo[] {
  if (!highlights || highlights.length === 0) {
    return [{ text: sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }), highlight: false }];
  }

  // Combine all highlights
  const combinedHighlights = highlights.join(' ');

  // Escape HTML to prevent XSS
  const escapedText = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

  // Replace highlights with bold markers
  const highlightedText = combinedHighlights
    .split('<em>')
    .map((part) => part.replace('</em>', ''))
    .reduce((acc, phrase) => acc.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), `<<<bold>>>${phrase}<<</bold>>>`), escapedText);

  // Split the text into parts based on bold markers
  const parts = highlightedText.split(/(<<<bold>>>.*?<<<\/bold>>>)/g);

  // Map parts to HighlightInfo
  return parts.map((part) => ({
    text: part.replace(/<<<\/?bold>>>/g, ''),
    highlight: /<<<bold>>>/.test(part),
  }));
}

/**
 * Extracts and formats highlighted search terms.
 * @param {SearchResult[]} searchResults - Raw search results.
 * @returns {AgendaItem[]} - Search results with highlighted terms.
 */
export function getHighlightedSearchResults(searchResults: SearchResult[]): AgendaItem[] {
  return searchResults.map((result: SearchResult) => ({
    ai_summary: result.highlight?.ai_summary?.map((text) => ({
      text: sanitizeHtml(text.replace(/<\/?em>/g, ''), { allowedTags: [], allowedAttributes: {} }),
      highlight: true,
    })),
    title: sanitizeHtml(result._source.agendaItemTitle, { allowedTags: [], allowedAttributes: {} }),
    summary: result.highlight?.agendaItemSummary?.map((text) => ({
      text: sanitizeHtml(text.replace(/<\/?em>/g, ''), { allowedTags: [], allowedAttributes: {} }),
      highlight: true,
    })),
    recommendation: result.highlight?.agendaItemRecommendation?.map((text) => ({
      text: sanitizeHtml(text.replace(/<\/?em>/g, ''), { allowedTags: [], allowedAttributes: {} }),
      highlight: true,
    })),
    decisionRecommendations: result.highlight?.decisionRecommendations?.map((text) => ({
      text: sanitizeHtml(text.replace(/<\/?em>/g, ''), { allowedTags: [], allowedAttributes: {} }),
      highlight: true,
    })),
    decisionAdvice: result.highlight?.decisionAdvice?.map((text) => ({
      text: sanitizeHtml(text.replace(/<\/?em>/g, ''), { allowedTags: [], allowedAttributes: {} }),
      highlight: true,
    })),
    reference: sanitizeHtml(result._source.reference, { allowedTags: [], allowedAttributes: {} }),
    itemStatus: sanitizeHtml(result._source.itemStatus || '', { allowedTags: [], allowedAttributes: {} }),
    meetingDate: sanitizeHtml(result._source.meetingDate, { allowedTags: [], allowedAttributes: {} }),
  }));
}
