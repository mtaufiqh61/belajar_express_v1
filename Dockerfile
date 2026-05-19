FROM node:20

WORKDIR /app

# 1. copy dependency dulu
COPY package*.json ./

# 2. install (ini yang di-cache)
RUN npm ci

# 3. baru copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]