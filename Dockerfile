# Dockerfile

# Development stage
FROM node:20 AS development

WORKDIR /usr/src/app

RUN npm install -g nodemon

COPY package*.json ./
COPY tailwind.config.js ./

RUN npm install

COPY . .

# Expose development port
EXPOSE 3000

# Development command with nodemon
CMD ["npm", "run", "docker:dev"]

# Production stage
FROM node:20-slim AS production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY --from=development /usr/src/app/src ./src
COPY --from=development /usr/src/app/node_modules ./node_modules

# Expose production port
EXPOSE 3010

# Production command
CMD ["npm", "start"]


