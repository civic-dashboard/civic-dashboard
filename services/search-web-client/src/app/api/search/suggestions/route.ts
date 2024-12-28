import { NextRequest, NextResponse } from 'next/server';
import client from '@/services/clients/elasticsearch-client';
import redis from '@/services/clients/redis-client';
import { logger } from '@/services/logger';
import sanitizeHtml from 'sanitize-html';

export async function GET(request: NextRequest) {
  // Extract and validate the 'query' parameter from the URL
  const url = new URL(request.url);
  const rawQuery = url.searchParams.get('query');

  if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.length > 100) {
    logger.warn('Invalid query received');
    return NextResponse.json(
      { error: 'Invalid query parameter.' },
      { status: 400 }
    );
  }

  // Sanitize the user input to prevent injection attacks
  const query = sanitizeHtml(rawQuery, {
    allowedTags: [],
    allowedAttributes: {},
  });

  // Define a unique Redis cache key for the current query
  const cacheKey = `suggestions:${query.toLowerCase()}`;

  try {
    logger.info(`Autocomplete query: "${query}"`);

    // Attempt to retrieve suggestions from Redis cache
    const cachedSuggestions = await redis.get(cacheKey);
    if (cachedSuggestions) {
      logger.info(`Cache hit for key: ${cacheKey}`);
      return NextResponse.json({ suggestions: JSON.parse(cachedSuggestions) });
    }

    // If cache miss, fetch suggestions from Elasticsearch
    const response = await client.search({
      index: process.env.ELASTICSEARCH_INDEX || 'city_council_meetings',
      body: {
        suggest: {
          title_suggester: {
            prefix: query,
            completion: {
              field: 'agendaItemTitle.suggest', // Ensure this field is mapped as 'completion' in Elasticsearch
              fuzzy: {
                fuzziness: 'AUTO',
              },
              size: 5, // Number of suggestions to return
            },
          },
        },
      },
    });

    // Parse the suggestions from Elasticsearch response
    const suggestions = response.body.suggest.title_suggester[0].options.map((option: any) => ({
      reference: option._source.reference,
      title: option._source.agendaItemTitle,
    }));

    // Store the fetched suggestions in Redis cache with a TTL of 1 hour (3600 seconds)
    await redis.set(cacheKey, JSON.stringify(suggestions), 'EX', 3600);

    // Return the suggestions to the client
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    logger.error(`Elasticsearch Suggestions Error: ${error.message}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
