# 📖 Documentação — Site Gean Oliveira

> Portfólio pessoal de Gean Oliveira  
> URL de produção: **https://site-gean.pages.dev**  
> Hospedagem: **Cloudflare Pages** (gratuito)

---

## 🗂 Estrutura do Projeto

```
site-gean/
├── public/                  # Arquivos estáticos (imagens, SVGs, sons, game)
│   ├── gean.png             # Foto de perfil (também usada como favicon)
│   ├── develope.svg         # Ícone do DevLearn na navbar
│   ├── GAME/                # Assets do MiniGame (fases, planetas)
│   ├── sounds/              # Sons do MiniGame
│   ├── planetas3D/          # Imagens 3D das fases do jogo
│   └── history/             # Assets de histórico do jogo
├── src/
│   ├── main.tsx             # Entrada da aplicação (ReactDOM + ThemeProvider)
│   ├── App.tsx              # Roteamento simples + lazy loading de seções
│   ├── index.css            # CSS global, variáveis de tema, animações
│   ├── components/
│   │   ├── Navbar.tsx       # Barra de navegação fixa (logo, links, ícones sociais)
│   │   ├── Hero.tsx         # Seção inicial (Globe 3D, typewriter, marquee)
│   │   ├── Stats.tsx        # Contador de projetos, anos, clientes
│   │   ├── Skills.tsx       # Grid de habilidades com animação cinematográfica
│   │   ├── Experience.tsx   # Carrossel de experiências profissionais
│   │   ├── Projects.tsx     # Projetos reais com preview no iPhone
│   │   ├── Contact.tsx      # Seção de contato (Instagram, WhatsApp, Email)
│   │   ├── Footer.tsx       # Rodapé com nav, ícones sociais e copyright
│   │   ├── TechSVGs.tsx     # SVGs das tecnologias (React, Node, Android, etc.)
│   │   └── ui/
│   │       ├── MiniGame.tsx      # Jogo completo (abre ao clicar no menu ☰)
│   │       ├── AuroraShader.tsx  # Shader WebGL do fundo do Hero (desktop)
│   │       ├── Globe.tsx         # Globo 3D interativo do Hero
│   │       ├── CountUp.tsx       # Animação de contagem numérica
│   │       ├── TrustedUsers.tsx  # Avatares de clientes satisfeitos
│   │       └── CodePlayground.tsx # Editor de código ao vivo (usado no DevLearn)
│   ├── pages/
│   │   └── DevLearn.tsx     # Página de aprendizado (/develope) — HTML, CSS, JS + 5 desafios
│   ├── context/
│   │   └── ThemeContext.tsx  # Contexto de tema dark/light
│   ├── hooks/
│   │   └── useScrollReveal.ts # Hook de animação ao rolar
│   └── lib/
│       └── utils.ts         # Utilitários (cn para Tailwind)
├── index.html               # HTML raiz com meta SEO, favicon, Open Graph
├── vite.config.ts           # Config do Vite (porta 5174, alias @/)
├── tsconfig.json            # Config TypeScript
├── package.json             # Dependências do projeto
├── iniciar.bat              # Menu principal: dev / build / deploy (Windows)
└── DOCUMENTACAO.md          # Este arquivo
```

---

## 🛠 Stack Tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Framework principal |
| TypeScript | 5.9 | Tipagem |
| Vite | 8 (beta) | Bundler / Dev server |
| Tailwind CSS | 4 | Estilização utilitária |
| Framer Motion | 12 | Animações |
| Lucide React | 0.575 | Ícones |
| Three.js / R3F | 0.183 | Globe 3D |
| Cobe | 0.6 | Globe WebGL alternativo |
| OGL | 1.0 | Aurora shader WebGL |

---

## 💻 Requisitos para Rodar Localmente

- **Node.js 18+** → https://nodejs.org (baixar a versão LTS)
- **npm** (vem junto com o Node.js)
- **Windows** (o `iniciar.bat` é para Windows — no Mac/Linux use `iniciar.sh`)

---

## 🚀 Como Rodar no Computador (novo PC)

### Passo 1 — Copiar o projeto
Copie a pasta `site-gean/` para o novo computador.  
> ⚠️ A pasta `node_modules/` e `dist/` **não precisam ser copiadas** — elas são geradas automaticamente.

