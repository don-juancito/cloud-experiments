import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {aws_ecs as ecs} from "aws-cdk-lib";
import {aws_ecs_patterns as ecs_patterns} from "aws-cdk-lib";

export class LoadBalancedEcsFargateFromPatternStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "fargateService",
      {
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset('app'),
          containerPort: 4567,
        },
        desiredCount: 2,
        memoryLimitMiB: 1024,
        minHealthyPercent: 100,
      }
    );

  }
}
