#!/usr/bin/env bash
# Runs on the EC2 instance: pulls the given image and replaces the running container.
set -euo pipefail

REPOSITORY="$1"
TAG="$2"
REGION="$3"
CONTAINER="task-manager"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE="${REGISTRY}/${REPOSITORY}:${TAG}"

aws ecr get-login-password --region "$REGION" |
  docker login --username AWS --password-stdin "$REGISTRY"

docker pull "$IMAGE"
docker rm --force "$CONTAINER" 2>/dev/null || true
docker run --detach \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --publish 80:3000 \
  "$IMAGE"

for attempt in $(seq 1 30); do
  if curl --silent --fail http://127.0.0.1/health >/dev/null; then
    echo "Container is healthy after ${attempt}s"
    docker image prune --all --force >/dev/null
    exit 0
  fi
  sleep 1
done

echo "Container did not become healthy" >&2
docker logs --tail 50 "$CONTAINER" >&2
exit 1
