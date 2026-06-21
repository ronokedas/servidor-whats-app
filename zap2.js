// =====================================
// IMPORTAÇÕES
// =====================================
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

// =====================================
// CONFIGURAÇÃO DO SERVIDOR (API + SOCKET)
// =====================================
const app = express();
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});
app.use(bodyParser.json());

// Servir painel web estático
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

// =====================================
// CONFIGURAÇÃO DO WHATSAPP
// =====================================
let isClientReady = false;
let lastQrDataUrl = null;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "bot-secundario" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
    ],
  },
  authTimeoutMs: 120000,
});

// =====================================
// EVENTOS DO WHATSAPP
// =====================================
client.on("qr", async (qr) => {
  console.log("\n[BOT 2] 📲 QR Code recebido, aguardando escaneamento...");
  try {
    lastQrDataUrl = await QRCode.toDataURL(qr);
    io.emit("qr", lastQrDataUrl);
  } catch (err) {
    console.error("Erro ao gerar QR:", err);
  }
});

client.on("ready", () => {
  console.log("\n[BOT 2] ✅ WHATSAPP CONECTADO E PRONTO!");
  isClientReady = true;
  lastQrDataUrl = null;
  io.emit("ready");
});

client.on("auth_failure", (msg) => {
  console.error("\n[BOT 2] ❌ FALHA NA AUTENTICAÇÃO:", msg);
  isClientReady = false;
  io.emit("disconnected");
});

client.on("disconnected", (reason) => {
  console.log("\n[BOT 2] ❌ WHATSAPP DESCONECTADO! Motivo:", reason);
  isClientReady = false;
  lastQrDataUrl = null;
  io.emit("disconnected");
});

client.on("message", async (message) => {
  if (message.body === "!id") {
    message.reply("🤖 [BOT 2] O ID deste chat é: " + message.from);
  }
});

// =====================================
// ROTAS DA API
// =====================================
app.get("/", (req, res) => res.send("🤖 BOT 2 está ONLINE na porta 3001!"));

app.get("/status", (req, res) => {
  res.json({ connected: isClientReady });
});

app.get("/qr", (req, res) => {
  if (lastQrDataUrl) {
    res.json({ qr: lastQrDataUrl });
  } else {
    res.status(404).json({ error: "QR não disponível no momento" });
  }
});

app.post("/disconnect", async (req, res) => {
  try {
    await client.logout();
    isClientReady = false;
    lastQrDataUrl = null;
    io.emit("disconnected");
    res.json({ status: "desconectado" });

    // Prepara para reconectar automaticamente após 2 segundos
    setTimeout(() => {
      client.initialize();
    }, 2000);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.post("/send-message", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) return res.status(400).json({ error: "Faltando info" });
  if (!isClientReady) return res.status(500).json({ error: "Zap 2 não tá pronto" });

  try {
    let finalId = "";
    if (number.includes("@g.us") || number.includes("@c.us")) {
      finalId = number;
    } else {
      const cleanNumber = number.replace(/\D/g, "");
      try {
        const numberDetails = await client.getNumberId(cleanNumber);
        finalId = numberDetails ? numberDetails._serialized : `${cleanNumber}@c.us`;
      } catch (e) {
        finalId = `${cleanNumber}@c.us`;
      }
    }

    await client.sendMessage(finalId, message);
    console.log(`[BOT 2] 📤 Mensagem enviada para ${finalId}`);
    res.json({ status: "success", message: "Enviada via Bot 2" });

  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// =====================================
// SOCKET.IO - STATUS EM TEMPO REAL
// =====================================
io.on("connection", (socket) => {
  console.log("Cliente conectado ao painel web");
  if (isClientReady) {
    socket.emit("ready");
  } else if (lastQrDataUrl) {
    socket.emit("qr", lastQrDataUrl);
  } else {
    socket.emit("disconnected");
  }
});

// =====================================
// INICIALIZAÇÃO
// =====================================
client.initialize();
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`[BOT 2] 🌐 Servidor rodando na porta ${PORT}`);
    console.log(`[BOT 2] 📱 Painel web: http://SEU_IP:${PORT}`);
});