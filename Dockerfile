ARG BASE_IMAGE=denoland/deno:2.0.1
FROM ${BASE_IMAGE} AS build
WORKDIR /src

RUN apt-get update && \
    apt-get install -y git jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ADD . .
RUN export VERSION=`git -C . -c safe.directory=* describe --tags --always` && \
    jq -r ".version|=\"$VERSION\"" bids-validator/deno.json > ._deno.json

WORKDIR /src/bids-validator
RUN deno cache ./bids-validator-deno
RUN ./build.ts

FROM ${BASE_IMAGE} AS base
WORKDIR /src
COPY . .
COPY --from=build /src/._deno.json /src/bids-validator/deno.json
WORKDIR /src/bids-validator
RUN deno cache ./bids-validator-deno
ENTRYPOINT ["./bids-validator-deno"]

FROM ${BASE_IMAGE} AS min
WORKDIR /src
COPY --from=build /src/bids-validator/dist/validator/* .

ENTRYPOINT ["deno", "-A", "./bids-validator.js"]
