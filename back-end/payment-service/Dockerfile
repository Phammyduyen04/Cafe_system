FROM node:18-alpine

WORKDIR /app

# Copy and install shared module
COPY shared/package.json ./shared/package.json
WORKDIR /app/shared
RUN npm install --production
COPY shared/ ./

# Copy and install payment-service
WORKDIR /app/payment-service
COPY payment-service/package.json ./
RUN npm install
COPY payment-service/ ./

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3004

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
