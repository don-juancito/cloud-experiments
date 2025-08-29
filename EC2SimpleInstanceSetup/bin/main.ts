#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Ec2SimpleInstanceSetupStack } from '../lib/ec2_simple_instance_setup-stack';

const app = new cdk.App();
new Ec2SimpleInstanceSetupStack(app, 'Ec2SimpleInstanceSetupStack', {
});