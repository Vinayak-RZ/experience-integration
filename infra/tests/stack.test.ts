import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { L6PilotStack } from "../src/lib/l6-pilot-stack.js";

describe("L6 Mumbai CDK stack", () => {
  it("synthesizes RDS, ECS, ALB, S3 and secrets in ap-south-1 posture", () => {
    const app = new cdk.App();
    const stack = new L6PilotStack(app, "TestL6", {
      env: { account: "123456789012", region: "ap-south-1" },
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::RDS::DBInstance", 1);
    template.resourceCountIs("AWS::ECS::Service", 1);
    template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
    template.resourceCountIs("AWS::S3::Bucket", 1);
    template.hasResourceProperties("AWS::RDS::DBInstance", {
      DeletionProtection: true,
    });
    template.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
    assert.equal(stack.region, "ap-south-1");
  });
});
