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
RUN NODE_OPTIONS="--max_old_space_size=4096" CI=true npm run build



# Production stage
FROM nginx:alpine

# Copy built files from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create a proper nginx config file
RUN rm /etc/nginx/conf.d/default.conf &&     echo 'server {     listen 80;     location / {         root /usr/share/nginx/html;         index index.html;         try_files $uri $uri/ /index.html;     } }' > /etc/nginx/conf.d/default.confEXPOSE 80# Start nginxCMD ["nginx", "-g", "daemon off;"]