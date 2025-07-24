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

# Copy built files from previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Create a custom nginx config with SPA routing support
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]