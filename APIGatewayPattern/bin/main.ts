#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayPatternStack } from '../lib/api_gateway_pattern-stack';

const app = new cdk.App();
new ApiGatewayPatternStack(app, 'ApiGatewayPatternStack', {
});