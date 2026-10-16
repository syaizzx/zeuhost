FROM node:20-alpine AS runner

RUN addgroup -g 1001 zeubot && \
    adduser -D -u 1001 -G zeubot -h /app zeubot

WORKDIR /app

COPY package.json ./
RUN npm install --production --no-audit --no-fund

COPY src/ ./src/

# /app/data is the persistent volume mount point for session + config
RUN mkdir -p /app/data/session /app/data/config && \
    chown -R zeubot:zeubot /app

USER 1001:1001
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
