# SatMaza Front-end

Aplicação Next.js moderna com TypeScript, React 19 e Tailwind CSS.

## 🚀 Tecnologias

- **[Next.js 16](https://nextjs.org/)** - Framework React com App Router
- **[React 19](https://react.dev/)** - Biblioteca UI com Server Components
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS utility-first
- **[React Hook Form](https://react-hook-form.com/)** - Gerenciamento de formulários
- **[ESLint](https://eslint.org/)** - Linting de código

## 📁 Estrutura do Projeto

```
SatMazaFront/
├── src/
│   ├── app/                    # App Router (rotas e páginas)
│   │   ├── layout.tsx          # Layout raiz (obrigatório)
│   │   ├── page.tsx            # Página inicial (/)
│   │   └── globals.css         # Estilos globais + Tailwind
│   ├── components/             # Componentes React reutilizáveis
│   │   └── Button.tsx          # Componente de exemplo
│   ├── lib/                    # Utilitários e helpers
│   │   └── utils.ts            # Funções auxiliares (cn, etc)
│   └── types/                  # Definições TypeScript globais
│       └── index.ts            # Tipos compartilhados
├── public/                     # Assets estáticos (imagens, fonts)
├── .env.local                  # Variáveis de ambiente (não commitado)
├── .env.example                # Template de variáveis de ambiente
├── next.config.ts              # Configuração Next.js
├── tsconfig.json               # Configuração TypeScript
├── tailwind.config.ts          # Configuração Tailwind CSS
└── package.json                # Dependências e scripts
```

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos

- Node.js 20+ 
- npm ou yarn

### Instalar Dependências

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Build de Produção

```bash
npm run build
npm run start
```

### Linting

```bash
# Verificar erros
npm run lint

# Corrigir automaticamente
npm run lint -- --fix
```

## 📝 Convenções

### Estrutura de Rotas (App Router)

- **`app/page.tsx`** - Rota `/`
- **`app/about/page.tsx`** - Rota `/about`
- **`app/blog/[slug]/page.tsx`** - Rota dinâmica `/blog/:slug`
- **`app/dashboard/layout.tsx`** - Layout compartilhado
- **`app/api/route.ts`** - API endpoint

### Server Components vs Client Components

**Server Components (padrão)**
```tsx
// app/page.tsx - Executa no servidor
export default async function Page() {
  const data = await fetch('...')
  return <div>{data}</div>
}
```

**Client Components (quando necessário)**
```tsx
// Adicionar diretiva 'use client'
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Importações com Alias

Use `@/` para importar a partir de `src/`:

```typescript
import Button from "@/components/Button"
import { cn } from "@/lib/utils"
import type { User } from "@/types"
```

### Estilização com Tailwind

Use a função `cn()` para combinar classes condicionalmente:

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className
)} />
```

## 🔐 Variáveis de Ambiente

Copie `.env.example` para `.env.local` e configure:

```bash
# Públicas (expostas ao browser - prefixo NEXT_PUBLIC_)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Privadas (apenas server-side)
DATABASE_URL=your-database-url
API_SECRET=your-api-secret
```

**⚠️ Importante:** Nunca commite `.env.local` ao git!

## 📚 Recursos

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação React](https://react.dev/)
- [Documentação TypeScript](https://www.typescriptlang.org/docs/)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [App Router Guide](https://nextjs.org/docs/app)

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Commit suas mudanças: `git commit -m 'Adiciona nova feature'`
3. Push para a branch: `git push origin feature/nova-feature`
4. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

