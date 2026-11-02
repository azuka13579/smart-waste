# syntax=docker/dockerfile:1.20

# Not `bun build --compile` like erp-backend: sharp and onnxruntime-node load native .node
# addons at runtime, which a single-file binary cannot embed. Instead the app is bundled to
# JS (resolving the "@/*" aliases) and only those two packages come from node_modules.

ARG BUN_VERSION=1.3.14

FROM docker.io/oven/bun:${BUN_VERSION} AS build

WORKDIR /tmp/build

# Dependency layer, cached until package files change. --ignore-scripts skips `lefthook install`.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN bun build src/index.ts \
    --target bun \
    --outdir dist \
    --sourcemap=linked \
    --external sharp \
    --external onnxruntime-node

# Production node_modules only (sharp, onnxruntime-node and their prebuilt binaries)
FROM docker.io/oven/bun:${BUN_VERSION} AS deps

WORKDIR /tmp/deps

COPY package.json bun.lock ./
# onnxruntime-node ships prebuilt binaries for every OS (~290 MB); keep only Linux
RUN bun install --frozen-lockfile --production --ignore-scripts \
    && rm -rf node_modules/onnxruntime-node/bin/napi-v6/darwin node_modules/onnxruntime-node/bin/napi-v6/win32

FROM docker.io/oven/bun:${BUN_VERSION}-slim AS runtime

WORKDIR /usr/local/lib/smart-waste-backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    tini \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /tmp/deps/node_modules ./node_modules
COPY --from=build /tmp/build/dist ./dist
COPY package.json ./package.json
# Read from the working directory at runtime: migrations and the ONNX model
COPY drizzle ./drizzle
COPY models ./models

# Writable only for STORAGE_DRIVER=local; use R2 (STORAGE_DRIVER=s3) in Kubernetes
RUN mkdir -p uploads && chown bun:bun uploads

USER bun

ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080
ENV TZ=Asia/Jakarta

EXPOSE 8080

ENTRYPOINT ["tini", "--"]
CMD ["bun", "run", "dist/index.js"]
