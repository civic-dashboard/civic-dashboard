// src/services/clients/elastic-index-settings.ts

export const indexMappings = {
  properties: {
    id: { enabled: false },
    agendaItemId: { enabled: false },
    decisionBodyId: { enabled: false },
    decisionBodyName: { type: 'keyword' },
    reference: { type: 'keyword' },
    meetingDate: { type: 'date', format: 'epoch_millis' },
    meetingId: { enabled: false },
    termYear: { enabled: false },
    agendaCd: { enabled: false },
    itemStatus: { type: 'keyword' },
    agendaItemTitle: {
      type: 'text',
      analyzer: 'all_terms_analyzer',
      search_analyzer: 'my_stop_analyzer',
      search_quote_analyzer: 'all_terms_analyzer',
      fields: {
        suggest: { type: 'completion' }, // For autocomplete suggestions
      },
    },
    agendaItemSummary: {
      type: 'text',
      analyzer: 'all_terms_analyzer',
      search_analyzer: 'my_stop_analyzer',
      search_quote_analyzer: 'all_terms_analyzer',
    },
    agendaItemRecommendation: {
      type: 'text',
      analyzer: 'all_terms_analyzer',
      search_analyzer: 'my_stop_analyzer',
      search_quote_analyzer: 'all_terms_analyzer',
    },
    decisionRecommendations: {
      type: 'text',
      analyzer: 'all_terms_analyzer',
      search_analyzer: 'my_stop_analyzer',
      search_quote_analyzer: 'all_terms_analyzer',
    },
    decisionAdvice: {
      type: 'text',
      analyzer: 'all_terms_analyzer',
      search_analyzer: 'my_stop_analyzer',
      search_quote_analyzer: 'all_terms_analyzer',
    },
    subjectTerms: { type: 'keyword' },
    wardId: { type: 'keyword' },
  },
};

export const indexSettings = {
  index: {
    number_of_shards: parseInt(process.env.ELASTICSEARCH_SHARDS_COUNT || '1', 10),
    number_of_replicas: parseInt(process.env.ELASTICSEARCH_REPLICAS_COUNT || '1', 10),
  },
  analysis: {
    analyzer: {
      all_terms_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase'],
      },
      my_stop_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'english_stop'],
      },
    },
    filter: {
      english_stop: {
        type: 'stop',
        stopwords: '_english_',
      },
    },
  },
};

export const searchResultsLimit = 30;

/**
 * Constructs a comprehensive search query for Elasticsearch.
 * @param {string} term - The search term.
 * @returns {object} - The Elasticsearch search query.
 */
export function getSearchQuery(term: string) {
  return {
    size: searchResultsLimit,
    query: {
      bool: {
        should: [
          {
            term: {
              reference: {
                value: term,
                boost: 50.0,
              },
            },
          },
          {
            term: {
              decisionBodyName: {
                value: term,
                boost: 50.0,
              },
            },
          },
          {
            multi_match: {
              query: term,
              type: 'phrase_prefix',
              fields: [
                'agendaItemTitle^10',
                'agendaItemSummary',
                'agendaItemRecommendation^5',
                'decisionRecommendations^5',
                'decisionAdvice^5',
              ],
              minimum_should_match: '2<80% 6<90%',
              boost: 30.0,
            },
          },
          {
            multi_match: {
              query: term,
              type: 'most_fields',
              operator: 'and',
              fields: [
                'agendaItemTitle^10',
                'agendaItemSummary',
                'agendaItemRecommendation^5',
                'decisionRecommendations^5',
                'decisionAdvice^5',
              ],
              minimum_should_match: '2<80% 6<90%',
              boost: 30.0,
            },
          },
          {
            multi_match: {
              query: term,
              type: 'most_fields',
              operator: 'or',
              fields: [
                'agendaItemTitle^5',
                'agendaItemSummary',
                'agendaItemRecommendation^5',
                'decisionRecommendations^10',
                'decisionAdvice^10',
                'decisionBodyName^10',
              ],
              minimum_should_match: '2<80% 6<90%',
            },
          },
        ],
      },
    },
    sort: [
      {
        meetingDate: {
          order: 'desc',
        },
      },
    ],
    highlight: {
      fields: {
        ai_summary: {},
        agendaItemSummary: {},
        agendaItemRecommendation: {},
        decisionRecommendations: {},
        decisionAdvice: {},
      },
    },
  };
}
