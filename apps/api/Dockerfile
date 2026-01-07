# Production stage
FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/

# Install dependencies (production only)
RUN bun install --frozen-lockfile --production

# Copy source code
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start application
WORKDIR /app/apps/api
CMD ["bun", "run", "start"]
