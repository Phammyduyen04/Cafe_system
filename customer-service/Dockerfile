FROM node:18-alpine

WORKDIR /app

# Copy and install shared module
COPY shared/package.json ./shared/package.json
WORKDIR /app/shared
RUN npm install --production
COPY shared/ ./

# Copy and install customer-service
WORKDIR /app/customer-service
COPY customer-service/package.json ./
RUN npm install
COPY customer-service/ ./

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3002

CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node src/server.js"]
