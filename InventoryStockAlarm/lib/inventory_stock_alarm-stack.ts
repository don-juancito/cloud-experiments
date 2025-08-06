import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_events as events } from "aws-cdk-lib";
import { aws_events_targets as event_targets } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_sns as sns } from "aws-cdk-lib";
import { aws_sqs as sqs } from "aws-cdk-lib";
import { aws_sns_subscriptions as sns_subs } from "aws-cdk-lib";

interface InventoryStockAlarmStackProps extends cdk.StackProps {
  targetEmail: string;
  productUrl: string;
  availabilityString: string;
}

export class InventoryStockAlarmStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: InventoryStockAlarmStackProps
  ) {
    super(scope, id, props);

    const crawlingSchedule = new events.Rule(this, "crawlingSchedule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(30)),
    });

    const stockAlarmTopic = new sns.Topic(this, "stockAlarmTopic", {
      topicName: "stockAlarmTopic",
      displayName:
        "SNS Topic to notify me by email if the product is available",
    });

    const dlq = new sqs.Queue(this, "deadLetterQueue");

    const crawlerFunction = new lambda.Function(this, "crawlerFunction", {
      runtime: lambda.Runtime.PYTHON_3_13,
      code: lambda.Code.fromAsset("lambdas/crawler", {
        bundling: {
          image: lambda.Runtime.PYTHON_3_13.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install --no-cache requests beautifulsoup4 -t /asset-output && cp -au . /asset-output",
          ],
        },
      }),
      handler: "crawler.handler",
      timeout: cdk.Duration.seconds(30),
      environment: {
        PRODUCT_URL: props.productUrl,
        AVAILABILITY_STRING: props.availabilityString,
        SNS_ARN: stockAlarmTopic.topicArn,
      },
      description:
        "Function for crawling a website in search of available stock",
    });

    crawlingSchedule.addTarget(
      new event_targets.LambdaFunction(crawlerFunction, {
        deadLetterQueue: dlq,
        maxEventAge: cdk.Duration.minutes(20), // Set the maxEventAge retry to 20 minutes
        retryAttempts: 2,
      })
    );

    stockAlarmTopic.addSubscription(
      new sns_subs.EmailSubscription(props.targetEmail)
    );

    stockAlarmTopic.grantPublish(crawlerFunction);
  }
}
