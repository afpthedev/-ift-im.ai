FROM node:16-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install --save lucide-react react-router-dom@6
COPY . .

# disable CRA opening a browser
ENV BROWSER=none

EXPOSE 3000
CMD ["npm", "start"]
