Guia rápido de deploy (Frontend + Backend)

Pré-requisitos no servidor:
- Node.js 18+ e npm
- Nginx (ou outro servidor estático)
- MySQL acessível e configurado
- Broker MQTT (se usado) acessível em ws://10.1.1.33:8082

Frontend (build e servir):
1. No diretório do frontend:

```bash
npm ci
# Use .env.production (já criado) com VITE_API_URL e VITE_MQTT_WS_URL
npm run build
```

2. Copie `dist/` para o diretório servido pelo Nginx (ex: `/var/www/sertao`), então configure um server block no Nginx apontando para esse diretório.

Exemplo mínimo Nginx:

```nginx
server {
  listen 80;
  server_name seu.dominio.com 10.1.1.33;
  root /var/www/sertao;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

Backend (configurar serviço):
1. No diretório do backend, ajuste `.env` com `DB_HOST`, `DB_USER`, `DB_PASS`.
2. Instale dependências e inicie com `pm2` (exemplo):

```bash
cd /path/to/backend
npm ci
# exportar variáveis de ambiente ou usar arquivo .env
export PORT=3001
export HOST=0.0.0.0
pm2 start server.js --name sertao-backend --watch
pm2 save
```

Observações:
- Abra portas 80/443 (HTTP/HTTPS), 3001 (API) e 8082 (MQTT) no firewall.
- Configure SSL (Let's Encrypt) no Nginx para ambiente público.
- Recomendo habilitar logs do MQTT/backend para depuração inicial.
- Após deploy, execute os testes E2E (Playwright) para validar fluxos.
