import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_s3_notifications as s3n } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";

interface ServerlessPdfProcessingPipelineStackProps extends cdk.StackProps {
  targetDpi: number;
}

export class ServerlessPdfProcessingPipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ServerlessPdfProcessingPipelineStackProps
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

    // Make emit object_created events, and target the right lambda function with each
    landingBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(pdfTransformerFunction),
      { suffix: ".pdf" }
    );

    imageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(textExtractionFunction),
      { suffix: ".png" }
    );

    // Bucket read/write permissions for the functions
    landingBucket.grantRead(pdfTransformerFunction);
    imageBucket.grantWrite(pdfTransformerFunction);
    imageBucket.grantRead(textExtractionFunction);
    textBucket.grantWrite(textExtractionFunction);

    // Allow the text extraction lambda function to query the TEXTRACT API
    const textractPolicy = new iam.PolicyStatement({
      actions: ["textract:DetectDocumentText"],
      resources: ["*"],
    });
    textExtractionFunction.addToRolePolicy(textractPolicy);
  }
}
