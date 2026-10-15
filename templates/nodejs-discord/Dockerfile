FROM node:20-alpine AS runner

# Create unprivileged application user
RUN addgroup -g 1001 zeubot && \
    adduser -D -u 1001 -G zeubot -h /app zeubot

WORKDIR /app

COPY package.json ./
RUN npm install --production --no-audit --no-fund

COPY src/ ./src/

# Set ownership and permissions
RUN chown -R zeubot:zeubot /app

USER 1001:1001
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
