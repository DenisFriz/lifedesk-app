# Stage 1 — builder: install ALL deps and compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for layer-cache efficiency
COPY package.json package-lock.json ./

# Install every dependency (including devDependencies like tsc, tsc-alias, tsx)
RUN npm install --omit=optional

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript → dist/ (tsc then tsc-alias for path alias rewriting)
RUN npm run build

# Stage 2 — runner: lean production image, no dev toolchain
FROM node:20-alpine AS runner

# NODE_ENV drives Express optimisations (e.g. trust proxy, error detail)
ENV NODE_ENV=production

WORKDIR /app

# Copy manifests and install production deps ONLY
COPY package.json package-lock.json ./
RUN npm install --omit=dev --omit=optional

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Non-root user — Alpine ships with "node" (uid 1000) already created
USER node

EXPOSE 3001

# Exact start script from package.json: "node dist/index.js"
CMD ["node", "dist/index.js"]
