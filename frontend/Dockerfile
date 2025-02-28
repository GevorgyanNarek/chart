# Build stage
FROM node:18-alpine AS build-stage
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./ 
RUN npm ci  # Faster and more reliable than npm install

# Copy all files and build the project
COPY . .  
RUN npm run build

# Production stage
FROM nginx:alpine AS production-stage

# Copy SSL certificates (from certs folder)
#COPY ../certs /etc/nginx/ssl

# Copy built app files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose both HTTP and HTTPS ports
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]


















# # Build stage
# FROM node:18-alpine AS build-stage
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .  
# RUN npm run build

# # Production stage
# FROM nginx:alpine AS production-stage
# # Copy nginx configuration
# COPY nginx/nginx.conf /etc/nginx/nginx.conf
# # Copy built app files
# COPY --from=build-stage /app/dist /usr/share/nginx/html

# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
