FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm i isomorphic-fetch

COPY . .

CMD [ "node", "app.js" ]
