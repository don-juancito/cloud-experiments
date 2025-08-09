#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {AutoEc2InstanceStartStopStack} from '../lib/auto_ec2_instance_start_stop-stack';
import {Ec2TestInstancesStack} from "../lib/ec2_test_instances-stack";

const app = new cdk.App();
new AutoEc2InstanceStartStopStack(app, 'AutoEc2InstanceStartStopStack', {});

new Ec2TestInstancesStack(app, 'testInstances', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    devInstanceNumber: 4,
    stagingInstanceNumber: 3,
    prodInstanceNumber: 2,
});