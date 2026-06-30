FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src/ ./src/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
USER appuser

CMD ["node", "--import", "tsx/esm", "src/index.ts"]
