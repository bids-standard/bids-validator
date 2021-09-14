FROM node:14-alpine

COPY ./bids-validator /src

RUN npm install -g npm
RUN npm install -g /src

ENTRYPOINT ["/usr/local/bin/bids-validator"]
