#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServerlessPdfContentModerationPipelineStack } from '../lib/serverless_pdf_content_moderation_pipeline-stack';

const app = new cdk.App();
new ServerlessPdfContentModerationPipelineStack(app, 'ServerlessPdfContentModerationPipelineStack', {
    targetDpi: 300,
    minimum_moderation_confidence: 60,
});