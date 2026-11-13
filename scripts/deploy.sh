#!/usr/bin/env bash
# Runs on the EC2 instance: pulls the given image and replaces the running container.
# If the new container does not become healthy, the previous image is started again.
set -euo pipefail

REPOSITORY="$1"
TAG="$2"
REGION="$3"
CONTAINER="task-manager"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE="${REGISTRY}/${REPOSITORY}:${TAG}"

start() {
  docker run --detach \
    --name "$CONTAINER" \
    --restart unless-stopped \
    --publish 80:3000 \
    --log-opt max-size=10m \
    --log-opt max-file=3 \
    "$1" >/dev/null
}

stop() {
  docker stop --time 10 "$CONTAINER" >/dev/null 2>&1 || true
  docker rm "$CONTAINER" >/dev/null 2>&1 || true
}

wait_until_healthy() {
  for _ in $(seq 1 30); do
    if curl --silent --fail http://127.0.0.1/health >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

aws ecr get-login-password --region "$REGION" |
  docker login --username AWS --password-stdin "$REGISTRY"

docker pull "$IMAGE"
PREVIOUS_IMAGE="$(docker inspect --format '{{.Image}}' "$CONTAINER" 2>/dev/null || true)"

stop
start "$IMAGE"

if wait_until_healthy; then
  echo "Deployed ${IMAGE}"
  docker image prune --all --force >/dev/null
  exit 0
fi

echo "New container did not become healthy:" >&2
docker logs --tail 50 "$CONTAINER" >&2 || true
stop

if [ -n "$PREVIOUS_IMAGE" ]; then
  echo "Rolling back to the previous image" >&2
  start "$PREVIOUS_IMAGE"
fi
exit 1
