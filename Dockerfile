FROM node:18-alpine as build
RUN npm install -g npm

COPY . /src
WORKDIR /src

RUN npm install 
RUN npm -w bids-validator run build
RUN npm -w bids-validator pack

FROM node:18-alpine

COPY --from=build /src/bids-validator-*.tgz /tmp
RUN npm install -g /tmp/bids-validator-*.tgz

ENTRYPOINT ["/usr/local/bin/bids-validator"]
