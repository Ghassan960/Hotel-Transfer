FROM node:20-alpine

WORKDIR /app

# Copy package.json files first for caching
COPY package.json ./
COPY server/package.json server/
COPY client/package.json client/

# Install dependencies
RUN npm install --prefix server
RUN npm install --prefix client

# Copy all other source code
COPY . .

# Build the React client
RUN npm run build --prefix client

# Expose port (Cloud Run passes PORT=8080)
ENV PORT=8080
EXPOSE 8080

# Start the Node.js server
CMD ["npm", "start", "--prefix", "server"]
