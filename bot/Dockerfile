FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc index.ts --esModuleInterop --skipLibCheck --outDir dist || true
CMD ["node", "-e", "require('dotenv').config(); require('./index.ts')"]
