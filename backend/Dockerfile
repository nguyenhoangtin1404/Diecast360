# Base stage
FROM node:20-alpine AS base

# Development stage
FROM base AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run prisma:generate
CMD ["npm", "run", "start:dev"]

# Build stage
FROM base AS build
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

# Production stage
FROM base AS production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
CMD ["node", "dist/main"]
