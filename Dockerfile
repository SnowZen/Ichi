# Use the official Node.js 18 runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package*.json files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the entire project
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]
