import os
import requests
import boto3
from bs4 import BeautifulSoup

client = boto3.client('sns')

def handler(event, context):
    product_url = os.environ.get('PRODUCT_URL')
    availability_string = os.environ.get('AVAILABILITY_STRING')
    sns_arn = os.environ.get('SNS_ARN')
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0'
    }

    response = requests.get(product_url, headers=headers)
    findings = BeautifulSoup(response.text, features="html.parser").findAll(string=availability_string)

    if findings:
        subject = "Product availability notice"
        message = "The product is available!"

        response = client.publish(
            Message=message,
            Subject=subject,
            TargetArn=sns_arn,
        )