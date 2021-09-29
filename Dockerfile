FROM node:14-alpine

COPY . /src

RUN npm install -g npm
WORKDIR /src
RUN npm install 
RUN npm -w bids-validator run build
RUN npm -w bids-validator pack
RUN npm install -g bids-validator-*.tgz

ENTRYPOINT ["/usr/local/bin/bids-validator"]
