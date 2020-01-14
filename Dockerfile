FROM node:12.14.1-alpine

COPY ./bids-validator /src

RUN npm install -g /src

ENTRYPOINT ["/usr/local/bin/bids-validator"]
