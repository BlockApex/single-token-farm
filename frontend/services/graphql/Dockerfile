FROM node:18.9.1
WORKDIR /project
COPY ./packages/apollo ./packages/apollo
COPY ./packages/graphql ./packages/graphql
COPY ./packages/web ./packages/web
COPY ./packages/ts ./packages/ts
COPY ./package.json ./package.json
COPY ./tsconfig.json ./tsconfig.json
COPY ./yarn.lock ./yarn.lock
RUN yarn
EXPOSE 80
CMD ["yarn", "gql:start"]
