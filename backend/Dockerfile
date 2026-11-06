FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/public/uploads

EXPOSE 5001

CMD ["node", "server.js"]
