# Task Manager

A small task management service taken all the way to production: a NestJS REST API, a Next.js frontend, one Docker image, AWS infrastructure defined in Terraform, and a GitHub Actions pipeline that tests, builds and deploys on every push to `main`.

**Live:** http://51.21.241.23 · health check: http://51.21.241.23/health

```
 push to main
      │
      ▼
 GitHub Actions ── test ──▶ build image ──▶ push to ECR ──▶ SSH deploy ──▶ smoke test
                                                │                │
                                                ▼                ▼
                                          Amazon ECR ──pull──▶ EC2 (Docker)
                                                               └─ one container, port 80
                                                                  ├─ NestJS API   /health, /tasks
                                                                  └─ static Next.js frontend  /
```

## Repository layout

| Path | What it holds |
|---|---|
| `api/` | NestJS API, Jest unit and e2e tests |
| `web/` | Next.js frontend (App Router, static export, Tailwind) |
| `Dockerfile`, `compose.yaml` | Multi-stage production image and a local runner |
| `infra/` | Terraform for every AWS resource |
| `scripts/deploy.sh` | Runs on the instance: pull the image, replace the container, wait for health |
| `.github/workflows/deploy.yml` | The CI/CD pipeline |

## API

| Endpoint | Behaviour |
|---|---|
| `GET /health` | `200` `{ "status": "ok", "uptime": 1234, "version": "<commit sha>" }` |
| `GET /tasks` | `200` with an array of tasks, `[]` when there are none |
| `POST /tasks` | Body `{ "title": "..." }`. `201` with the created task, `400` with a message when the title is missing, empty, whitespace only, not a string, or longer than 200 characters |

A task is `{ "id": "<uuid>", "title": "...", "createdAt": "<ISO 8601>" }`.

Every request produces one log line from a custom middleware: `GET /tasks 200 0.6ms`.

## Run locally

Requires Node 24 (see `.nvmrc`).

```bash
# terminal 1 – API on http://localhost:3000
cd api && npm ci && npm run start:dev

# terminal 2 – frontend on http://localhost:3001
cd web && npm ci && npm run dev
```

Or run the production image, API and frontend together on http://localhost:8080:

```bash
docker compose up --build
```

## Tests and coverage

```bash
cd api
npm test            # unit + e2e with coverage, fails below 80%
npm run test:unit   # unit tests only
npm run test:e2e    # HTTP-level tests only
```

The coverage summary is printed to the terminal and the HTML report is written to `api/coverage/lcov-report/index.html`. Coverage is currently 100%. The 80% threshold is enforced in `api/jest.config.js`, so both `npm test` and the pipeline fail if it drops.

Unit tests mock the data-access layer: `TasksService` is tested against a mocked `TasksRepository`, the controller against a mocked service. The e2e suite boots the real application and exercises all three endpoints over HTTP, including each `400` case.

## Infrastructure

Everything in AWS is created by Terraform from `infra/`:

- an EC2 `t3.micro` instance (Amazon Linux 2023) that installs Docker on first boot
- an Elastic IP, so the URL survives instance restarts
- a security group that allows inbound `80` (app) and `22` (deployments)
- an ECR repository that keeps the five most recent images
- an IAM role that lets the instance pull from that repository without stored credentials
- an IAM user for the pipeline that can only push to that repository

```bash
cd infra
terraform init
terraform apply
```

Prerequisites: AWS credentials for an administrator in the shell, and a deploy key pair at `~/.ssh/cheq-deploy` (`ssh-keygen -t ed25519 -f ~/.ssh/cheq-deploy`). The outputs give the public IP, the ECR URL and the pipeline user's access key.

**Why EC2 and not Fargate or App Runner.** It is the brief's default, it is the cheapest option that stays up until the interview, and one container on one instance is the smallest thing that satisfies every requirement. The frontend is a static export served by the same NestJS process, so there is a single URL and no CORS in production. The scalability section below describes what I would change first.

## Deployment

The pipeline runs on every push to `main`:

1. **Test** – lint, Jest with coverage for the API, lint and build for the frontend. A failure stops the pipeline.
2. **Build image** – builds the Docker image and pushes it to ECR tagged with the commit SHA.
3. **Deploy to EC2** – connects over SSH, runs `scripts/deploy.sh` to pull that image and replace the container, waits for the container to answer `/health`, then checks `/health` on the public URL.

Repository secrets: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (the push-only pipeline user from the Terraform outputs), `EC2_SSH_KEY` (the private deploy key) and `EC2_HOST` (the Elastic IP).

Both required behaviours are visible in the Actions history:

- commit `064d78f` changed the API and went live with no manual step; `/health` reports the deployed commit in `version`
- commit `9f5df79` contained a deliberately failing test: the Test job failed, Build and Deploy were skipped, and the live version did not change

## Assumptions and trade-offs

