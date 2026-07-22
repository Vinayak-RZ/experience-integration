# AWS CDK — Stamped L6 Mumbai pilot

Definitions only. **Do not deploy** without human `cdk diff` approval.

```bash
pnpm --filter @stamped/l6-infra install
pnpm --filter @stamped/l6-infra test
pnpm --filter @stamped/l6-infra exec cdk synth --app "tsx src/bin/app.ts"
```

Stack: RDS Postgres 16, ECS Fargate API (2 tasks), ALB, S3 reports bucket,
Secrets Manager for DB + Better Auth, CloudWatch logs. Region hard-coded
`ap-south-1`.
