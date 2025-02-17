FROM ubuntu:latest
WORKDIR /project
COPY ./packages/indexer/target/release/indexer ./indexer
COPY ./packages/indexer/.env ./indexer
COPY ./packages/indexer/credentials ~/.aws
CMD ["./indexer/indexer"]
