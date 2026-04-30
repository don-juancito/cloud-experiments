import * as cdk from 'aws-cdk-lib/core';
import * as path from 'node:path';
import {Construct} from 'constructs';
import {aws_lambda as lambda} from 'aws-cdk-lib';
import {aws_iam as iam} from 'aws-cdk-lib';
import {aws_apigatewayv2 as gateway} from 'aws-cdk-lib';
import {aws_apigatewayv2_integrations as api_integrations} from 'aws-cdk-lib';

interface BedrockStoryTellerApiStackProps extends cdk.StackProps {
    modelArn: string,
    inferenceProfileArn: string,
    inferenceProfileId: string,
}


export class BedrockStoryTellerApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockStoryTellerApiStackProps) {
    super(scope, id, props);

        const storyTellerAPI = new gateway.HttpApi(this, "storyTellerAPI");

        const storyTellerLambda = new lambda.Function(this, 'StoryTellerLambda', {
            runtime: lambda.Runtime.PYTHON_3_14,
            handler: 'story_retriever.handler',
            description: 'Used to retrieve stories from Bedrock',
            timeout: cdk.Duration.seconds(45),
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas')),
            environment: {
                INFERENCE_PROFILE_ID: props.inferenceProfileId,
                MODEL_REGION: props.env!.region!,
            }
        });

        storyTellerAPI.addRoutes({
            path: "/tell_story",
            methods: [gateway.HttpMethod.POST],
            integration: new api_integrations.HttpLambdaIntegration(
                "stIntegration",
                storyTellerLambda
            ),
        });

        storyTellerLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: [props.inferenceProfileArn,
                props.modelArn],
        }));

         new cdk.CfnOutput(this, "APIEndpoint", { value: storyTellerAPI.apiEndpoint });

  }
}
