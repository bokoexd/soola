FROM node:18-alpine as build

WORKDIR /app

# First copy only package files to leverage Docker cache for npm install
COPY package*.json ./

# Install dependencies with modern flags to avoid warnings
RUN npm install --no-fund --no-audit

# Now copy the rest of the files
COPY . .

# Create fonts directory structure to avoid build errors
RUN mkdir -p public/fonts src/fonts

# Build with CI=true and additional flags to avoid build failing on type errors
# Add NODE_OPTIONS to increase memory limit and avoid heap out of memory errors
RUN NODE_OPTIONS="--max_old_space_size=4096" CI=true GENERATE_SOURCEMAP=false npm run build

# Use nginx for serving static files in production
FROM nginx:alpine

# Install curl for health check
RUN apk --no-cache add curl

# Copy built files from previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Create a proper nginx config file
RUN rm /etc/nginx/conf.d/default.conf
# Create new config file with proper line endings and syntax
RUN printf "server {\n\
    listen 80;\n\
    listen [::]:80;\n\
    server_name _;\n\
    \n\
    # Improve logging for troubleshooting\n\
    access_log /var/log/nginx/access.log;\n\
    error_log /var/log/nginx/error.log warn;\n\
    \n\
    # Increase buffer size for large headers\n\
    large_client_header_buffers 4 32k;\n\
    \n\
    # Set reasonable timeouts\n\
    client_body_timeout 12;\n\
    client_header_timeout 12;\n\
    keepalive_timeout 15;\n\
    send_timeout 10;\n\
    \n\
    # Root and index settings\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    \n\
    # Handle static assets with appropriate cache control\n\
    location ~* \\.(?:css|js)$ {\n\
        expires 1y;\n\
        add_header Cache-Control \"public\";\n\
        access_log off;\n\
    }\n\
    \n\
    # Handle images, icons, etc with appropriate cache control\n\
    location ~* \\.(?:jpg|jpeg|gif|png|ico|svg)$ {\n\
        expires 1y;\n\
        add_header Cache-Control \"public\";\n\
        access_log off;\n\
    }\n\
    \n\
    # Handle SPA routing\n\
    location / {\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\
    \n\
    # Simple status page for health checks\n\
    location = /health {\n\
        access_log off;\n\
        add_header Content-Type text/plain;\n\
        return 200 'OK';\n\
    }\n\
    \n\
    # Handle 404 errors\n\
    error_page 404 /index.html;\n\
}\n" > /etc/nginx/conf.d/default.conf

# Make sure the config is valid
RUN nginx -t

# Create a health check script
RUN echo '#!/bin/sh\n\
set -e\n\
curl -f http://localhost/health || exit 1\n\
' > /healthcheck.sh && chmod +x /healthcheck.sh

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD /healthcheck.sh

EXPOSE 80

# Start nginx with daemon off to keep container running
CMD ["nginx", "-g", "daemon off;"]