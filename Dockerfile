FROM node:10.16.3-alpine

COPY ./bids-validator /src

RUN npm install -g /src

ENTRYPOINT ["/usr/local/bin/bids-validator"]
