FROM node:18.9.1
WORKDIR /project
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
COPY ./packages/db ./packages/db
COPY ./packages/indexer-ts ./packages/indexer-ts
RUN yarn
RUN yarn workspace @near/indexer-ts compile
EXPOSE 80
CMD ["yarn", "workspace", "@near/indexer-ts", "entry"]