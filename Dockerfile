# syntax=docker/dockerfile:1
FROM node:16-alpine

WORKDIR /postbud

COPY . .

RUN npm ci

CMD ["node", "index.js"]

EXPOSE 2526