- **In-memory store.** Tasks live in process memory behind an abstract `TasksRepository` with async methods. Data is lost on every deploy or restart. Swapping in PostgreSQL means adding one class and changing one line in `TasksModule`.
- **Validation.** Titles are trimmed, so a whitespace-only title is rejected. I added a 200 character limit. Unknown body fields are stripped.
- **`version` in `/health`.** Added on top of the suggested shape so the running build can be identified from the outside.
- **Jest on an ESM project.** NestJS 12 is ESM-only and its CLI scaffolds Vitest. The brief asks for Jest, so tests run on Jest with `--experimental-vm-modules`, which is Jest's supported way to run native ES modules.
- **HTTP only.** There is no domain, so there is no TLS certificate. With a domain I would terminate TLS at a load balancer or CloudFront.
- **SSH open to the internet.** GitHub-hosted runners have no fixed IP range. Access is key-only. I would replace SSH with SSM Run Command and close port 22.
- **Long-lived pipeline credentials.** The brief asks for AWS credentials in CI secrets, so the pipeline uses an access key scoped to pushing one repository. I would move to GitHub OIDC with a short-lived role.
- **Local Terraform state.** Fine for one person. A team needs an S3 backend with locking.
- **One manual step.** The AWS account and the first administrator access key were created by hand, because Terraform needs credentials to start. Everything else is in code.
- **Region.** `eu-north-1`, because the AWS Free plan account is restricted to its home region.
- **Deploys cause a few seconds of downtime** while the container is replaced. Acceptable here, addressed in the scalability section.

### Not done

- Frontend tests. The brief makes them optional; the API has the required coverage.
- Persistence, TLS, zero-downtime deploys and remote Terraform state, for the reasons above.

## System Architecture

### Scalability: traffic grows 10x tomorrow

In order, starting with what breaks first in this design:

1. **Move state out of the process.** The in-memory array is the real blocker: a second instance would have its own list of tasks. I would implement `TasksRepository` on PostgreSQL (RDS, Multi-AZ) with a connection pool. The interface already exists, so the service, controller and tests stay as they are.
2. **Run more than one instance behind a load balancer.** Node handles requests on one thread, so the answer to more traffic is more processes. I would move the same image to ECS on Fargate behind an Application Load Balancer across two availability zones, with target-tracking autoscaling on CPU and request count. `GET /health` is already the health check the load balancer needs. This also removes the single point of failure and gives rolling deploys with no downtime.
3. **Take static files off the API.** The frontend is already a static export, so it can move to S3 behind CloudFront unchanged. The API then only serves JSON.
4. **Bound the expensive endpoint.** `GET /tasks` returns everything. With real data it needs cursor pagination and an index on `createdAt`.
5. **Protect the service.** Rate limiting at the load balancer or with `@nestjs/throttler`, and request timeouts.
6. **Cache only if measurements ask for it.** If reads dominate, a short-lived cache for the task list in Redis or at the CDN.

A `t3.micro` is also a burstable instance: sustained 10x load would drain its CPU credits, which is another reason step 2 comes early.

### Observability

- **Logs.** The request middleware already logs method, path, status and duration for every request. In production I would switch the logger to JSON output, add a request id, and ship container output to CloudWatch Logs with Docker's `awslogs` driver, which needs no agent. CloudWatch Logs Insights can then answer questions such as error rate per route or slowest endpoints.
- **Metrics.** Request rate, error rate and latency percentiles per route, through OpenTelemetry or `prom-client`, plus host metrics from the CloudWatch agent: CPU, memory, disk, and CPU credit balance on a burstable instance. Once there is a load balancer, its request count, 5xx count and target response time come for free.
- **Alerts.** CloudWatch alarms on 5xx rate, p95 latency, failed health checks and low CPU credits, routed through SNS to chat or a pager. An external uptime check on `/health` covers the case where the whole instance is unreachable.
- **Error tracking.** Sentry in the API and the frontend, with the release set to the commit SHA. The image already carries that SHA as `APP_VERSION` and exposes it in `/health`, so an error can be tied to the exact deploy.
- **Tracing.** Not needed for one service. With a database and more services I would add OpenTelemetry traces so a slow request can be followed across them.

### AI utilization

I used Claude Code throughout: scaffolding the NestJS and Next.js projects, writing the first version of the tests, the Dockerfile, the Terraform configuration and the workflow, and drafting this README. I reviewed each step before committing, ran it locally, and decided the stack and the scope myself. The assistant's first proposal was Express with a Vite frontend; I chose NestJS and Next.js.

One instance where the output had to be corrected: the infrastructure was planned for `eu-central-1`, a reasonable default that turned out to be wrong for this account. An AWS Free plan account is locked to its home region by an organization-level policy, and every call to another region returns an explicit deny. This surfaced on a dry run before anything was created, and the region was changed to `eu-north-1` in the Terraform variables and the pipeline. The lesson I took from it is to run `terraform plan` against the real account before trusting generated infrastructure code, because the code was valid and still could not have been applied.

A second, smaller one: the generated Jest configuration counted the test files themselves towards coverage, which made the 80% threshold fail on a project whose source was fully covered. Excluding spec files, the entry point and module wiring from `collectCoverageFrom` fixed the measurement.
