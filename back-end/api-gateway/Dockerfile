FROM node:18-alpine

WORKDIR /app

# Copy and install shared module
COPY shared/package.json ./shared/package.json
WORKDIR /app/shared
RUN npm install --production
COPY shared/ ./

# Copy and install api-gateway
WORKDIR /app/api-gateway
COPY api-gateway/package.json ./
RUN npm install --production
COPY api-gateway/ ./

EXPOSE 3000

CMD ["node", "src/server.js"]
