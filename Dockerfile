FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with legacy-peer-deps to handle winston/logtail conflicts
RUN npm install --legacy-peer-deps --frozen-lockfile --production=false

# Copy source code
COPY . .

# Create .next directory and install curl
RUN mkdir -p .next && chown -R node:node .next
RUN apk add --no-cache curl

# Switch to non-root user
USER node

# Expose port
EXPOSE 3003

# Start the application
CMD ["npm", "run", "dev"]