FROM node:20-bullseye-slim

# Instala Chromium e dependências do sistema para o Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpangocairo-1.0-0 fonts-liberation \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Usa o Chromium do sistema ao invés do bundle do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 3001
CMD ["node", "zap2.js"]