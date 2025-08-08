#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AutoEc2InstanceStartStopStack } from '../lib/auto_ec2_instance_start_stop-stack';

const app = new cdk.App();
new AutoEc2InstanceStartStopStack(app, 'AutoEc2InstanceStartStopStack', {
  
});