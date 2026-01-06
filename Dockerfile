# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production environment
FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY . .

# Install only production dependencies
RUN npm install --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy the PM2 configuration file for Docker
COPY pm2.docker.json .

# Copy assets
#COPY assets ./assets

# Expose the port the application runs on (default NestJS port is 3000)
EXPOSE 2026

# Command to run the application using pm2-runtime
CMD ["npx", "pm2-runtime", "start", "pm2.docker.json"]
