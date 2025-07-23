FROM node:16-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Install dependencies with production flag to avoid dev dependencies
RUN npm ci --only=production

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Move typescript from devDependencies to dependencies
RUN npm install typescript

# Build the project
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/index.js"]
