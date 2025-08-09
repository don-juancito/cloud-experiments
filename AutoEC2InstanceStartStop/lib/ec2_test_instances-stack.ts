import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {aws_ec2 as ec2} from 'aws-cdk-lib';

interface Ec2TestInstancesStackProps extends cdk.StackProps {
    devInstanceNumber: number;
    stagingInstanceNumber: number;
    prodInstanceNumber: number;
}

export class Ec2TestInstancesStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: Ec2TestInstancesStackProps) {
        super(scope, id, props);

        const defaultVpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {isDefault: true});

        this.createTestInstances(props.devInstanceNumber, 'development', defaultVpc);
        this.createTestInstances(props.stagingInstanceNumber, 'staging', defaultVpc);
        this.createTestInstances(props.prodInstanceNumber, 'production', defaultVpc);
    }

    createTestInstances(numberOfInstances: number, environment: string, vpc: ec2.IVpc) {
        for (let index = 0; index < numberOfInstances; index++) {
            const instance = new ec2.Instance(this, `${environment}-${index + 1}`, {
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
                machineImage: ec2.MachineImage.latestAmazonLinux2023(),
                vpc: vpc,
            });

            cdk.Tags.of(instance).add('Environment', environment);
        }
    }
}