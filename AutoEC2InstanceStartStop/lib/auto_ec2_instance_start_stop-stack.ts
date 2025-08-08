import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_events as events } from "aws-cdk-lib";
import { aws_events_targets as event_targets } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_sqs as sqs } from "aws-cdk-lib";

export class AutoEc2InstanceStartStopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

      const dlq = new sqs.Queue(this, "deadLetterQueue");

      const startStopFunction = new lambda.Function(this, "startStopFunction", {
          runtime: lambda.Runtime.RUBY_3_4,
          code: lambda.Code.fromAsset("lambdas"),
          handler: "instance_start_stop.handler",
          description: "Starts and stops an EC2 instance",
      });

      const startSchedule = new events.Rule(this, "startSchedule", {
          schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
          targets: [new event_targets.LambdaFunction(startStopFunction, {
              deadLetterQueue: dlq,
              maxEventAge: cdk.Duration.minutes(20), // Set the maxEventAge retry to 20 minutes
              retryAttempts: 2,
              event: events.RuleTargetInput.fromObject({action: "start"}),
          })]
      });

      const stopSchedule = new events.Rule(this, "stopSchedule", {
          schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
          targets: [new event_targets.LambdaFunction(startStopFunction, {
              deadLetterQueue: dlq,
              maxEventAge: cdk.Duration.minutes(20), // Set the maxEventAge retry to 20 minutes
              retryAttempts: 2,
              event: events.RuleTargetInput.fromObject({action: "stop"}),
          })]
      });

  }
}
