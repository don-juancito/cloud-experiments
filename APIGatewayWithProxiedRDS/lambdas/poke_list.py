import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import boto3
import json
import sys

logger = logging.getLogger()
logger.setLevel("INFO")

db_host = os.environ['DB_ENDPOINT']
secret = os.environ['SECRET']

secrets_client = boto3.client("secretsmanager")
response = secrets_client.get_secret_value(SecretId=secret).get('SecretString')
secrets = json.loads(response)

try:
    connection = psycopg2.connect(
        database=secrets['dbname'],
        user=secrets['username'],
        password=secrets['password'],
        host=db_host,
        port='5432',
        sslmode='require'
    )
    connection.autocommit = True
except psycopg2.Error as e:
    logger.error(e)
    sys.exit(1)


def handler(event, context):
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        try:
            query = """SELECT * FROM poke_data"""
            cursor.execute(query)

            return {'statusCode': 200,
                    'headers': {'content-type': 'application/json'},
                    'body': json.dumps(cursor.fetchall())}
        except psycopg2.Error as err:
            logger.error(err)
            return {'statusCode': 500, 'body': "Error, check logs"}


def setup_db():
    with connection.cursor(cursor_factory=RealDictCursor) as cursor:
        try:
            table_exists_query = """SELECT * FROM information_schema.tables
                                    WHERE table_schema = current_schema()
                                    AND table_name = 'poke_data'
            """
            cursor.execute(table_exists_query)
            table_exists = cursor.fetchone()

            if not table_exists:
                table_create_query = """CREATE TABLE poke_data (
                                        dex_number INT,
                                        name VARCHAR(255),
                                        type VARCHAR(255)
                                        );
                    """
                cursor.execute(table_create_query)

                seed_query = """INSERT INTO poke_data
                                values
                                (1, 'Bulbasaur', 'Grass/Poison'),
                                (2, 'Ivysaur', 'Grass/Poison'),
                                (3, 'Venusaur', 'Grass/Poison'),
                                (4, 'Charmander', 'Fire');
                    """
                cursor.execute(seed_query)
        except psycopg2.Error as err:
            logger.error(err)


setup_db()
