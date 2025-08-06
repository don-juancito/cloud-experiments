import boto3
import botocore.exceptions
import io
import os
import logging
import urllib
from pdf2image import convert_from_bytes

s3 = boto3.resource('s3')
logger = logging.getLogger()
logger.setLevel("INFO")


def handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    image_bucket_name = os.environ.get('IMAGE_BUCKET_NAME')
    target_dpi = int(os.environ.get('TARGET_DPI'))

    # Perform image conversion, 1 page -> 1 image
    pdf_file = bytes(s3.Object(bucket, key).get()['Body'].read())
    images = convert_from_bytes(pdf_file, dpi=target_dpi, fmt="png",)

    key_without_extension, _ = os.path.splitext(key)
    # Store each image on S3
    for count, image in enumerate(images):
        try:
            buffer = io.BytesIO()
            image.save(buffer, format=image.format)
            s3_object = s3.Object(
                image_bucket_name, f"{key_without_extension}_page{count+1}.png")
            s3_object.put(Body=buffer.getvalue())
        except botocore.exceptions.ClientError as e:
            logger.error(e)
