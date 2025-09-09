#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LoadBalancedEcsFargateFromPatternStack } from '../lib/load_balanced_ecs_fargate_from_pattern-stack';

const app = new cdk.App();
new LoadBalancedEcsFargateFromPatternStack(app, 'LoadBalancedEcsFargateFromPatternStack', {
});