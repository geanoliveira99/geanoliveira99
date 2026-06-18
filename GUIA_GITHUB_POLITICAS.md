# 📤 Como Fazer Upload das Políticas no GitHub

Guia passo-a-passo para publicar as políticas de privacidade no repositório do GitHub.

---

## 1️⃣ Criar um Novo Repositório no GitHub

### Opção A: Usar um Repositório Existente
Se você já tem um repositório (recomendado):
- Crie uma pasta `docs/` ou `politicas/` 
- Coloque os arquivos lá

### Opção B: Criar um Novo Repositório

1. **Acesse** https://github.com/new (você já fez login)
2. **Nome**: `politicas` ou `docs` (ambos funcionam bem)
3. **Descrição**: "Políticas de Privacidade, Termos de Uso e Política de Cookies"
4. **Visibilidade**: Public ✅ (para que qualquer um veja)
5. **Clique**: "Create repository"

---

## 2️⃣ Clonar o Repositório Localmente

```bash
# Se criou repositório novo:
git clone https://github.com/geanoliveira99/politicas.git
cd politicas

# Se está usando repositório existente:
cd seu-repositorio
```

---

## 3️⃣ Copiar os Arquivos

Copie os arquivos da pasta `docs/` do seu site para o repositório:

```bash
# De dentro do repositório de políticas:

# Se estão no site-gean/docs/:
cp ../site-gean/docs/* .

# Ou copie manualmente:
# - POLITICA_DE_PRIVACIDADE.md
# - TERMOS_DE_USO.md
# - POLITICA_DE_COOKIES.md
# - README.md
```

---

## 4️⃣ Adicionar e Fazer Commit

```bash
# Ver o status
git status

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "docs: adicionar políticas de privacidade, cookies e termos de uso"

# Enviar para GitHub
git push origin main
```

---

## 5️⃣ URLs para Usar no Site

Depois que estiver no GitHub, você usará essas URLs:

### Se criou repositório `politicas`:
```
https://github.com/geanoliveira99/politicas/blob/main/POLITICA_DE_PRIVACIDADE.md
https://github.com/geanoliveira99/politicas/blob/main/POLITICA_DE_COOKIES.md
https://github.com/geanoliveira99/politicas/blob/main/TERMOS_DE_USO.md
```

### Se colocou em pasta `docs/` do site:
```
https://github.com/geanoliveira99/site-gean/blob/main/docs/POLITICA_DE_PRIVACIDADE.md
https://github.com/geanoliveira99/site-gean/blob/main/docs/POLITICA_DE_COOKIES.md
https://github.com/geanoliveira99/site-gean/blob/main/docs/TERMOS_DE_USO.md
```

---

## 6️⃣ Testar os Links

Depois de fazer push:

1. Acesse uma das URLs acima
2. Verifique se o arquivo aparece corretamente no GitHub
3. Teste clicar nos links do Footer do seu site

---

## 🎯 Resumo das URLs Atualmente no Footer

O seu site atualmente aponta para:
```
https://github.com/geanoliveira99/politicas/blob/main/POLITICA_DE_PRIVACIDADE.md
https://github.com/geanoliveira99/politicas/blob/main/POLITICA_DE_COOKIES.md
https://github.com/geanoliveira99/politicas/blob/main/TERMOS_DE_USO.md
```

Se usar outro caminho, você precisará atualizar o Footer em:
`src/components/Footer.tsx`

---

## 🔧 Se Precisar Mudar os Links

Edite `src/components/Footer.tsx`:

```typescript
const legalLinks = [
  { label: 'Privacidade',   href: 'SEU_NOVO_URL_AQUI' },
  { label: 'Cookies',       href: 'SEU_NOVO_URL_AQUI' },
  { label: 'Termos de Uso', href: 'SEU_NOVO_URL_AQUI' },
];
```

Depois:
```bash
npm run build
npm run dev
# Teste no navegador
```

---

## ✅ Checklist Final

- [ ] Arquivos estão em `docs/` localmente
- [ ] Você criou/escolheu o repositório GitHub
- [ ] Você clonou o repositório localmente
- [ ] Copiou os arquivos para o repositório local
- [ ] Fez `git add .` e `git commit`
- [ ] Fez `git push origin main`
- [ ] URLs estão no Footer (`src/components/Footer.tsx`)
- [ ] Build passou: `npm run build`
- [ ] Testou no navegador: `npm run dev`
- [ ] Clicou nos links do Footer e verificou se abrem corretamente

---

## 🚀 Depois de Publicar

1. **Testar localmente**: `npm run dev` → clique nos links do Footer
2. **Build final**: `npm run build`
3. **Deploy no Cloudflare**: Suba os arquivos do `dist/`

---

**Pronto! Sua política está segura e acessível no GitHub! 🎉**
