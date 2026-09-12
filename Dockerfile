FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV UTILITY_API_HOST=0.0.0.0
ENV UTILITY_API_PORT=3010

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3010

CMD ["node", "dist/utility-rest.main.js"]
