FROM node:16-alpine

# Set working directory
WORKDIR /app

# First, copy only package.json files to leverage Docker cache
COPY package*.json ./

# Install production dependencies only
RUN npm install --production=false --no-optional

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Start the server using the compiled JavaScript
CMD ["node", "dist/index.js"]
