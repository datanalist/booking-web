FROM node:24.13.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_* вшиваются в бандл при сборке. Секретов здесь быть не должно.
ARG VITE_DATA_SOURCE=pocketbase
ARG VITE_POCKETBASE_URL=https://pb.booking.vallome.ru
ARG VITE_TELEGRAM_BOT_ID=9158776426
ENV VITE_DATA_SOURCE=$VITE_DATA_SOURCE VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL VITE_TELEGRAM_BOT_ID=$VITE_TELEGRAM_BOT_ID
RUN npm run build

FROM node:24.13.0-alpine
ENV NODE_ENV=production PORT=8080 DIST_DIR=/app/dist DATA_DIR=/app/data
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server ./server
COPY vite ./vite
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server/server.ts"]
