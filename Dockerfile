FROM node:14-alpine

COPY . /src

RUN npm install -g npm
WORKDIR /src
RUN npm install 
RUN npm install -g ./bids-validator

ENTRYPOINT ["/usr/local/bin/bids-validator"]
