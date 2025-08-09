#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayWithLambdaAuthorizationStack } from '../lib/api_gateway_with_lambda_authorization-stack';

const app = new cdk.App();
new ApiGatewayWithLambdaAuthorizationStack(app, 'ApiGatewayWithLambdaAuthorizationStack', {
});