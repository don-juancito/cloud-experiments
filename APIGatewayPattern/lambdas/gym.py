import logging
import json

logger = logging.getLogger()
logger.setLevel("INFO")

with open('gym_data.json', 'r') as file:
    gym_data = json.load(file)


def handler(event, context):
    gym_number = event.get('pathParameters', {}).get('gym_number', '')

    logger.info(f"Serving request for gym#{gym_number}")
    return {'statusCode': 200,
            'headers': {'content-type': 'application/json'},
            'body': json.dumps(gym_data.get(gym_number, {}))}
