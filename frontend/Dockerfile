FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# 3) Install lucide-react
RUN npm install --save lucide-react

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
