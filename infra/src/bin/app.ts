import * as cdk from "aws-cdk-lib";
import { L6PilotStack } from "../lib/l6-pilot-stack.js";

const app = new cdk.App();
new L6PilotStack(app, "StampedL6PilotMumbai", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-south-1",
  },
  description: "Stamped L6 Experience & Integration — Mumbai pilot",
  tags: {
    project: "stamped-l6",
    environment: "pilot",
  },
});