### Passo 2 — Instalar o Node.js
1. Acesse https://nodejs.org
2. Baixe a versão **LTS** (ex: 20.x)
3. Instale normalmente (Next → Next → Finish)
4. Reinicie o computador se necessário

### Passo 3 — Rodar o projeto
Dê dois cliques no arquivo **`iniciar.bat`** e escolha a opção **[1] Rodar localmente**.

Na primeira vez ele vai instalar as dependências (`node_modules/`) automaticamente.

O site abre em: **http://localhost:5174**

---

## 📦 Como Fazer Deploy (atualizar o site no ar)

### Opção A — Usando o menu (mais fácil)
1. Dê dois cliques em **`iniciar.bat`**
2. Escolha **[2] Build + Deploy → Cloudflare Pages**
3. Na **primeira vez** em um novo PC: o navegador vai abrir pedindo login na Cloudflare — faça login com `geansnswatch@gmail.com`
4. Aguarde — aparece a mensagem `✓ Deploy concluído!`

### Opção B — Via terminal (PowerShell/CMD)
```bash
# Na pasta do projeto:
npm run build
npx wrangler pages deploy dist --project-name site-gean --branch main --commit-dirty=true
```

### Login do Wrangler (só precisa fazer uma vez por PC)
O Wrangler (CLI da Cloudflare) salva o token de login localmente.  
Se pedir login de novo em algum momento:
```bash
npx wrangler login
```
Vai abrir o navegador → faça login com `geansnswatch@gmail.com` → autorize → pronto.

---

## 🌐 Informações de Produção

| Item | Valor |
|---|---|
| URL principal | https://site-gean.pages.dev |
| Plataforma | Cloudflare Pages (Free) |
| Projeto no Cloudflare | `site-gean` |
| Conta Cloudflare | geansnswatch@gmail.com |
| Branch de produção | `main` |
| Dashboard | https://dash.cloudflare.com → Workers e Pages → site-gean |

---

## 🗺 Rotas do Site

| URL | Componente | Descrição |
|---|---|---|
| `/` | `App.tsx` → todas as seções | Portfólio principal |
| `/develope` | `DevLearn.tsx` | Plataforma de aprendizado de dev |

> O roteamento é manual (sem React Router) — feito via `window.location.pathname` no `App.tsx`.

---

## 🎮 MiniGame

O jogo abre ao clicar no botão **☰ (menu orbital)** no canto direito da navbar.

**Senhas para avançar de fase:**
| Fase | Senha |
|---|---|
| Fase 1 | `EASY0101` |
| Fase 2 | `THEPHODALIS` |
| Fase 3 | `QWERTY0101001` |
| Fase 4 | `SPACE2026NASA` |
| Missão Bônus | `GEANOLIVEIRA99` |

---

## 🔧 Comandos Úteis

```bash
# Rodar em desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Checar erros de TypeScript
npx tsc --noEmit

# Deploy no Cloudflare Pages
npx wrangler pages deploy dist --project-name site-gean --branch main --commit-dirty=true

# Login na Cloudflare (só uma vez por PC)
npx wrangler login

# Ver projetos Pages na conta
npx wrangler pages project list
```

---

## 📁 O que NÃO precisa copiar para outro PC

```
node_modules/   ← gerado pelo npm install (pode ter 500MB+)
dist/           ← gerado pelo npm run build
.DS_Store       ← arquivo do macOS, ignorar
```

Esses diretórios estão no `.gitignore` e são sempre gerados localmente.

---

## 🆘 Problemas Comuns

### "npm não encontrado"
→ Node.js não está instalado. Baixe em https://nodejs.org (versão LTS)

### "Erro no build"
→ Rode `npx tsc --noEmit` para ver os erros de TypeScript detalhados

### "Wrangler pede login de novo"
→ Execute `npx wrangler login` e faça login com `geansnswatch@gmail.com`

### "Site local não abre"
→ Verifique se a porta 5174 não está em uso. Tente fechar outros terminais/servidores

### "node_modules corrompido"
→ Delete a pasta `node_modules/` e rode `npm install` de novo

---

## 📞 Contato do Desenvolvedor

- **Instagram:** [@geanoliveira99](https://www.instagram.com/geanoliveira99/)
- **WhatsApp:** +55 (68) 98110-8001
- **Email:** geansnswatch@gmail.com
- **GitHub:** [geanoliveira99](https://github.com/geanoliveira99)
- **Localização:** Acre, Brasil 🇧🇷

---

*Documentação gerada em 16/03/2026*
