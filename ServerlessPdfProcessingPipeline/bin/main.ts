#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServerlessPdfProcessingPipelineStack } from '../lib/serverless_pdf_processing_pipeline-stack';

const app = new cdk.App();
new ServerlessPdfProcessingPipelineStack(app, 'ServerlessPdfProcessingPipelineStack', {
    targetDpi: 300,
});