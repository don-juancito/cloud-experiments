#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServerlessPdfFullPipelineStack } from '../lib/serverless_pdf_full_pipeline-stack';

const app = new cdk.App();
new ServerlessPdfFullPipelineStack(app, 'ServerlessPdfFullPipelineStack', {
    targetDpi: 300,
    minimum_moderation_confidence: 60
});