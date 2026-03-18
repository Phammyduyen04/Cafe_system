FROM node:18-alpine

WORKDIR /app

# Copy and install shared module
COPY shared/package.json ./shared/package.json
WORKDIR /app/shared
RUN npm install --production
COPY shared/ ./

# Copy and install promotion-service
WORKDIR /app/promotion-service
COPY promotion-service/package.json ./
RUN npm install --production
COPY promotion-service/ ./

EXPOSE 3006

CMD ["node", "src/server.js"]
