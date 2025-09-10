import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {aws_ec2 as ec2} from 'aws-cdk-lib';
import {aws_ecs as ecs} from 'aws-cdk-lib';
import {aws_elasticloadbalancingv2 as elbv2} from 'aws-cdk-lib';

export class LoadBalancedEcsFargateFromScratchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/26"),
      maxAzs: 2,
      subnetConfiguration: [
        {cidrMask: 28, name: "private-subnet", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS},
        {cidrMask: 28, name: "public-subnet", subnetType: ec2.SubnetType.PUBLIC},
      ],
    });

    const cluster = new ecs.Cluster(this, "cluster", {
      vpc: vpc
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'taskDefinition', {
      memoryLimitMiB: 1024,
      cpu: 512,
    })

    const appContainerTD = taskDefinition.addContainer("appContainer", {
      image: ecs.ContainerImage.fromAsset("app"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "App" }),
    });

    appContainerTD.addPortMappings({
      containerPort: 4567
    });

    const fargateService = new ecs.FargateService(this, 'fargateService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 100,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    const appLB = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });

    const listener = appLB.addListener('serviceListener', {
      port: 80,
    });

    listener.addTargets("ECS", {
      port: 80,
      targets: [
        fargateService.loadBalancerTarget({
          containerName: appContainerTD.containerName,
          containerPort: 4567,
        }),
      ],
      healthCheck: {
        path: "/",
      },
    });

    new cdk.CfnOutput(this, "Load Balancer URL", { value: appLB.loadBalancerDnsName });
  }
}
