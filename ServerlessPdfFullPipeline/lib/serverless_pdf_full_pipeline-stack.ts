import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_dynamodb as dynamo } from "aws-cdk-lib";
import { aws_s3_notifications as s3n } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_sns as sns } from "aws-cdk-lib";
import { aws_sns_subscriptions as subscriptions } from "aws-cdk-lib";

interface ServerlessPdfFullPipelineStackProps extends cdk.StackProps {
  targetDpi: number;
  minimum_moderation_confidence: number;
}

export class ServerlessPdfFullPipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ServerlessPdfFullPipelineStackProps
  ) {
    super(scope, id, props);

    const landingBucket = new s3.Bucket(this, "landingBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const imageBucket = new s3.Bucket(this, "imageBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const textBucket = new s3.Bucket(this, "textBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const labelsTable = new dynamo.Table(this, "moderationLabelsTable", {
      partitionKey: {
        name: "filepage",
        type: dynamo.AttributeType.STRING,
      },
      tableName: "pageModerationLabels",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const pdfTransformerFunction = new lambda.DockerImageFunction(
      this,
      "pdfTransformFunction",
      {
        code: lambda.DockerImageCode.fromImageAsset("lambdas/pdf_to_image"),
        environment: {
          TARGET_DPI: String(props.targetDpi),
          IMAGE_BUCKET_NAME: imageBucket.bucketName,
        },
        description: "Transforms a PDF into images, one per page",
        memorySize: 512,
        timeout: cdk.Duration.seconds(120),
      }
    );

    const textExtractionFunction = new lambda.Function(
      this,
      "textExtractionFunction",
      {
        runtime: lambda.Runtime.RUBY_3_3,
        code: lambda.Code.fromAsset("lambdas/text_extractor"),
        handler: "text_extractor.handler",
        environment: {
          TEXT_BUCKET_NAME: textBucket.bucketName,
        },
        description: "Extracts text from each image that gets created",
        timeout: cdk.Duration.seconds(120),
      }
    );

    const imageModerationFunction = new lambda.Function(
      this,
      "imageModerationFunction",
      {
        runtime: lambda.Runtime.RUBY_3_3,
        code: lambda.Code.fromAsset("lambdas/image_moderation"),
        handler: "image_moderation.handler",
        environment: {
          MIN_CONFIDENCE: String(props.minimum_moderation_confidence),
          DYNAMO_TABLE_NAME: labelsTable.tableName,
        },
        description:
          "Uses Rekognition to detect harmful content, and stores results on a DynamoDB table",
        timeout: cdk.Duration.seconds(30),
      }
    );

    // Create an SNS topic and use event fanout
    const snsTopic = new sns.Topic(this, "imageBucketObjectCreatedTopic", {
      topicName: "imageBucketObjectCreatedTopic",
      displayName:
        "SNS Topic for doing fan-out on the object_created events from the image S3 bucket",
    });

    // Enable buckets to emit events when objects are created
    landingBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(pdfTransformerFunction),
      { suffix: ".pdf" }
    );

    imageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(snsTopic),
      { suffix: ".png" }
    );

    snsTopic.addSubscription(
      new subscriptions.LambdaSubscription(textExtractionFunction)
    );
    snsTopic.addSubscription(
      new subscriptions.LambdaSubscription(imageModerationFunction)
    );

    // Allow the lambda to read from the source bucket, and write on the target buckets and dynamo table
    landingBucket.grantRead(pdfTransformerFunction);
    imageBucket.grantWrite(pdfTransformerFunction);
    imageBucket.grantRead(textExtractionFunction);
    textBucket.grantWrite(textExtractionFunction);
    imageBucket.grantRead(imageModerationFunction);
    labelsTable.grantWriteData(imageModerationFunction);

    // Allow the text extraction lambda function to query the TEXTRACT API
    const textractPolicy = new iam.PolicyStatement({
      actions: ["textract:DetectDocumentText"],
      resources: ["*"],
    });
    textExtractionFunction.addToRolePolicy(textractPolicy);

    // Same for the other lambda, but with Rekognition
    const rekognitionPolicy = new iam.PolicyStatement({
      actions: ["rekognition:DetectModerationLabels"],
      resources: ["*"],
    });
    imageModerationFunction.addToRolePolicy(rekognitionPolicy);
  }
}
