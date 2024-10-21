ARG BASE_IMAGE=denoland/deno:2.0.1
FROM ${BASE_IMAGE} AS base
WORKDIR /src

RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . .
RUN deno cache ./bids-validator-deno
RUN ./build.ts

ENTRYPOINT ["./bids-validator-deno"]

FROM ${BASE_IMAGE} AS min
WORKDIR /src
COPY --from=base /src/dist/validator/* .

ENTRYPOINT ["deno", "-A", "./bids-validator.js"]
