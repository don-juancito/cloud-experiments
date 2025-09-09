#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LoadBalancedEcsFargateFromScratchStack } from '../lib/load_balanced_ecs_fargate_from_scratch-stack';

const app = new cdk.App();
new LoadBalancedEcsFargateFromScratchStack(app, 'LoadBalancedEcsFargateFromScratchStack', {
});