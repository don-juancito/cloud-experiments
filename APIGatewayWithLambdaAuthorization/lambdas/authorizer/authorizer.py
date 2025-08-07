import os
import boto3

secret = os.environ['SECRET_NAME']
secrets_client = boto3.client("secretsmanager")
secret_api_key = secrets_client.get_secret_value(
    SecretId=secret).get('SecretString')


def handler(event, context):
    response = {"isAuthorized": False}

    try:
        if (event["headers"]["authorization"] == secret_api_key):
            response = {
                "isAuthorized": True,
            }
            return response
        else:
            return response
    except BaseException:
        return response
