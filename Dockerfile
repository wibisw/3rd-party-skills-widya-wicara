# Create node image
FROM node:12.13.0-alpine

# Create app directory
WORKDIR /app

# Copy file to /app directory
COPY . /app

RUN mkdir /app/cache

# Install app dependencies to compile typescript
RUN npm install -g typescript
RUN npm install

# compile typescript
RUN sh -c tsc -p .

# Remove dev dependencies
RUN npm -g uninstall typescript
RUN npm prune --production --silent

# Remove unused file/folder
RUN rm -rf src
RUN rm tsconfig.json
RUN rm tsconfig.tsbuildinfo
RUN rm Dockerfile
RUN rm .dockerignore

# Set ENV
ENV NODE_ENV=production

# Add bash
RUN apk add --no-cache bash

# Expose port
EXPOSE 5000

# run node dist/server.js
CMD [ "node", "dist/server.js" ]