import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_rds as rds } from "aws-cdk-lib";
import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_secretsmanager as secrets } from "aws-cdk-lib";
import { aws_apigatewayv2 as gateway } from "aws-cdk-lib";
import { aws_apigatewayv2_integrations as api_integrations } from "aws-cdk-lib";

export class ApiGatewayWithProxiedRdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/27"),
      createInternetGateway: false,
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: "rds-subnet",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    vpc.addInterfaceEndpoint("secretsManagerEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      "databaseSecurityGroup",
      {
        vpc: vpc,
      }
    );

    const proxySecurityGroup = new ec2.SecurityGroup(
      this,
      "proxySecurityGroup",
      {
        vpc: vpc,
      }
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "lambdaSecurityGroup",
      {
        vpc: vpc,
      }
    );

    databaseSecurityGroup.addIngressRule(
      proxySecurityGroup,
      ec2.Port.tcp(5432)
    );
    proxySecurityGroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432));

    const dbAuthSecret = new secrets.Secret(this, "dbAuthSecret", {
      description: `Used as secret for database authentication on ${this.stackName}`,
      secretName: `${this.stackName}-db-auth`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: "postgres",
        }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });

    const database = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [databaseSecurityGroup],
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 20,
      backupRetention: cdk.Duration.days(0),
      deletionProtection: false,
      databaseName: `demoProxiedDB`,
      credentials: rds.Credentials.fromSecret(dbAuthSecret),
    });

    const proxy = database.addProxy("rdsProxy", {
      secrets: [dbAuthSecret],
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [proxySecurityGroup],
    });

    const pokeInfoFunction = new lambda.Function(this, "pokeFN", {
      runtime: lambda.Runtime.PYTHON_3_13,
      code: lambda.Code.fromAsset("lambdas", {
        bundling: {
          image: lambda.Runtime.PYTHON_3_13.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install --no-cache psycopg2-binary -t /asset-output && cp -au . /asset-output",
          ],
        },
      }),
      timeout: cdk.Duration.seconds(30),
      handler: "poke_list.handler",
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_ENDPOINT: proxy.endpoint,
        SECRET: dbAuthSecret.secretName,
      },
      description: "Provides a list of pkm for the pokeDataAPI API",
    });

    const pokeDataAPI = new gateway.HttpApi(this, "pokeDataAPI");

    pokeDataAPI.addRoutes({
      path: "/poke_info",
      methods: [gateway.HttpMethod.GET],
      integration: new api_integrations.HttpLambdaIntegration(
        "lpIntegration",
        pokeInfoFunction
      ),
    });

    dbAuthSecret.grantRead(pokeInfoFunction);

    new cdk.CfnOutput(this, "APIEndpoint", { value: pokeDataAPI.apiEndpoint });
  }
}
