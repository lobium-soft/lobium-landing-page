FROM --platform=linux/amd64 node:22-alpine

# Install Python 3 and other dependencies
RUN apk add --no-cache python3 py3-pip make g++

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package.json ./
RUN yarn install

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Command to run the application with basic auth
CMD ["yarn", "start:prod"]
