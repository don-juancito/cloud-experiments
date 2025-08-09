import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {aws_ec2 as ec2} from "aws-cdk-lib";

interface Ec2TestInstancesStackProps extends cdk.StackProps {
    devInstanceNumber: number;
    stagingInstanceNumber: number;
    prodInstanceNumber: number;
}

export class Ec2TestInstancesStack extends cdk.Stack {
    private readonly vpc: ec2.IVpc;

    constructor(scope: Construct, id: string, props: Ec2TestInstancesStackProps) {
        super(scope, id, props);

        // Use the default VPC to avoid creating new networking resources.
        this.vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {isDefault: true});

        this.createTestInstances(props.devInstanceNumber, "development");
        this.createTestInstances(props.stagingInstanceNumber, "staging");
        this.createTestInstances(props.prodInstanceNumber, "production");
    }

    createTestInstances(numberOfInstances: number, environment: string) {
        for (let index = 0; index < numberOfInstances; index++) {
            const instance = new ec2.Instance(this, `${environment}-${index + 1}`, {
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
                machineImage: ec2.MachineImage.latestAmazonLinux2023(),
                vpc: this.vpc,
            });

            cdk.Tags.of(instance).add('Environment', environment);
        }
    }
}