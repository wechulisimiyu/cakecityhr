# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="AdonisJS"

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

WORKDIR /app

# Build stage - similar to your local process
FROM base AS build

# Copy package files
COPY package*.json ./
RUN npm ci --include=dev

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage - replicating your local cd build && npm ci --omit=dev process
FROM base

WORKDIR /app

# Copy only the build directory and package files
COPY --from=build /app/build ./build
COPY package*.json ./

# Install production dependencies inside build directory
WORKDIR /app/build
RUN npm ci --omit=dev

# Set production environment variables
ENV HOST="0.0.0.0" \
    PORT="3333" \
    NODE_ENV="production"

EXPOSE 3333

# Start the server from the correct location
CMD ["node", "bin/server.js"]