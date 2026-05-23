FROM node:20-alpine

# Install openssl and libc6-compat for Prisma engine support in Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to Javascript
RUN npm run build

EXPOSE 5001

CMD ["node", "dist/index.js"]
