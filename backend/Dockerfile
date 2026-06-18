# Kodikz GPS Backend — production image
FROM node:20-alpine AS base

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

ENV NODE_ENV=production
EXPOSE 5000 3000

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
