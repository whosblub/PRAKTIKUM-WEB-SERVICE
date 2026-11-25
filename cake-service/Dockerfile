FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# lapisan ini di-cache selama package*.json tidak berubah
RUN npm ci --omit=dev
COPY . .
# jangan jalankan sebagai root
USER node
EXPOSE 4000
CMD ["node", "cake-service.js"]
