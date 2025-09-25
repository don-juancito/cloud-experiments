import { Construct } from 'constructs';
import {aws_apigatewayv2 as gateway, aws_apigatewayv2_integrations as api_integrations} from "aws-cdk-lib";
import {aws_ecs as ecs} from "aws-cdk-lib";
import {aws_ec2 as ec2} from "aws-cdk-lib";
import {aws_ecs_patterns as ecs_patterns} from "aws-cdk-lib";

export interface PokeAPIConstructProps {
  httpApiGateway: gateway.HttpApi;
}

export class PokeAPIConstruct extends Construct {
  constructor(scope: Construct, id: string, props: PokeAPIConstructProps) {
    super(scope, id);

    const myApi = props.httpApiGateway;

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

    const vpcLinkSecurityGroup = new ec2.SecurityGroup(this, "vpcLinkSecurityGroup", {
      vpc: fargateService.cluster.vpc,
      allowAllOutbound: true,
    })

    vpcLinkSecurityGroup.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(80))
    vpcLinkSecurityGroup.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(443))

    const vpcLink = new gateway.VpcLink(this, "myVpcLink", {
      vpc: fargateService.cluster.vpc,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups: [vpcLinkSecurityGroup]
    })

    myApi.addRoutes({
      path: "/poke_info/{dex_number}",
      methods: [gateway.HttpMethod.GET],
      integration: new api_integrations.HttpAlbIntegration(
        "spIntegration",
        fargateService.listener,
        {
          vpcLink: vpcLink
        }
      )
    });

    myApi.addRoutes({
      path: "/poke_info",
      methods: [gateway.HttpMethod.GET],
      integration: new api_integrations.HttpAlbIntegration(
        "lpIntegration",
        fargateService.listener,
        {
          vpcLink: vpcLink
        }
      )
    });
  }
}