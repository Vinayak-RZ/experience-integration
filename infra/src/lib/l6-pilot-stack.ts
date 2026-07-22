import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

/**
 * Mumbai pilot topology — definitions only.
 * Human must approve `cdk diff` before deploy; no auto-apply.
 */
export class L6PilotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const dbSecret = new secretsmanager.Secret(this, "DbSecret", {
      secretName: "stamped/l6/pilot/db",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "stamped" }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });

    const authSecret = new secretsmanager.Secret(this, "AuthSecret", {
      secretName: "stamped/l6/pilot/better-auth",
      generateSecretString: {
        passwordLength: 48,
        excludePunctuation: true,
      },
    });

    const db = new rds.DatabaseInstance(this, "Postgres", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: "stamped_l6",
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MEDIUM,
      ),
      multiAz: false,
      allocatedStorage: 50,
      maxAllocatedStorage: 100,
      deletionProtection: true,
      backupRetention: cdk.Duration.days(7),
      cloudwatchLogsExports: ["postgresql"],
    });

    const reportsBucket = new s3.Bucket(this, "ReportsBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [{ abortIncompleteMultipartUploadAfter: cdk.Duration.days(7) }],
    });

    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    const taskRole = new iam.Role(this, "TaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    reportsBucket.grantReadWrite(taskRole);
    dbSecret.grantRead(taskRole);
    authSecret.grantRead(taskRole);

    const taskDef = new ecs.FargateTaskDefinition(this, "ApiTask", {
      memoryLimitMiB: 1024,
      cpu: 512,
      taskRole,
    });

    taskDef.addContainer("api", {
      // Placeholder image — replace with ECR URI at cutover
      image: ecs.ContainerImage.fromRegistry("public.ecr.aws/docker/library/node:22-alpine"),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "l6-api",
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      environment: {
        NODE_ENV: "production",
        AWS_REGION: "ap-south-1",
        REPORTS_BUCKET: reportsBucket.bucketName,
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret),
        BETTER_AUTH_SECRET: ecs.Secret.fromSecretsManager(authSecret),
      },
      portMappings: [{ containerPort: 3001 }],
    });

    const service = new ecs.FargateService(this, "ApiService", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 2,
      assignPublicIp: false,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
      vpc,
      internetFacing: true,
    });
    const listener = lb.addListener("HttpsOrHttp", { port: 80, open: true });
    listener.addTargets("ApiTargets", {
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: { path: "/health", healthyHttpCodes: "200" },
    });

    new cdk.CfnOutput(this, "AlbDns", { value: lb.loadBalancerDnsName });
    new cdk.CfnOutput(this, "ReportsBucketName", {
      value: reportsBucket.bucketName,
    });
    new cdk.CfnOutput(this, "DbInstanceId", {
      value: db.instanceIdentifier,
    });
  }
}
