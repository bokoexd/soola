# Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --force

# Copy project files
COPY . .

# Create fonts directory structure to avoid build errors
RUN mkdir -p src/fonts

# Build with appropriate error handling
RUN NODE_OPTIONS="--max_old_space_size=4096" CI=true SKIP_PREFLIGHT_CHECK=true DISABLE_ESLINT_PLUGIN=true npm run build ||     (echo "Build encountered errors but continuing..." &&      NODE_OPTIONS="--max_old_space_size=4096" CI=true GENERATE_SOURCEMAP=false SKIP_PREFLIGHT_CHECK=true npm run build)

# List contents of build directory for debugging
RUN ls -la /app/build

# Production stage
FROM nginx:alpine

# Install tools for debugging
RUN apk --no-cache add curl

# Copy built files from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create a proper nginx config file
RUN echo 'server {     listen 80;     location {         root /usr/share/nginx/html;         index index.html;         try_files $uri $uri/ /index.html;     } }' > /etc/nginx/conf.d/default.confEXPOSE 80# Start nginxCMD ["nginx", "-g", "daemon off;"]