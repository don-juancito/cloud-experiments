import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_dynamodb as dynamo } from "aws-cdk-lib";
import { aws_s3_notifications as s3n } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";

interface ServerlessPdfContentModerationPipelineStackProps
  extends cdk.StackProps {
  targetDpi: number;
  minimum_moderation_confidence: number;
}

export class ServerlessPdfContentModerationPipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ServerlessPdfContentModerationPipelineStackProps
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

    landingBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(pdfTransformerFunction),
      { suffix: ".pdf" }
    );

    imageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(imageModerationFunction),
      { suffix: ".png" }
    );

    // Bucket and table read/write permissions for the functions
    landingBucket.grantRead(pdfTransformerFunction);
    imageBucket.grantWrite(pdfTransformerFunction);
    imageBucket.grantRead(imageModerationFunction);
    labelsTable.grantWriteData(imageModerationFunction);

    // Allow the image moderation lambda function to query the REKOGNITION API
    const rekognitionPolicy = new iam.PolicyStatement({
      actions: ["rekognition:DetectModerationLabels"],
      resources: ["*"],
    });
    imageModerationFunction.addToRolePolicy(rekognitionPolicy);
  }
}
