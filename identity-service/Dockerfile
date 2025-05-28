#  Dockerfile for API Gateway
FROM node:24-alpine20

WORKDIR /user/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]