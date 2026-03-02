# 📦 Como subir este perfil no GitHub

## 1. Criar o repositório especial do perfil

1. Acesse [github.com/new](https://github.com/new)
2. No campo **Repository name**, coloque exatamente: `GeanOliveira`
   > ⚠️ O nome tem que ser igual ao seu username do GitHub — isso cria o repositório especial de perfil
3. Marque como **Public**
4. **NÃO** inicialize com README (você vai fazer o push manual)
5. Clique em **Create repository**

---

## 2. Fazer o push do README

Abra o terminal e rode:

```bash
# Entre na pasta do perfil
cd github-profile

# Inicie o git
git init
git add .
git commit -m "feat: perfil animado com snake, pacman e experiência"

# Conecte ao repositório criado no passo 1
git remote add origin https://github.com/GeanOliveira/GeanOliveira.git
git branch -M main
git push -u origin main
```

---

## 3. Ativar o GitHub Actions (snake + pacman)

1. No repositório `GeanOliveira/GeanOliveira`, vá em **Settings → Actions → General**
2. Em **Workflow permissions**, selecione **Read and write permissions**
3. Salve as alterações
4. Vá em **Actions** e rode o workflow **"Generate Snake & Pac-Man Animations"** manualmente (clique em **Run workflow**)

Após a primeira execução, uma branch chamada `output` será criada automaticamente com os SVGs animados.

---

## 4. O que vai aparecer no seu perfil

| Animação | O que faz |
|:---|:---|
| 🐍 **Snake** | Uma cobrinha que come seus quadradinhos verdes de contribuição |
| 👾 **Pac-Man** | O Pac-Man percorre seu histórico de commits comendo os pontos |
| ⌨️ **Typing SVG** | Texto animado com suas stacks principais no topo |
| 📊 **Stats** | Cards com total de commits, linguagens e streak |
| 🏆 **Trophies** | Troféus baseados nas suas atividades do GitHub |
| 📈 **Activity Graph** | Gráfico animado de toda sua atividade |
| 👁️ **Visitor Count** | Contador de visitas no perfil |

---

## ✅ Pronto!

Acesse `https://github.com/GeanOliveira` e veja seu perfil animado! 🚀
