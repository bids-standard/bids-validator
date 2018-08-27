FROM node:8.11.3-alpine

COPY . /src

RUN npm install -g /src

ENTRYPOINT ["/usr/local/bin/bids-validator"]
