# Sync-Elastic

Sync-Elastic is a microservice designed to synchronize data from a PostgreSQL database to an Elasticsearch index. This service enables seamless ingestion of data from the database and indexing it into Elasticsearch for efficient searching and retrieval.

---

## Features

- **Data Synchronization**: Fetches data from a PostgreSQL database and indexes it into an Elasticsearch cluster.
- **RESTful API**: Provides endpoints for triggering the data ingestion process and checking service health.
- **Error Logging**: Detailed logs for troubleshooting PostgreSQL or Elasticsearch connectivity issues.

---

## Requirements

- **Python**: 3.8 or newer
- **PostgreSQL**: A running PostgreSQL instance with the `city_council_meetings` table.
- **Elasticsearch**: A running Elasticsearch instance.

---

## Environment Variables

| Variable        | Description                                | Default Value        |
|------------------|--------------------------------------------|----------------------|
| `DB_HOST`       | PostgreSQL host                            | `localhost`          |
| `DB_PORT`       | PostgreSQL port                            | `5432`               |
| `DB_NAME`       | PostgreSQL database name                   | `citizen_dashboard`  |
| `DB_USER`       | PostgreSQL username                        | `your_username`      |
| `DB_PASSWORD`   | PostgreSQL password                        | `test_password`      |
| `ES_HOST`       | Elasticsearch host                         | `localhost`          |
| `ES_PORT`       | Elasticsearch port                         | `9200`               |

---

## API Endpoints

### `POST /ingest`
Triggers the ingestion process, fetching data from PostgreSQL and indexing it into Elasticsearch.

#### Request Body
No body required.

#### Response
- **200 OK**: Data successfully ingested and indexed.
- **500 Internal Server Error**: Ingestion failed due to an issue with PostgreSQL or Elasticsearch.

#### Example
```bash
curl -X POST http://<sync-elastic-host>:5000/ingest
