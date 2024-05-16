# Use an official Node.js image as the base
FROM node:latest
RUN apt-get update
RUN wget https://github.com/joan2937/pigpio/archive/master.zip
RUN unzip master.zip
WORKDIR /pigpio-master
RUN make
RUN make install
WORKDIR /
RUN mkdir /app
# Set the working directory inside the container
WORKDIR /app

COPY package.json /app/package.json

RUN npm install

COPY . .

RUN apt-get install -y python3-full python3-pip

RUN apt install -y pipx

RUN pipx install gTTS

RUN . /root/.local/pipx/venvs/gtts/bin/activate


# Expose port 3500 (you can choose a different port if needed)
EXPOSE 3500

CMD ["node", "index.js"]
