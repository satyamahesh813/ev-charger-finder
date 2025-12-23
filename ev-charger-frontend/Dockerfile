FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache gettext
# Serve built SPA
COPY --from=build /app/dist /usr/share/nginx/html
# Put your nginx template where we'll envsubst it from
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
# Generate runtime config from template with BACKEND_URL and run Nginx
CMD ["/bin/sh", "-c", "envsubst '$BACKEND_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && cp /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]