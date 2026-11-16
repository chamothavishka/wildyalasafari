# Wild Yala Safari — one container serves the website (dist/) and the API.
#   docker build -t wild-yala-safari .
#   docker run -p 4000:4000 --env-file .env wild-yala-safari

# ---- 1) build the website
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- 2) runtime: only production dependencies, the built site and the server
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
# the server reuses the website's own pricing / currency / content modules so prices can never disagree
COPY src/lib/pricing.js src/lib/currency.js ./src/lib/
COPY src/data/content.js ./src/data/
RUN rm -rf server/test
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:${PORT:-4000}/api/health || exit 1
CMD ["node", "server/index.js"]
