FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --production && npm cache clean --force

COPY src ./src

RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001 -G nodejs
USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/index.js"]
