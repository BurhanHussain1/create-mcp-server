# Dockerfile for hosting MCP Studio (the visual builder web app).
#
#   docker build -t mcp-studio .
#   docker run -p 4321:4321 mcp-studio
#
# On a PaaS (Render/Railway/Fly), the platform sets PORT and the studio binds
# to it automatically.

# --- Build stage: compile TypeScript to JavaScript ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Run stage: only what the studio needs at runtime ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
# The compiled CLI plus the assets the studio reads at runtime.
COPY --from=build /app/dist ./dist
COPY templates ./templates
COPY public ./public
COPY examples ./examples

EXPOSE 4321
CMD ["node", "dist/index.js", "studio"]
