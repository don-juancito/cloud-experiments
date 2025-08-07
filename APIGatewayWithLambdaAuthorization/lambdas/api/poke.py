import logging
import json

logger = logging.getLogger()
logger.setLevel("INFO")

with open('pokedata.json', 'r') as file:
    dex_data = json.load(file)


def handler(event, context):
    dex_number = event.get('pathParameters', {}).get('dex_number', '')

    logger.info(f"Serving request for pk#{dex_number}")
    return {'statusCode': 200,
            'headers': {'content-type': 'application/json'},
            'body': json.dumps(dex_data.get(dex_number, {}))}
