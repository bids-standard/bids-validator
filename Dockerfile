FROM node:8.11.3-alpine

COPY ./bids-validator /src

RUN npm install -g /src

ENTRYPOINT ["/usr/local/bin/bids-validator"]
