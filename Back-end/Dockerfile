# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Install PostgreSQL client for debugging (optional)
RUN apk add --no-cache postgresql-client

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install --production

# Bundle app source
COPY . .

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/users', (r) => {process.exit(r.statusCode === 401 ? 0 : 1)})"

# Define the command to run your app
CMD [ "node", "index.js" ]