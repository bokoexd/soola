FROM node:16-alpine

# Set working directory
WORKDIR /app

# Update npm to the latest version
RUN npm install -g npm@11.4.2

# Copy everything except node_modules
COPY . .

# Install dependencies
RUN npm install --production=false

# Remove the incorrect file before building
RUN rm -f ./src/pages/AdminPage.tsx

# Build with skipLibCheck to avoid issues with third-party type definitions
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"]
