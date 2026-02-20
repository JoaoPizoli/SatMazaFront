# SatMaza — Frontend

Interface web para o sistema de Solicitações de Assistência Técnica (SAT) da Maza. Permite que representantes abram SATs, laboratórios registrem a análise técnica (AVT) e gestores acompanhem todo o fluxo via dashboards.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 + React 19 |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS 4 |
| Componentes | shadcn/ui + Radix UI |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Temas | next-themes |

---

## Pré-requisitos

- Node.js 22+
- API backend rodando (`SatMazaBack`)

---

## Configuração do Ambiente

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env.local
```

| Variável | Descrição | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API backend | `https://api.seudominio.com` |
| `NEXT_PUBLIC_APP_URL` | URL base do frontend | `https://app.seudominio.com` |

> Em desenvolvimento local, aponte `NEXT_PUBLIC_API_URL` para `http://localhost:3040`.

---

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 3041)
npm run dev
```

Acesse `http://localhost:3041`.

---

## Build de Produção

```bash
npm run build
npm run start
```

---

## Rotas da Aplicação

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Landing page |
| `/login` | Público | Autenticação |
| `/complete-registration` | Representante | Conclusão do cadastro inicial |
| `/dashboard` | Autenticado | Dashboard principal (varia por role) |
| `/dashboard/nova-sat` | Representante | Abertura de nova SAT |
| `/dashboard/minhas-sats` | Representante | SATs do representante logado |
| `/dashboard/pendentes` | Orquestrador | SATs aguardando destinação |
| `/dashboard/enviar` | Orquestrador | Envio de SATs aos laboratórios |
| `/dashboard/recebidas` | Lab (BAGUA/BSOLVENTE) | SATs recebidas pelo laboratório |
| `/dashboard/em-analise` | Lab (BAGUA/BSOLVENTE) | SATs em análise no laboratório |
| `/dashboard/finalizadas` | Lab / Orquestrador | SATs com análise concluída |
| `/dashboard/historico` | Admin / Orquestrador | Histórico completo |
| `/dashboard/admin` | Admin | Painel administrativo |
| `/dashboard/admin/usuarios` | Admin | Gestão de usuários |

---

## Estrutura do Projeto

```
src/
├── app/                        # App Router do Next.js
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Landing page
│   ├── login/
│   ├── complete-registration/
│   └── dashboard/
│       ├── layout.tsx          # Layout autenticado com sidebar
│       ├── page.tsx            # Dashboard dinâmico por role
│       ├── nova-sat/
│       ├── minhas-sats/
│       ├── pendentes/
│       ├── enviar/
│       ├── recebidas/
│       ├── em-analise/
│       ├── finalizadas/
│       ├── historico/
│       └── admin/
│           └── usuarios/
│
├── components/
│   ├── ui/                     # Componentes base (shadcn/radix)
│   ├── dashboards/             # Dashboards específicos por role
│   │   ├── representante-dashboard.tsx
│   │   ├── orquestrador-dashboard.tsx
│   │   ├── bagua-dashboard.tsx
│   │   └── bsolvente-dashboard.tsx
│   ├── sat-list-table.tsx      # Tabela de listagem de SATs
│   ├── sat-detail-dialog.tsx   # Modal de detalhes da SAT + AVT
│   ├── sat-send-dialog.tsx     # Modal de envio ao laboratório
│   ├── sat-filters-bar.tsx     # Filtros de pesquisa
│   ├── client-search-select.tsx
│   ├── product-search-select.tsx
│   ├── representative-search-select.tsx
│   ├── user-dialog.tsx
│   ├── app-sidebar.tsx
│   ├── login-form.tsx
│   └── dashboard-header.tsx
│
├── contexts/
│   └── auth-context.tsx        # Estado de autenticação global
│
├── hooks/
│   ├── use-sats.ts             # Busca de SATs com filtros
│   └── use-mobile.ts
│
├── lib/
│   ├── api.ts                  # Cliente HTTP base (fetch + interceptors)
│   └── api/
│       ├── auth.ts             # Login, logout, me
│       ├── sat.ts              # CRUD de SATs + listagens paginadas
│       ├── avt.ts              # CRUD de AVTs
│       ├── media.ts            # Upload/download de arquivos
│       ├── usuarios.ts         # Gestão de usuários
│       └── erp.ts              # Consultas ao ERP
│
└── types/
    └── index.ts                # Tipos TypeScript compartilhados
```

---

## Deploy na VPS (Nginx servindo o build estático)

### Build e envio para a VPS

```bash
# 1. Gerar o build de produção
npm run build

# 2. Enviar para a VPS via SCP
scp -r .next/ package.json package-lock.json public/ \
    root@<IP_VPS>:/opt/satmaza-front/
```

### Configurar na VPS

```bash
# Na VPS, entrar no diretório
cd /opt/satmaza-front

# Instalar apenas dependências de produção
npm ci --omit=dev

# Iniciar com PM2
npm install -g pm2
pm2 start "npm run start" --name satmaza-front
pm2 save
```

### Configurar Nginx

Adicione um bloco `server` no Nginx para o frontend:

```nginx
server {
    listen 80;
    server_name app.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3041;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
nginx -t && systemctl reload nginx

# SSL gratuito com Let's Encrypt
certbot --nginx -d app.seudominio.com
```

---

## Variáveis de Ambiente em Produção

Crie o arquivo `.env.production` na raiz do projeto (apenas na VPS, nunca versionado):

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com
NEXT_PUBLIC_APP_URL=https://app.seudominio.com
```

> Variáveis com prefixo `NEXT_PUBLIC_` são embutidas no bundle no momento do build. O `npm run build` deve ser executado **com essas variáveis definidas**.

---

## Lint

```bash
npm run lint
```
