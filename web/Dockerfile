# syntax=docker/dockerfile:1.20

# Build the Vite SPA into static files, then serve them with unprivileged nginx.
# nginx also proxies `/api/*` to the backend so the httpOnly session cookie stays first-party,
# exactly like the Vite dev proxy in `vite.config.ts`.

ARG NODE_VERSION=24
ARG PNPM_VERSION=11.9.0
ARG NGINX_VERSION=1.27

FROM docker.io/library/node:${NODE_VERSION}-alpine AS build

ARG PNPM_VERSION
RUN npm install --global pnpm@${PNPM_VERSION}

WORKDIR /tmp/build

# Dependency layer, cached until the lockfile changes
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Defaults to `/api` (served by the nginx proxy below). Set it only when the API lives on another origin.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm build

FROM docker.io/nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS runtime

# Rendered with envsubst into /etc/nginx/conf.d/default.conf when the container starts
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /tmp/build/dist /usr/share/nginx/html

# Backend reachable from the container. In Kubernetes this is the backend Service.
ENV API_UPSTREAM=http://backend.smart-waste-backend.svc.cluster.local:8080
# Only substitute our own variable, never nginx's `$uri`, `$host`, ...
ENV NGINX_ENVSUBST_FILTER=^API_UPSTREAM$

EXPOSE 8080
