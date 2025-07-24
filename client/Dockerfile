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

# Create a proper nginx config file rather than using echo
RUN rm /etc/nginx/conf.d/default.conf
# Create new config file with proper line endings and syntax
RUN printf "server {\n\
    listen 80;\n\
    listen [::]:80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\
}\n" > /etc/nginx/conf.d/default.conf

# Make sure the config is valid
RUN nginx -t

EXPOSE 80

# Start nginx with daemon off to keep container running
CMD ["nginx", "-g", "daemon off;"]