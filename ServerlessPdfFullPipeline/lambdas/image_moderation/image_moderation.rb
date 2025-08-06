# frozen_string_literal: true

require 'aws-sdk-rekognition'
require 'aws-sdk-dynamodb'
require 'cgi'

REKOGNITION = Aws::Rekognition::Client.new
DYNAMO = Aws::DynamoDB::Client.new

def handler(event:, context:)
  bucket = event['Records'][0]['s3']['bucket']['name']
  key = CGI.unescape(event['Records'][0]['s3']['object']['key'])
  table_name = ENV['DYNAMO_TABLE_NAME']
  minimum_confidence = ENV['MIN_CONFIDENCE'].to_f

  resp = REKOGNITION.detect_moderation_labels(
    { image: {
        s3_object: {
          bucket: bucket,
          name: key
        }
      },
      min_confidence: minimum_confidence }
  )

  moderation_labels = resp.moderation_labels.map { |l| { name: l.name, confidence: l.confidence } }

  return if moderation_labels.empty?

  DYNAMO.put_item({
                    table_name: table_name,
                    item: { filepage: key, labels: moderation_labels }
                  })
end
