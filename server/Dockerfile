FROM node:16-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies (using npm install instead of npm ci)
RUN npm install

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Install TypeScript explicitly if needed
RUN npm install typescript

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/index.js"]
# Command to run the application
CMD ["node", "dist/index.js"]
