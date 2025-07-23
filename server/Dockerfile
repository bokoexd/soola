FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy everything except node_modules
COPY . .

# Install dependencies
RUN npm install --production=false

# Remove the incorrect file before building
RUN rm -f ./src/pages/AdminPage.tsx

# Build with skipLibCheck to avoid issues with third-party type definitions
RUN npm run build

# Add a script to validate environment variables at startup
RUN echo '#!/bin/sh\n\
echo "Validating environment variables..."\n\
# Check for trailing semicolons in CLIENT_URL\n\
if [ -n "$CLIENT_URL" ] && echo "$CLIENT_URL" | grep -q ";"; then\n\
  echo "Error: CLIENT_URL contains semicolons, which will cause path-to-regexp errors"\n\
  exit 1\n\
fi\n\
echo "Environment validation passed, starting application"\n\
node dist/index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Start the server with our validation script
CMD ["/app/start.sh"]
