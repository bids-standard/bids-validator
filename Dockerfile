ARG BASE_IMAGE=denoland/deno:2.4.5
FROM ${BASE_IMAGE} AS build
WORKDIR /src

RUN apt-get update && \
    apt-get install -y git jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ADD . .
RUN export VERSION=`git -C . -c safe.directory=* describe --tags --always` && \
    jq -r ".version|=\"$VERSION\"" deno.json > ._deno.json && \
    mv ._deno.json deno.json

RUN ./build.ts

FROM ${BASE_IMAGE} AS min
WORKDIR /src
COPY --from=build /src/dist/validator/bids-validator.js .

ENTRYPOINT ["deno", "-A", "./bids-validator.js"]
