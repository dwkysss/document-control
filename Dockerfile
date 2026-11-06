# ==============================================================================
# Multi-Stage Dockerfile for ISO 9001 Document Control System (Frontend)
# ==============================================================================

# Stage 1: Build the Vite production bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source code
COPY . .

# Build Vite application (Self-hosted backend API)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Production runtime with lightweight Nginx
FROM nginx:alpine

# Copy built artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create upload mount target
RUN mkdir -p /usr/share/nginx/html/uploads

# Expose port 80 inside container
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
