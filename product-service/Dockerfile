FROM node:18-alpine

WORKDIR /app

# Copy and install shared module
COPY shared/package.json ./shared/package.json
WORKDIR /app/shared
RUN npm install --production
COPY shared/ ./

# Copy and install product-service
WORKDIR /app/product-service
COPY product-service/package.json ./
RUN npm install --production
COPY product-service/ ./

EXPOSE 3005

CMD ["node", "src/server.js"]
