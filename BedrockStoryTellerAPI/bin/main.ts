#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { BedrockStoryTellerApiStack } from '../lib/bedrock_story_teller_api-stack';

const app = new cdk.App();
new BedrockStoryTellerApiStack(app, 'BedrockStoryTellerApiStack', {
        env:{
        region: 'eu-west-1',
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
    modelArn: 'arn:aws:bedrock:eu-*::foundation-model/amazon.nova-2-lite-v1:0',
    inferenceProfileArn: 'arn:aws:bedrock:eu-west-1:515474521171:inference-profile/eu.amazon.nova-2-lite-v1:0',
    inferenceProfileId: 'eu.amazon.nova-2-lite-v1:0',
});
