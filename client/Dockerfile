FROM node:16 as build

WORKDIR /app

# First copy only package files to leverage Docker cache for npm install
COPY package*.json ./
RUN npm install

# Now copy the rest of the files
COPY . .

# Create empty fonts directory to avoid build errors
RUN mkdir -p src/fonts

# Build with CI=true to avoid the build failing on warnings
RUN CI=true npm run build

# Use nginx for serving static files in production
FROM nginx:alpine

# Copy built files from previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]