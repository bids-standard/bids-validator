FROM node:8.9.4-alpine

COPY . /src

RUN npm install -g /src

ENTRYPOINT ["/usr/local/bin/bids-validator"]
