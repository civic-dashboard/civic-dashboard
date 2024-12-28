// src/services/clients/elasticsearch-client.ts

import { Client } from '@elastic/elasticsearch';
import { indexSettings, indexMappings, searchResultsLimit, getSearchQuery } from './elastic-index-settings';
import { logger } from '../logger';
import fs from 'fs';

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_NODE,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },
  tls: {
    ca: process.env.ELASTICSEARCH_CA_PATH
      ? fs.readFileSync(process.cwd() + process.env.ELASTICSEARCH_CA_PATH)
      : undefined,
    rejectUnauthorized: false, // Set to true in production for security
  },
});

// Ensure the index exists with the correct settings and mappings
async function ensureIndex() {
  const index = process.env.ELASTICSEARCH_INDEX || 'city_council_meetings';
  const exists = await client.indices.exists({ index });

  if (!exists.body) {
    await client.indices.create({
      index,
      body: {
        settings: indexSettings,
        mappings: indexMappings,
      },
    });
    logger.info(`Index "${index}" created successfully.`);
  } else {
    logger.info(`Index "${index}" already exists.`);
  }
}

// Initialize the client and ensure the index on startup
(async () => {
  try {
    await client.ping();
    logger.info('Elasticsearch cluster is up!');
    await ensureIndex();
  } catch (error: any) {
    logger.error('Elasticsearch cluster is down!', error);
    process.exit(1);
  }
})();

export default client;
