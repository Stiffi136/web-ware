FROM oven/bun:1-alpine
WORKDIR /app/server
COPY server/package.json server/bun.lock ./
RUN bun install --production
COPY server/src ./src
ENV NODE_ENV=production
EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]
