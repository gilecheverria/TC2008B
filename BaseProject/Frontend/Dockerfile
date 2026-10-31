ARG NODE_VERSION=25.1.0
# Select the node image
FROM node:${NODE_VERSION}-alpine AS build_image

WORKDIR /app/vite-app

COPY package.json ./

RUN npm install

# Copy source files into WORKDIR
COPY . .

# Explicitly indicate the port to be used
EXPOSE 5173

# Run the server
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
