# --- Build stage: compile TypeScript to JavaScript ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Run stage: only what's needed to run the server ---
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

# Run as a remote (HTTP) server by default — suitable for hosted agents.
ENV MCP_TRANSPORT=http
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
