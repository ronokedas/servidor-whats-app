# 🤖 Bot WhatsApp com Painel Web para VPS

Sistema completo para rodar bot WhatsApp em VPS Linux com acesso via painel web, sem necessidade de login/senha.

## 📁 Estrutura do Projeto

```
wha-servidor-web/
├── zap2.js              # Código principal do bot
├── package.json         # Dependências Node.js
├── Dockerfile           # Imagem Docker
├── docker-compose.yml   # Orquestração do container
├── .dockerignore        # Arquivos ignorados no build
└── public/
    └── index.html       # Painel web
```

## 🚀 Passo a Passo para Deploy

### 1. Subir o projeto no GitHub

```bash
# No seu computador local, dentro da pasta do projeto
git init
git add .
git commit -m "Initial commit - Bot WhatsApp com painel web"
git remote add origin https://github.com/ronokedas/servidor-whats-app.git
git push -u origin main
```

### 2. Conectar na VPS Linux

```bash
ssh root@SEU_IP_VPS
```

### 3. Instalar Docker e Docker Compose na VPS

```bash
# Atualizar pacotes
sudo apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verificar instalação
docker --version
docker-compose --version

# Remover a versão antiga
sudo apt remove docker-compose

# Instalar o plugin Docker Compose V2
sudo apt update
sudo apt install docker-compose-plugin

# Usar o comando
docker compose --version


```

### 4. Clonar o repositório na VPS

```bash
# Clonar o projeto
git clone https://github.com/ronokedas/wha-servidor-web.git
cd wha-servidor-web
```

### 5. Liberar a porta no firewall (se usar UFW)

```bash
# Permitir porta 3001
ufw allow 3001/tcp
ufw reload
```

### 6. Iniciar o container

```bash
# Primeira vez - build e start
docker-compose up -d --build

# Ver logs em tempo real
docker-compose logs -f
```

### 7. Acessar o painel web

Abra no navegador: `http://SEU_IP_VPS:3001`

Você verá:
- **Bolinha vermelha** = Desconectado
- **QR Code** = Aguardando escaneamento
- **Bolinha verde** = Conectado

## 📋 Funcionalidades do Painel

✅ **Status em tempo real** - Atualiza automaticamente via Socket.io  
✅ **QR Code na tela** - Escaneie diretamente pelo navegador  
✅ **Botão Desconectar** - Desconecta o WhatsApp atual  
✅ **Botão Reconectar** - Gera novo QR Code para reconexão  
✅ **Servidor sempre online** - Continua rodando mesmo fechando o navegador  
✅ **Sessão persistente** - Não precisa escanear QR toda vez (salvo em volume Docker)

## 🔧 Comandos Úteis

```bash
# Ver logs do bot
docker-compose logs -f

# Parar o bot
docker-compose down

# Reiniciar o bot
docker-compose restart

# Ver status do container
docker-compose ps

# Rebuild após alterações no código
docker-compose up -d --build
```

## 🔒 Segurança

- **Sem login/senha** - Qualquer pessoa com o IP e porta acessa
- **Recomendação**: Use VPN ou SSH tunnel para acessar de fora
- **Opcional**: Adicione senha básica no Nginx ou use Cloudflare Tunnel

## 🌐 Acesso Remoto Seguro (Opcional)

Se quiser acessar de qualquer lugar sem expor a porta:

### Opção 1: Cloudflare Tunnel (grátis)
```bash
# Instalar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Criar tunnel
cloudflared tunnel create bot-whatsapp
cloudflared tunnel route dns bot-whatsapp bot.SEU_DOMINIO.com
cloudflared tunnel run bot-whatsapp
```

### Opção 2: Nginx + Domínio + HTTPS
```bash
# Instalar Nginx
apt install nginx certbot python3-certbot-nginx -y

# Configurar proxy reverso (criar /etc/nginx/sites-available/bot)
server {
    listen 80;
    server_name bot.SEU_DOMINIO.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar site
ln -s /etc/nginx/sites-available/bot /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL grátis com Let's Encrypt
certbot --nginx -d bot.SEU_DOMINIO.com
```

## 📊 Monitoramento

O bot continua rodando mesmo se:
- ✅ Você fechar a aba do navegador
- ✅ Perder conexão SSH
- ✅ Reiniciar a VPS (graças ao `restart: unless-stopped`)

Para verificar se está rodando:
```bash
docker-compose ps
# ou
curl http://localhost:3001/status
```

## 🐛 Troubleshooting

### Erro de Chromium no Docker
```bash
# Verificar se Chromium está instalado no container
docker-compose exec bot which chromium

# Se não estiver, rebuild
docker-compose down
docker-compose up -d --build
```

### QR Code não aparece
```bash
# Ver logs
docker-compose logs -f

# Procurar por erros de Puppeteer
```

### Sessão expira frequentemente
```bash
# Verificar permissões dos volumes
ls -la wwebjs_auth/
ls -la wwebjs_cache/

# Ajustar permissões se necessário
chmod -R 777 wwebjs_auth wwebjs_cache
```

## 📝 Notas Importantes

1. **Primeira execução**: Escaneie o QR Code e mantenha o WhatsApp conectado
2. **Sessão salva**: Os dados de autenticação ficam em `./wwebjs_auth` (não commitado no Git)
3. **Backup**: Faça backup da pasta `wwebjs_auth` periodicamente
4. **Recursos**: O container usa ~500MB RAM e ~1GB de shared memory
5. **Porta**: Padrão é 3001, altere no docker-compose.yml se precisar

## 🔄 Atualizações

Para atualizar o bot após alterações no GitHub:

```bash
cd wha-servidor-web
git pull origin main
docker-compose down
docker-compose up -d --build
```

## 📞 Suporte

Se precisar de ajuda, verifique os logs:
```bash
docker-compose logs -f
```

---

**Desenvolvido para rodar 24/7 na sua VPS Linux** 🚀