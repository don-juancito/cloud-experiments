#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayWithProxiedRdsStack } from '../lib/api_gateway_with_proxied_rds-stack';

const app = new cdk.App();
new ApiGatewayWithProxiedRdsStack(app, 'ApiGatewayWithProxiedRdsStack', {

});