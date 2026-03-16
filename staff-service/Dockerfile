FROM node:18-alpine

WORKDIR /app

# Copy and install shared module
COPY shared/package.json ./shared/package.json
WORKDIR /app/shared
RUN npm install --production
COPY shared/ ./

# Copy and install staff-service
WORKDIR /app/staff-service
COPY staff-service/package.json ./
RUN npm install --production
COPY staff-service/ ./

EXPOSE 3007

CMD ["node", "src/server.js"]
