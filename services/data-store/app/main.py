import psycopg2
import json
import os
import requests
import time
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'your_db_name')
DB_USER = os.environ.get('DB_USER', 'your_db_user')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'your_db_password')
DB_PORT = os.environ.get('DB_PORT', '5432')

FETCHER_HOST = os.environ.get('FETCHER_HOST', 'data-fetcher-service')
FETCHER_PORT = os.environ.get('FETCHER_PORT', '5000')

def configure_session_with_retries(retries=5, backoff_factor=1.0, status_forcelist=[429, 500, 502, 503, 504]):

    retry_strategy = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session = requests.Session()
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

session = configure_session_with_retries()

def fetch_data_from_api(from_date: str, to_date: str):
    url = f'http://{FETCHER_HOST}:{FETCHER_PORT}/fetch-data'
    params = {
        'from_date': from_date,
        'to_date': to_date
    }
    try:
        response = session.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from API: {e}")
        raise

def insert_data_into_db(data, max_retries=5, retry_backoff=2):
    attempt = 0
    while attempt < max_retries:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                port=DB_PORT
            )
            cur = conn.cursor()

            insert_query = """
            INSERT INTO city_council_meetings (
                id, term_id, agenda_item_id, council_agenda_item_id, decision_body_id,
                meeting_id, item_process_id, decision_body_name, meeting_date, reference,
                term_year, agenda_cd, meeting_number, item_status, agenda_item_title,
                agenda_item_summary, agenda_item_recommendation, decision_recommendations,
                decision_advice, subject_terms, background_attachment_ids,
                agenda_item_address, addresses, geo_locations, ward_ids
            ) VALUES (
                %(id)s, %(termId)s, %(agendaItemId)s, %(councilAgendaItemId)s, %(decisionBodyId)s,
                %(meetingId)s, %(itemProcessId)s, %(decisionBodyName)s, to_timestamp(%(meetingDate)s / 1000), %(reference)s,
                %(termYear)s, %(agendaCd)s, %(meetingNumber)s, %(itemStatus)s, %(agendaItemTitle)s,
                %(agendaItemSummary)s, %(agendaItemRecommendation)s, %(decisionRecommendations)s,
                %(decisionAdvice)s, %(subjectTerms)s, %(backgroundAttachmentId)s,
                %(agendaItemAddress)s, %(address)s, %(geoLocation)s, %(wardId)s
            ) ON CONFLICT (id) DO NOTHING
            """

            records = data.get('Records', [])
            for record in records:
                record_prepared = {
                    'id': record.get('id'),
                    'termId': record.get('termId'),
                    'agendaItemId': record.get('agendaItemId'),
                    'councilAgendaItemId': record.get('councilAgendaItemId'),
                    'decisionBodyId': record.get('decisionBodyId'),
                    'meetingId': record.get('meetingId'),
                    'itemProcessId': record.get('itemProcessId'),
                    'decisionBodyName': record.get('decisionBodyName'),
                    'meetingDate': record.get('meetingDate'),
                    'reference': record.get('reference'),
                    'termYear': record.get('termYear'),
                    'agendaCd': record.get('agendaCd'),
                    'meetingNumber': record.get('meetingNumber'),
                    'itemStatus': record.get('itemStatus'),
                    'agendaItemTitle': record.get('agendaItemTitle'),
                    'agendaItemSummary': record.get('agendaItemSummary'),
                    'agendaItemRecommendation': record.get('agendaItemRecommendation'),
                    'decisionRecommendations': record.get('decisionRecommendations'),
                    'decisionAdvice': record.get('decisionAdvice'),
                    'subjectTerms': record.get('subjectTerms'),
                    'backgroundAttachmentId': json.dumps(record.get('backgroundAttachmentId')),
                    'agendaItemAddress': json.dumps(record.get('agendaItemAddress')),
                    'address': json.dumps(record.get('address')),
                    'geoLocation': json.dumps(record.get('geoLocation')),
                    'wardId': json.dumps(record.get('wardId')),
                }
                cur.execute(insert_query, record_prepared)

            conn.commit()
            cur.close()
            conn.close()
            print(f"Inserted {len(records)} records into the database.")
            return True
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            attempt += 1
            time.sleep(retry_backoff * attempt)  # Exponential backoff
        except Exception as e:
            print(f"Unexpected error: {e}")
            attempt += 1
            time.sleep(retry_backoff * attempt)  # Exponential backoff
    print("Max retries reached. Failed to insert data into database.")
    return False

def main():
    try:
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        from_date = yesterday.isoformat()
        to_date = today.isoformat()

        data = fetch_data_from_api(from_date, to_date)
        print("Fetched data from API.")
        insert_data_into_db(data)
    except Exception as e:
        print(f"Error in main: {e}")

if __name__ == '__main__':
    main()
