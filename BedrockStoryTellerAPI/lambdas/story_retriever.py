import logging
import json
import os
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel("INFO")

MODEL_ID = os.environ['INFERENCE_PROFILE_ID']
REGION = os.environ['MODEL_REGION']
BEDROCK_CLIENT = boto3.client('bedrock-runtime',
                              region_name=REGION)

BASE_PROMPT =""""
For this task, do not use any formatting and just output plaintext. 
I want you to write me a short story, 3 paragraphs in length, about a character, while maintaining
consistency with the character's motivations and background. If, at the end of this prompt you are not provided with a character, please just say that you cannot complete the request without a character.
The character is  
"""


def handler(event, context):

    if not event.get('body'):
        logger.error("No Body Provided")
        return {'statusCode': 400,
                'headers': {'content-type': 'application/json'},
                'body': 'No body provided'}

    body = json.loads(event["body"])
    character = body["character"]
    if len(character) > 40:
        logger.error("Character name is too long")
        return {'statusCode': 400,
                'headers': {'content-type': 'application/json'},
                'body': 'Character name is too long, max 40 characters allowed.'}

    logger.info(f"Character: {character}")

    try:
        prompt = BASE_PROMPT + character
        response = BEDROCK_CLIENT.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                'messages': [{
                    'role': 'user',
                    'content': [{'text': prompt}]
                }],
                'inferenceConfig': {
                    'maxTokens': 2048
                }
            })
        )

        response_text = extract_text_from_response(response)
        return {'statusCode': 200,
                'headers': {'content-type': 'application/json'},
                'body': response_text}

    except (ClientError, Exception) as e:
        logger.error(f"ERROR: Can't invoke '{MODEL_ID}'. Reason: {e}")
        return {'statusCode': 500,
                'headers': {'content-type': 'application/json'},
                'body': f"Request Error: {e}"}


def extract_text_from_response(response):
    body = json.loads(response["body"].read())
    return body['output']['message']['content'][0]['text']
