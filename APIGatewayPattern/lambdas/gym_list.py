import logging
import json

logger = logging.getLogger()
logger.setLevel("INFO")

with open('gym_data.json', 'r') as file:
    gym_data = json.load(file)


def handler(event, context):
    logger.info("Serving request for all pk")
    return {'statusCode': 200,
            'headers': {'content-type': 'application/json'},
            'body': json.dumps(gym_data)}
