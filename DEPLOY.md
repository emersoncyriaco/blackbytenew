# Deploy no Vercel

## 1. Banco de Dados
Crie um banco PostgreSQL no Neon:
- Acesse https://neon.tech
- Crie uma conta e um novo projeto
- Copie a DATABASE_URL

## 2. Configurar Variáveis de Ambiente no Vercel
```bash
DATABASE_URL=sua-connection-string-neon
SESSION_SECRET=sua-chave-super-secreta-64-caracteres
NODE_ENV=production
```

## 3. Deploy
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

## 4. Executar Migrations
Após o deploy, execute as migrations:
```bash
npm run db:push
```

## 5. Configurar Domínio (Opcional)
No painel do Vercel, adicione seu domínio customizado.