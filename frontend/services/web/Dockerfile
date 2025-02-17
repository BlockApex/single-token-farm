FROM node:18.9.1
WORKDIR /project
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
COPY ./packages/web ./packages/web
COPY ./packages/apollo ./packages/apollo
COPY ./packages/graphql ./packages/graphql
COPY ./packages/ts ./packages/ts
RUN yarn
EXPOSE 3000
CMD ["yarn", "web:dev", "--", "--host"]