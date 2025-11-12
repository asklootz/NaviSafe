FROM node:20 AS build
#AS build
WORKDIR /app

COPY ["NaviSafe/FrontEnd/*", "."]
#COPY ["NaviSafe/FrontEnd/package-lock.json", "."]
#RUN pwd
#RUN ls -a

RUN npm install -g typescript

RUN npm install

#RUN npm i -g http-server

#RUN npm i -g serve

#COPY . .

EXPOSE 5173
EXPOSE 3000

#RUN cd /app/NaviSafe/FrontEnd/

RUN npm run build

#RUN npm run dev

#CMD ["http-server", "dev", "-p", "3000"]

#CMD ["npm", "run", "dev"]
#CMD ["serve", "-s", "dev","-p", "3000"]
#CMD ["node", "server.js"]

FROM nginx:alpine
COPY --from=build ["**/app/default.conf.template", "/etc/nginx/templates/default.conf.template"]
COPY --from=build ["**/app/dist", "/usr/share/nginx/html"]

# Expose the default nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]