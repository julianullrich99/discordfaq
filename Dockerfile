FROM node:16
ENV TZ="Europe/Berlin"
WORKDIR /usr/src/app
COPY . .
RUN npm ci
CMD ["npm", "run", "start"]
