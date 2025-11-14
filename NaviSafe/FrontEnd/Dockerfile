FROM node:20-alpine
WORKDIR /app
COPY ["NaviSafe/FrontEnd/*", "."]
RUN npm install
COPY . .
EXPOSE 3000
RUN apk add xdg-utils
CMD ["npm", "run", "dev"]