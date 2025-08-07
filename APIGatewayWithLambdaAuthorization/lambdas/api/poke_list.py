import logging
import json

logger = logging.getLogger()
logger.setLevel("INFO")

with open('pokedata.json', 'r') as file:
    dex_data = json.load(file)


def handler(event, context):
    logger.info("Serving request for all pk")
    return {'statusCode': 200,
            'headers': {'content-type': 'application/json'},
            'body': json.dumps(dex_data)}
