FROM oven/bun:1-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json bun.lockb* ./
RUN bun install

COPY . .
RUN bun run build

FROM caddy:2.7-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv/dist
WORKDIR /srv
