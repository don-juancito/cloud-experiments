import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {aws_ec2 as ec2} from "aws-cdk-lib";
import {aws_iam as iam} from "aws-cdk-lib";
import {name} from "ts-jest/dist/transformers/hoist-jest";

export class Ec2SimpleInstanceSetupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const subnetConfigs = [
      {cidrMask: 28, name: "private-subnet", subnetType: ec2.SubnetType.PRIVATE_ISOLATED},
      {cidrMask: 28, name: "public-subnet", subnetType: ec2.SubnetType.PUBLIC},
    ]

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/26"),
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: subnetConfigs,
    });

    const instanceSG = new ec2.SecurityGroup(this, "instanceSG", {vpc: vpc});
    instanceSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'httpIP4',)
    instanceSG.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), 'httpIP6')

    const instanceRole = new iam.Role(this, 'instanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    const instance = new ec2.Instance(this, "Instance", {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc: vpc,
      role: instanceRole,
      vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
      securityGroup: instanceSG,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {}),
        },
      ],
    });

  }
}
