# frozen_string_literal: true

require 'aws-sdk-s3'
require 'cgi'
require 'aws-sdk-textract'

TEXTRACT = Aws::Textract::Client.new
S3 = Aws::S3::Client.new

def handler(event:, context:)
  bucket = event['Records'][0]['s3']['bucket']['name']
  key = CGI.unescape(event['Records'][0]['s3']['object']['key'])
  text_bucket_name = ENV['TEXT_BUCKET_NAME']

  response = TEXTRACT.detect_document_text(
    {
      document: {
        s3_object: {
          bucket: bucket,
          name: key
        }
      }
    }
  )

  text_content = response.data
                         .blocks
                         .select { |b| b.block_type == 'LINE' }
                         .map(&:text)
                         .join("\n")

  S3.put_object(
    bucket: text_bucket_name,
    key: "#{File.basename key, '.png'}.txt",
    body: text_content
  )
end
