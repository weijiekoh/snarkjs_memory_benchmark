FROM node:22-bookworm-slim

WORKDIR /sb

#RUN apt -y update && \
    #apt -y install python3 build-essential && \
    #apt -y clean

COPY ./package.json /sb/package.json

RUN npm install

COPY ./web /sb/web
COPY ./build /sb/build

RUN cd web && \
    npm install

EXPOSE 1234

#CMD ["sleep", "infinity"]
WORKDIR /sb/web
ENV NODE_ENV=production
CMD ["npm", "run", "serve"]
