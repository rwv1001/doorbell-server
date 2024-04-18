FROM balenalib/raspberrypi4-64-debian-node:latest
WORKDIR /app
COPY package.json .
RUN npm install
COPY . ./

EXPOSE 3500
CMD ["npm", "start"]
