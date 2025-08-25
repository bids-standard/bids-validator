ARG BASE_IMAGE=denoland/deno:alpine-2.4.5
FROM ${BASE_IMAGE} AS build
WORKDIR /src

RUN apk add --no-cache git jq

ADD . .
RUN export VERSION=`git -C . -c safe.directory=* describe --tags --always` && \
    jq -r ".version|=\"$VERSION\"" deno.json > ._deno.json && \
    mv ._deno.json deno.json

RUN deno run -A ./build.ts

FROM ${BASE_IMAGE} AS min
WORKDIR /src
COPY --from=build /src/dist/validator/bids-validator.js .

ENTRYPOINT ["deno", "-A", "./bids-validator.js"]
