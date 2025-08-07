import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_secretsmanager as secrets } from "aws-cdk-lib";
import { aws_apigatewayv2 as gateway } from "aws-cdk-lib";
import { aws_apigatewayv2_integrations as api_integrations } from "aws-cdk-lib";
import { aws_apigatewayv2_authorizers as api_auth } from "aws-cdk-lib";

export class ApiGatewayWithLambdaAuthorizationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pokeDataAPI = new gateway.HttpApi(this, "pokeDataAPI");

    const singlePokeFunction = new lambda.Function(this, "spLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      code: lambda.Code.fromAsset("lambdas/api"),
      handler: "poke.handler",
      description: `Provides a single pkm for the ${pokeDataAPI.httpApiName} API`,
    });

    const listPokeFunction = new lambda.Function(this, "lpLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      code: lambda.Code.fromAsset("lambdas/api"),
      handler: "poke_list.handler",
      description: `Provides a list of pkm for the ${pokeDataAPI.httpApiName} API`,
    });

    const authorizerSecret = new secrets.Secret(this, "authorizerSecret", {
      description: `Used as secret for authorizing requests hitting: ${pokeDataAPI.httpApiName}`,
    });

    const authorizerFunction = new lambda.Function(
      this,
      "authorizerFunction",
      {
        runtime: lambda.Runtime.PYTHON_3_13,
        code: lambda.Code.fromAsset("lambdas/authorizer"),
        handler: "authorizer.handler",
        environment: {
          SECRET_NAME: authorizerSecret.secretName,
        },
        description: `Implements Lambda authorization for: ${pokeDataAPI.httpApiName}`,
      }
    );

    const httpAuthorizer = new api_auth.HttpLambdaAuthorizer(
      "httpAuthorizer",
      authorizerFunction,
      {
        responseTypes: [api_auth.HttpLambdaResponseType.SIMPLE],
      }
    );

    pokeDataAPI.addRoutes({
      path: "/poke_info/{dex_number}",
      methods: [gateway.HttpMethod.GET],
      integration: new api_integrations.HttpLambdaIntegration(
        "spIntegration",
        singlePokeFunction
      ),
      authorizer: httpAuthorizer,
    });

    pokeDataAPI.addRoutes({
      path: "/poke_info",
      methods: [gateway.HttpMethod.GET],
      integration: new api_integrations.HttpLambdaIntegration(
        "lpIntegration",
        listPokeFunction
      ),
      authorizer: httpAuthorizer,
    });

    authorizerSecret.grantRead(authorizerFunction);

    new cdk.CfnOutput(this, "APIEndpoint", { value: pokeDataAPI.apiEndpoint });
  }
}
