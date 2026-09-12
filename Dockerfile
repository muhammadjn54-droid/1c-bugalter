FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install
RUN cd server && npm install
RUN cd client && npm install

COPY . .

RUN cd server && npm run build
RUN cd client && npm run build

WORKDIR /app/server

EXPOSE 5000

CMD ["node", "dist/index.js"]
