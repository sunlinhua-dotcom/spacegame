# Static deployment for Zeabur / any container host.
# This is a pure HTML/CSS/JS game — three.js is loaded via CDN import map,
# so no npm install / no build step is needed.
FROM nginx:alpine

# Strip the default nginx page and copy the whole repo into the web root.
RUN rm -rf /usr/share/nginx/html/*
COPY . /usr/share/nginx/html/

# Custom config: serve index.html at /, set MIME for .wasm if needed,
# allow directory traversal for asset folders, gzip on.
RUN printf 'server {\n\
  listen 8080 default_server;\n\
  listen [::]:8080 default_server;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  gzip on;\n\
  gzip_types text/plain text/css application/json application/javascript text/javascript image/svg+xml;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
  # 1-day cache for static assets, no-cache for HTML\n\
  location ~* \\.(jpg|jpeg|png|webp|gif|svg|ico|wav|mp3|ogg|woff2?)$ { expires 1d; add_header Cache-Control "public"; }\n\
  location = /index.html { add_header Cache-Control "no-cache"; }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Zeabur convention: public domain maps to container port 8080
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
