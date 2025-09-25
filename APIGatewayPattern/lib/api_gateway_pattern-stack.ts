import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_apigatewayv2 as gateway } from "aws-cdk-lib";
import {GymAPIConstruct} from "../constructs/gym_api";
import {PokeAPIConstruct} from "../constructs/poke_api";

export class ApiGatewayPatternStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myApi = new gateway.HttpApi(this, "myApi");
    const gymAPI = new GymAPIConstruct(this, "gymApi", {httpApiGateway: myApi});
    const pokeAPI = new PokeAPIConstruct(this, "pokeApi", {httpApiGateway: myApi});

    new cdk.CfnOutput(this, "APIEndpoint", { value: myApi.apiEndpoint });
  }
}
