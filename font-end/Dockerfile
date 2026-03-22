FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --include=dev --legacy-peer-deps && npm install react@18.3.1 react-dom@18.3.1

COPY . .

EXPOSE 5173

CMD ["./node_modules/.bin/vite", "--host"]
