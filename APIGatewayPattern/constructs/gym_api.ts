import { Construct } from 'constructs';
import { aws_apigatewayv2 as gateway } from "aws-cdk-lib";
import { aws_apigatewayv2_integrations as api_integrations } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";

export interface GymAPIConstructProps {
  httpApiGateway: gateway.HttpApi;
}

export class GymAPIConstruct extends Construct {
  constructor(scope: Construct, id: string, props: GymAPIConstructProps) {
    super(scope, id);

    const myApi = props.httpApiGateway;

    const singleGymFunction = new lambda.Function(this, "sgLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      code: lambda.Code.fromAsset("lambdas"),
      handler: "gym.handler",
      description: `Provides a single gym for the ${myApi.httpApiName} API`,
    });

    const listGymFunction = new lambda.Function(this, "lgLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      code: lambda.Code.fromAsset("lambdas"),
      handler: "gym_list.handler",
      description: `Provides a list of gyms for the ${myApi.httpApiName} API`,
    });

    myApi.addRoutes({
      path: "/gym_info/{gym_number}",
      methods: [gateway.HttpMethod.GET],
      integration: new api_integrations.HttpLambdaIntegration(
        "sgIntegration",
        singleGymFunction
      )
    });

    myApi.addRoutes({
      path: "/gym_info",
      methods: [gateway.HttpMethod.GET],
      integration: new api_integrations.HttpLambdaIntegration(
        "lgIntegration",
        listGymFunction
      )
    });
  }
}