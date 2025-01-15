FROM node:18.4-alpine

ADD . /app
RUN cd /app && yarn install
WORKDIR /app

EXPOSE 3000
CMD ["yarn", "start"]
