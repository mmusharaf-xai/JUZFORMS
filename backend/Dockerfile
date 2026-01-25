FROM node:18-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma client
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 5000

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
