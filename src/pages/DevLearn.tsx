import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CodePlayground from '../components/ui/CodePlayground';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type ModuleId = 'home' | 'html' | 'css' | 'js' | 'final';
interface Slide {
  title: string;
  content: React.ReactNode;
  playground?: {
    html?: string;
    css?: string;
    js?: string;
    mode: 'html' | 'css' | 'js' | 'full';
  };
}

// ─── Slides HTML ──────────────────────────────────────────────────────────────
const htmlSlides: Slide[] = [
  {
    title: 'O que é HTML?',
    content: (
      <div>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: '#cbd5e1' }}>
          HTML é a <strong style={{ color: '#e34c26' }}>estrutura</strong> de um site. Ele organiza o conteúdo da página: títulos, parágrafos, imagens, botões e links.
        </p>
        <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(227,76,38,0.1)', border: '1px solid rgba(227,76,38,0.3)' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#e34c26', marginBottom: 8 }}>Pense assim:</p>
          <p style={{ margin: '4px 0', color: '#e2e8f0' }}>🧱 <strong>HTML</strong> = Esqueleto do corpo</p>
          <p style={{ margin: '4px 0', color: '#e2e8f0' }}>👗 <strong>CSS</strong> = Roupa</p>
          <p style={{ margin: '4px 0', color: '#e2e8f0' }}>⚡ <strong>JS</strong> = Movimento</p>
        </div>
        <p style={{ marginTop: 12, color: '#94a3b8', fontSize: 14 }}>Sem HTML, nada aparece na tela.</p>
      </div>
    ),
    playground: {
      html: `<h1>Olá, mundo! 👋</h1>
<p>Este é meu primeiro parágrafo HTML.</p>
<p>HTML é muito fácil!</p>`,
      mode: 'html',
    },
  },
  {
    title: 'Estrutura básica de uma página',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.7 }}>
          Todo site começa com essa estrutura. É o "esqueleto" obrigatório.
        </p>
        <ul style={{ paddingLeft: 20, color: '#94a3b8', fontSize: 14, lineHeight: 2 }}>
          <li><code style={{ color: '#e34c26' }}>&lt;html&gt;</code> — início da página</li>
          <li><code style={{ color: '#e34c26' }}>&lt;head&gt;</code> — configurações (título, CSS)</li>
          <li><code style={{ color: '#e34c26' }}>&lt;body&gt;</code> — tudo que aparece na tela</li>
        </ul>
        <p style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(108,99,255,0.12)', borderRadius: 8, color: '#a78bfa', fontSize: 13, borderLeft: '3px solid #6c63ff' }}>
          💡 Dica: Use tags semânticas sempre que possível!
        </p>
      </div>
    ),
    playground: {
      html: `<!DOCTYPE html>
<html>
  <head>
    <title>Meu site</title>
  </head>
  <body>
    <header>Topo</header>
    <main>Conteúdo principal</main>
    <footer>Rodapé</footer>
  </body>
</html>`,
      mode: 'html',
    },
  },
  {
    title: 'Tags HTML mais usadas',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>As principais tags para começar:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            ['<ol>', 'Lista ordenada', '#e34c26'],
            ['<ul>', 'Lista não ordenada', '#e34c26'],
            ['<li>', 'Item da lista', '#e34c26'],
            ['<p>', 'Parágrafo', '#264de4'],
            ['<h1-h6>', 'Título', '#264de4'],
            ['<i>', 'Texto itálico', '#264de4'],
            ['<div>', 'Separa conteúdos', '#6c63ff'],
            ['<form>', 'Formulário', '#6c63ff'],
            ['<b>', 'Texto negrito', '#6c63ff'],
            ['<nav>', 'Navegação', '#00d9ff'],
            ['<a>', 'Link', '#00d9ff'],
            ['<img>', 'Imagem', '#00d9ff'],
          ].map(([tag, desc, color]) => (
            <div key={tag} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px', textAlign: 'center', border: `1px solid ${color}33` }}>
              <div style={{ color, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{tag}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    playground: {
      html: `<h1>Título Principal</h1>
<h2>Subtítulo</h2>
<p>Um <b>parágrafo</b> com texto <i>itálico</i>.</p>

<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>

<a href="#">Clique aqui</a>`,
      mode: 'html',
    },
  },
  {
    title: 'Tags Semânticas',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>Tags semânticas descrevem o significado do conteúdo:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            ['<section>', 'Define uma seção'],
            ['<header>', 'Cabeçalho'],
            ['<nav>', 'Links de navegação'],
            ['<footer>', 'Rodapé'],
            ['<details>', 'Detalhes ocultáveis'],
            ['<aside>', 'Barra lateral'],
            ['<article>', 'Conteúdo independente'],
            ['<figure>', 'Conteúdo visual'],
            ['<main>', 'Conteúdo principal'],
            ['<mark>', 'Texto destacado'],
            ['<summary>', 'Título do details'],
            ['<time>', 'Data e hora'],
          ].map(([tag, desc]) => (
            <div key={tag} style={{ background: 'rgba(108,99,255,0.07)', borderRadius: 8, padding: '8px', textAlign: 'center', border: '1px solid rgba(108,99,255,0.2)' }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>{tag}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    playground: {
      html: `<article>
  <header>
    <h1>Meu Artigo</h1>
    <time>2026-03-16</time>
  </header>

  <section>
    <p>Este é o conteúdo principal.</p>
    <mark>Este texto está destacado!</mark>
  </section>

  <details>
    <summary>Mais informações</summary>
    <p>Conteúdo oculto que aparece ao clicar!</p>
  </details>

  <footer>Escrito por Gean</footer>
</article>`,
      mode: 'html',
    },
  },
  {
    title: 'Formulários e Inputs',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 10 }}>
          Formulários coletam dados do usuário. O elemento <code style={{ color: '#e34c26' }}>&lt;form&gt;</code> agrupa todos os inputs.
        </p>
        <div style={{ background: 'rgba(227,76,38,0.08)', borderRadius: 10, padding: 12, border: '1px solid rgba(227,76,38,0.2)' }}>
          <p style={{ margin: '0 0 6px', color: '#e34c26', fontWeight: 700, fontSize: 13 }}>Tipos de input:</p>
          {[
            ['text', 'Campo de texto livre'],
            ['email', 'Valida formato de email'],
            ['password', 'Senha (oculta)'],
            ['checkbox', 'Caixa de seleção'],
            ['radio', 'Seleção única'],
            ['submit', 'Botão enviar'],
          ].map(([type, desc]) => (
            <p key={type} style={{ margin: '3px 0', fontSize: 13, color: '#cbd5e1' }}>
              <code style={{ color: '#f0db4f', fontSize: 12 }}>type="{type}"</code>
              <span style={{ color: '#64748b' }}> — {desc}</span>
            </p>
          ))}
        </div>
      </div>
    ),
    playground: {
      html: `<form>
  <label>Nome:</label><br>
  <input type="text" placeholder="Seu nome"><br><br>

  <label>Email:</label><br>
  <input type="email" placeholder="email@exemplo.com"><br><br>

  <label>Senha:</label><br>
  <input type="password" placeholder="••••••"><br><br>

  <label>
    <input type="checkbox"> Aceito os termos
  </label><br><br>

  <button type="submit">Enviar</button>
</form>`,
      css: `input, button { display: block; margin: 4px 0; padding: 6px 10px; border-radius: 6px; border: 1px solid #444; background: #1a1a2e; color: #e2e8f0; }
button { background: #6c63ff; cursor: pointer; }`,
      mode: 'html',
    },
  },
  {
    title: 'Imagens e Links',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Imagens e links são essenciais. Veja como usá-los corretamente:
        </p>
        {[
          ['<img src="foto.jpg" alt="Descrição">', 'Exibe uma imagem — alt é obrigatório para acessibilidade'],
          ['<a href="https://site.com">Texto</a>', 'Cria um link clicável'],
          ['target="_blank"', 'Abre o link em nova aba'],
          ['<a href="mailto:email@x.com">', 'Link para enviar email'],
          ['width e height', 'Controlam o tamanho da imagem'],
        ].map(([code, desc]) => (
          <div key={code} style={{ marginBottom: 8, padding: '8px 10px', background: 'rgba(227,76,38,0.05)', borderRadius: 8, border: '1px solid rgba(227,76,38,0.15)' }}>
            <code style={{ color: '#e34c26', fontSize: 11, fontFamily: 'monospace', display: 'block', marginBottom: 2 }}>{code}</code>
            <span style={{ color: '#64748b', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<h2>Links e Imagens</h2>

<!-- Link simples -->
<a href="https://developer.mozilla.org" target="_blank">
  📚 Documentação MDN
</a>

<br><br>

<!-- Imagem com placeholder -->
<img
  src="https://placehold.co/200x100/e34c26/white?text=HTML"
  alt="Imagem de exemplo"
  width="200"
  style="border-radius:8px; display:block; margin:8px 0;"
>

<!-- Link ao redor de uma imagem -->
<a href="https://developer.mozilla.org" target="_blank">
  <img
    src="https://placehold.co/200x60/264de4/white?text=Clique+aqui!"
    alt="Clique para abrir"
    width="200"
    style="border-radius:8px;"
  >
</a>`,
      mode: 'html',
    },
  },
  {
    title: 'Tabelas HTML',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Tabelas organizam dados em linhas e colunas:
        </p>
        {[
          ['<table>', 'Container da tabela'],
          ['<thead>', 'Cabeçalho da tabela'],
          ['<tbody>', 'Corpo da tabela'],
          ['<tr>', 'Linha (table row)'],
          ['<th>', 'Célula de cabeçalho (negrito)'],
          ['<td>', 'Célula de dado'],
          ['colspan="2"', 'Une 2 colunas horizontalmente'],
          ['rowspan="2"', 'Une 2 linhas verticalmente'],
        ].map(([tag, desc]) => (
          <div key={tag} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'center' }}>
            <code style={{ color: '#e34c26', fontSize: 12, fontFamily: 'monospace', minWidth: 100 }}>{tag}</code>
            <span style={{ color: '#64748b', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<table>
  <thead>
    <tr>
      <th>Linguagem</th>
      <th>Tipo</th>
      <th>Nível</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>HTML</td>
      <td>Marcação</td>
      <td>⭐ Fácil</td>
    </tr>
    <tr>
      <td>CSS</td>
      <td>Estilo</td>
      <td>⭐⭐ Médio</td>
    </tr>
    <tr>
      <td>JavaScript</td>
      <td>Programação</td>
      <td>⭐⭐⭐ Avançado</td>
    </tr>
  </tbody>
</table>`,
      css: `table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid rgba(227,76,38,0.4); padding: 10px 14px; text-align: left; color: #e2e8f0; }
th { background: rgba(227,76,38,0.2); color: #e34c26; font-weight: bold; }
tr:nth-child(even) { background: rgba(255,255,255,0.03); }`,
      mode: 'html',
    },
  },
  {
    title: 'Atributos data-* e classes múltiplas',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Atributos personalizados e classes múltiplas tornam o HTML mais poderoso:
        </p>
        <div style={{ background: 'rgba(227,76,38,0.08)', borderRadius: 10, padding: 12, border: '1px solid rgba(227,76,38,0.2)', marginBottom: 10 }}>
          <p style={{ margin: '0 0 6px', color: '#e34c26', fontWeight: 700, fontSize: 13 }}>data-* attributes:</p>
          <p style={{ margin: '3px 0', fontSize: 13, color: '#cbd5e1' }}>
            Guardam informações extras no HTML sem afetar o layout.<br />
            <code style={{ color: '#f0db4f', fontSize: 12 }}>data-id="42"</code> → acessado com <code style={{ color: '#f0db4f', fontSize: 12 }}>el.dataset.id</code>
          </p>
        </div>
        <div style={{ background: 'rgba(108,99,255,0.08)', borderRadius: 10, padding: 12, border: '1px solid rgba(108,99,255,0.2)' }}>
          <p style={{ margin: '0 0 6px', color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>Classes múltiplas:</p>
          <code style={{ color: '#7eb3ff', fontSize: 12, fontFamily: 'monospace' }}>{'<div class="card destaque ativo">'}</code>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12 }}>Um elemento pode ter várias classes separadas por espaço</p>
        </div>
      </div>
    ),
    playground: {
      html: `<div class="card destaque" data-id="1" data-tipo="html">
  <span class="badge">HTML</span>
  <p>Card com data-id="1"</p>
  <button onclick="mostrar(this)">Ver dados</button>
</div>

<div class="card" data-id="2" data-tipo="css">
  <span class="badge azul">CSS</span>
  <p>Card com data-id="2"</p>
  <button onclick="mostrar(this)">Ver dados</button>
</div>

<p id="info"></p>`,
      css: `.card { padding: 14px; border-radius: 10px; border: 1px solid #333; margin-bottom: 10px; background: rgba(255,255,255,0.03); color: #e2e8f0; }
.destaque { border-color: #e34c26 !important; background: rgba(227,76,38,0.06) !important; }
.badge { background: #e34c26; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
.azul { background: #264de4; }
button { margin-top: 8px; padding: 6px 12px; background: #6c63ff; color: white; border: none; border-radius: 6px; cursor: pointer; }`,
      js: `function mostrar(btn) {
  const card = btn.closest('.card');
  const id = card.dataset.id;
  const tipo = card.dataset.tipo;
  document.getElementById('info').textContent = 'ID: ' + id + ' | Tipo: ' + tipo.toUpperCase();
}`,
      mode: 'html',
    },
  },
  {
    title: 'Meta Tags e SEO básico',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Meta tags ficam no <code style={{ color: '#e34c26' }}>&lt;head&gt;</code> e definem como o site aparece no Google e redes sociais:
        </p>
        {[
          ['<meta charset="UTF-8">', 'Define o encoding (aceita acentos)'],
          ['<meta name="description">', 'Descrição para o Google'],
          ['<meta name="viewport">', 'Torna o site responsivo no celular'],
          ['<meta property="og:title">', 'Título ao compartilhar no WhatsApp/Facebook'],
          ['<meta property="og:image">', 'Imagem ao compartilhar'],
          ['<title>Meu Site</title>', 'Nome na aba do navegador'],
          ['<link rel="icon" href="...">', 'Ícone (favicon) da aba'],
        ].map(([tag, desc]) => (
          <div key={tag} style={{ marginBottom: 7, padding: '6px 10px', background: 'rgba(227,76,38,0.05)', borderRadius: 6 }}>
            <code style={{ color: '#e34c26', fontSize: 11, fontFamily: 'monospace', display: 'block', marginBottom: 1 }}>{tag}</code>
            <span style={{ color: '#64748b', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Meu portfólio de dev web">
  <meta property="og:title" content="Dev Web - Meu Site">
  <meta property="og:description" content="Aprenda HTML, CSS e JS">
  <title>Meu Site Incrível</title>
</head>
<body>
  <h1>Veja o &lt;head&gt; acima!</h1>
  <p>As meta tags não aparecem na tela, mas são essenciais para SEO e compartilhamento.</p>
  <div style="padding:12px;background:rgba(227,76,38,0.1);border-radius:8px;border:1px solid #e34c2644;margin-top:12px">
    <b style="color:#e34c26">💡 Dica:</b>
    <p style="margin:4px 0;color:#94a3b8;font-size:13px">
      Sempre inclua charset, viewport e description em todos os seus sites!
    </p>
  </div>
</body>
</html>`,
      mode: 'html',
    },
  },
];

// ─── Slides CSS ───────────────────────────────────────────────────────────────
const cssSlides: Slide[] = [
  {
    title: 'O que é CSS?',
    content: (
      <div>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: '#cbd5e1' }}>
          CSS é a <strong style={{ color: '#264de4' }}>linguagem de estilo</strong>. Ele define cores, fontes, tamanhos, posições e animações dos elementos HTML.
        </p>
        <div style={{ marginTop: 14, padding: '14px 18px', borderRadius: 12, background: 'rgba(38,77,228,0.1)', border: '1px solid rgba(38,77,228,0.3)' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#7eb3ff', marginBottom: 8 }}>Sintaxe básica:</p>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 14, color: '#e2e8f0', lineHeight: 1.8 }}>
{`seletor {
  propriedade: valor;
  cor: azul;
}`}
          </pre>
        </div>
      </div>
    ),
    playground: {
      html: `<h1>Olá CSS!</h1>
<p>Este parágrafo foi estilizado.</p>
<div class="caixa">Sou uma caixa bonita!</div>`,
      css: `body { font-family: sans-serif; padding: 20px; }
h1 { color: #7eb3ff; font-size: 28px; }
p { color: #94a3b8; }
.caixa {
  background: #264de4;
  color: white;
  padding: 16px;
  border-radius: 10px;
  margin-top: 12px;
  text-align: center;
  font-weight: bold;
}`,
      mode: 'css',
    },
  },
  {
    title: 'Seletores CSS',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>Seletores definem <em>qual elemento</em> você quer estilizar:</p>
        {[
          ['elemento', 'h1 { }', 'Seleciona todas as tags h1'],
          ['classe', '.nome { }', 'Seleciona elementos com class="nome"'],
          ['id', '#unico { }', 'Seleciona o elemento com id="unico"'],
          ['descendente', 'div p { }', 'Seleciona p dentro de div'],
          ['hover', 'a:hover { }', 'Aplica estilo ao passar o mouse'],
        ].map(([tipo, ex, desc]) => (
          <div key={tipo} style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(126,179,255,0.06)', borderRadius: 8, border: '1px solid rgba(126,179,255,0.15)' }}>
            <span style={{ color: '#7eb3ff', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>{ex}</span>
            <span style={{ color: '#64748b', fontSize: 12, marginLeft: 10 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<h1>Sou um título h1</h1>
<p class="destaque">Tenho a classe "destaque"</p>
<p id="unico">Tenho o id "unico"</p>
<div>
  <p>Parágrafo dentro de div</p>
</div>
<a href="#">Passe o mouse em mim!</a>`,
      css: `h1 { color: #7eb3ff; }
.destaque { color: #28c840; font-weight: bold; }
#unico { color: #febc2e; font-style: italic; }
div p { color: #a78bfa; }
a:hover { color: #ff5f57; text-decoration: none; }`,
      mode: 'css',
    },
  },
  {
    title: 'Box Model',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Todo elemento HTML é uma caixa com 4 camadas:
        </p>
        {[
          ['content', '#e34c26', 'O conteúdo real (texto, imagem)'],
          ['padding', '#febc2e', 'Espaço interno (entre conteúdo e borda)'],
          ['border', '#28c840', 'A borda do elemento'],
          ['margin', '#7eb3ff', 'Espaço externo (entre elementos)'],
        ].map(([nome, cor, desc]) => (
          <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: cor, flexShrink: 0 }} />
            <code style={{ color: cor, fontSize: 13, fontFamily: 'monospace', minWidth: 70 }}>{nome}</code>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<div class="caixa">Eu tenho padding, border e margin!</div>
<div class="caixa2">Outra caixa aqui embaixo</div>`,
      css: `.caixa {
  content: 'olá';
  padding: 20px;
  border: 3px solid #28c840;
  margin: 16px;
  background: rgba(40,200,64,0.1);
  color: #e2e8f0;
  border-radius: 8px;
}
.caixa2 {
  padding: 10px;
  border: 2px dashed #febc2e;
  margin: 16px;
  color: #e2e8f0;
  border-radius: 8px;
}`,
      mode: 'css',
    },
  },
  {
    title: 'Flexbox',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 10 }}>
          Flexbox é o sistema de layout mais usado. Com ele você alinha e distribui elementos facilmente.
        </p>
        {[
          ['display: flex', 'Ativa o flexbox no container'],
          ['justify-content', 'Alinha horizontalmente (center, space-between...)'],
          ['align-items', 'Alinha verticalmente (center, flex-start...)'],
          ['flex-direction', 'Direção: row (linha) ou column (coluna)'],
          ['gap', 'Espaço entre os itens'],
          ['flex: 1', 'Item ocupa o espaço disponível'],
        ].map(([prop, desc]) => (
          <div key={prop} style={{ marginBottom: 6 }}>
            <code style={{ color: '#7eb3ff', fontSize: 12, fontFamily: 'monospace' }}>{prop}</code>
            <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<div class="container">
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
</div>

<div class="container col">
  <div class="item">A</div>
  <div class="item">B</div>
</div>`,
      css: `.container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: rgba(126,179,255,0.08);
  border-radius: 10px;
  margin-bottom: 12px;
}
.col { flex-direction: column; align-items: stretch; }
.item {
  background: #264de4;
  color: white;
  padding: 14px 20px;
  border-radius: 8px;
  font-weight: bold;
  text-align: center;
}`,
      mode: 'css',
    },
  },
  {
    title: 'Cores e Gradientes',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 10 }}>Você pode usar cores de várias formas no CSS:</p>
        {[
          ['Nome', 'red, blue, green, purple'],
          ['HEX', '#ff0000, #6c63ff, #00d9ff'],
          ['RGB', 'rgb(255, 0, 0)'],
          ['RGBA', 'rgba(108, 99, 255, 0.5) — com transparência'],
          ['Gradiente', 'linear-gradient(135deg, #6c63ff, #00d9ff)'],
        ].map(([tipo, ex]) => (
          <div key={tipo} style={{ marginBottom: 6 }}>
            <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13, minWidth: 80, display: 'inline-block' }}>{tipo}:</span>
            <code style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>{ex}</code>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<div class="cor1">Cor HEX</div>
<div class="cor2">Cor RGB</div>
<div class="cor3">Cor RGBA</div>
<div class="cor4">Gradiente lindo!</div>`,
      css: `.cor1 { background: #6c63ff; color: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; font-weight: bold; }
.cor2 { background: rgb(0, 217, 255); color: #0f0f1a; padding: 12px; border-radius: 8px; margin-bottom: 8px; font-weight: bold; }
.cor3 { background: rgba(255, 107, 107, 0.5); color: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; font-weight: bold; }
.cor4 { background: linear-gradient(135deg, #6c63ff, #00d9ff); color: white; padding: 16px; border-radius: 10px; font-weight: bold; text-align: center; font-size: 18px; }`,
      mode: 'css',
    },
  },
  {
    title: 'CSS Grid',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 10 }}>
          CSS Grid é o sistema de layout 2D mais poderoso. Diferente do Flexbox (1D), o Grid controla linhas <em>e</em> colunas ao mesmo tempo.
        </p>
        {[
          ['display: grid', 'Ativa o Grid no container'],
          ['grid-template-columns', 'Define as colunas (ex: repeat(3, 1fr))'],
          ['grid-template-rows', 'Define as linhas'],
          ['gap', 'Espaçamento entre células'],
          ['grid-column: 1/3', 'Item ocupa da coluna 1 até 3'],
          ['place-items: center', 'Centraliza horizontal e verticalmente'],
        ].map(([prop, desc]) => (
          <div key={prop} style={{ marginBottom: 6 }}>
            <code style={{ color: '#7eb3ff', fontSize: 12, fontFamily: 'monospace' }}>{prop}</code>
            <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<div class="grid">
  <div class="item destaque">Cabeçalho (ocupa 3 colunas)</div>
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
  <div class="item">4</div>
  <div class="item">5</div>
  <div class="item destaque">Rodapé (ocupa 3 colunas)</div>
</div>`,
      css: `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 16px;
}
.item {
  background: rgba(38,77,228,0.2);
  border: 1px solid #264de466;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
  color: #7eb3ff;
  font-weight: bold;
}
.destaque {
  grid-column: 1 / 4;
  background: rgba(38,77,228,0.35);
  color: #fff;
}`,
      mode: 'css',
    },
  },
  {
    title: 'Transições e Animações',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 10 }}>
          CSS pode animar elementos sem JavaScript:
        </p>
        <div style={{ marginBottom: 10 }}>
          <p style={{ color: '#7eb3ff', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>transition — efeito suave ao mudar estado:</p>
          <code style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'monospace', display: 'block', background: 'rgba(126,179,255,0.05)', padding: '6px 10px', borderRadius: 6 }}>transition: propriedade duração easing;</code>
        </div>
        <div>
          <p style={{ color: '#7eb3ff', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>@keyframes — animação contínua:</p>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', background: 'rgba(126,179,255,0.05)', padding: '8px 10px', borderRadius: 6, lineHeight: 1.7 }}>
{`@keyframes pulsar {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.elemento { animation: pulsar 1s infinite; }`}
          </pre>
        </div>
      </div>
    ),
    playground: {
      html: `<button class="btn-hover">Passe o mouse!</button>
<div class="pulsando">● Pulsando</div>
<div class="girando">⟳ Girando</div>
<div class="deslizando">→ Deslizando</div>`,
      css: `.btn-hover {
  padding: 12px 24px;
  background: #264de4;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  display: block; margin-bottom: 16px;
}
.btn-hover:hover {
  background: #7eb3ff;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(38,77,228,0.5);
}
@keyframes pulsar {
  0%, 100% { transform: scale(1); color: #7eb3ff; }
  50% { transform: scale(1.15); color: #fff; }
}
.pulsando { animation: pulsar 1.2s infinite; font-size: 18px; margin-bottom: 12px; color: #7eb3ff; }

@keyframes girar {
  to { transform: rotate(360deg); }
}
.girando { display: inline-block; animation: girar 2s linear infinite; font-size: 24px; margin-bottom: 12px; }

@keyframes deslizar {
  0% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(30px); opacity: 0.5; }
  100% { transform: translateX(0); opacity: 1; }
}
.deslizando { animation: deslizar 1.5s ease-in-out infinite; font-size: 18px; color: #00d9ff; }`,
      mode: 'css',
    },
  },
  {
    title: 'Variáveis CSS (Custom Properties)',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Variáveis CSS permitem reusar valores e criar temas facilmente:
        </p>
        <div style={{ background: 'rgba(38,77,228,0.08)', borderRadius: 10, padding: 12, border: '1px solid rgba(38,77,228,0.2)', marginBottom: 10 }}>
          <p style={{ margin: '0 0 6px', color: '#7eb3ff', fontWeight: 700, fontSize: 13 }}>Declarar (no :root):</p>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 1.7 }}>
{`:root {
  --cor-primaria: #264de4;
  --espacamento: 16px;
  --raio: 10px;
}`}
          </pre>
        </div>
        <div style={{ background: 'rgba(108,99,255,0.08)', borderRadius: 10, padding: 12, border: '1px solid rgba(108,99,255,0.2)' }}>
          <p style={{ margin: '0 0 6px', color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>Usar:</p>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 1.7 }}>
{`.card {
  background: var(--cor-primaria);
  padding: var(--espacamento);
  border-radius: var(--raio);
}`}
          </pre>
        </div>
      </div>
    ),
    playground: {
      html: `<div class="card">Card com variáveis CSS</div>
<div class="card secundario">Card secundário</div>
<button onclick="mudarTema()">🎨 Mudar tema</button>`,
      css: `:root {
  --primaria: #264de4;
  --secundaria: #7eb3ff;
  --fundo: rgba(38,77,228,0.1);
  --raio: 12px;
  --espaco: 16px;
}
.card {
  background: var(--fundo);
  border: 1px solid var(--primaria);
  color: var(--secundaria);
  padding: var(--espaco);
  border-radius: var(--raio);
  margin-bottom: 10px;
  font-weight: bold;
  transition: all 0.4s;
}
.secundario { border-color: var(--secundaria); }
button { padding: 10px 20px; background: var(--primaria); color: white; border: none; border-radius: var(--raio); cursor: pointer; font-size: 15px; }`,
      js: `let tema = 0;
const temas = [
  { primaria: '#264de4', secundaria: '#7eb3ff', fundo: 'rgba(38,77,228,0.1)' },
  { primaria: '#e34c26', secundaria: '#febc2e', fundo: 'rgba(227,76,38,0.1)' },
  { primaria: '#28c840', secundaria: '#00d9ff', fundo: 'rgba(40,200,64,0.1)' },
];
function mudarTema() {
  tema = (tema + 1) % temas.length;
  const t = temas[tema];
  document.documentElement.style.setProperty('--primaria', t.primaria);
  document.documentElement.style.setProperty('--secundaria', t.secundaria);
  document.documentElement.style.setProperty('--fundo', t.fundo);
}`,
      mode: 'css',
    },
  },
  {
    title: 'Responsividade e Media Queries',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Media Queries adaptam o layout para diferentes tamanhos de tela:
        </p>
        <div style={{ background: 'rgba(38,77,228,0.08)', borderRadius: 10, padding: 12, border: '1px solid rgba(38,77,228,0.2)', marginBottom: 10 }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 1.8 }}>
{`/* Mobile first (recomendado) */
.container { flex-direction: column; }

/* Tablet (≥ 768px) */
@media (min-width: 768px) {
  .container { flex-direction: row; }
}

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .container { max-width: 1200px; }
}`}
          </pre>
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          💡 Sempre inclua <code style={{ color: '#7eb3ff' }}>meta viewport</code> no head para o responsivo funcionar no celular.
        </p>
      </div>
    ),
    playground: {
      html: `<div class="container">
  <div class="card">📱 Card 1</div>
  <div class="card">💻 Card 2</div>
  <div class="card">🖥️ Card 3</div>
</div>
<p class="info">Redimensione a janela para ver o efeito!</p>`,
      css: `/* Mobile: coluna */
.container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}
.card {
  background: rgba(38,77,228,0.15);
  border: 1px solid #264de466;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  color: #7eb3ff;
  font-weight: bold;
  font-size: 18px;
  transition: all 0.3s;
}
/* Desktop: linha */
@media (min-width: 500px) {
  .container { flex-direction: row; }
  .card { flex: 1; }
}
.info { text-align: center; color: #64748b; font-size: 13px; margin-top: 8px; }`,
      mode: 'css',
    },
  },
  {
    title: 'Pseudo-elementos e Pseudo-classes',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Pseudo-elementos e pseudo-classes adicionam estilo sem HTML extra:
        </p>
        <p style={{ color: '#7eb3ff', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Pseudo-classes (estado do elemento):</p>
        {[
          [':hover', 'Ao passar o mouse'],
          [':focus', 'Quando está com foco (clicado/tab)'],
          [':nth-child(2)', 'Segundo filho do pai'],
          [':not(.classe)', 'Todos exceto .classe'],
          [':first-child', 'Primeiro filho'],
        ].map(([ps, desc]) => (
          <div key={ps} style={{ marginBottom: 4 }}>
            <code style={{ color: '#7eb3ff', fontSize: 12, fontFamily: 'monospace', minWidth: 120, display: 'inline-block' }}>{ps}</code>
            <span style={{ color: '#64748b', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
        <p style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13, margin: '10px 0 6px' }}>Pseudo-elementos (partes do elemento):</p>
        {[
          ['::before', 'Insere conteúdo antes do elemento'],
          ['::after', 'Insere conteúdo depois do elemento'],
          ['::placeholder', 'Estiliza o placeholder do input'],
        ].map(([ps, desc]) => (
          <div key={ps} style={{ marginBottom: 4 }}>
            <code style={{ color: '#a78bfa', fontSize: 12, fontFamily: 'monospace', minWidth: 120, display: 'inline-block' }}>{ps}</code>
            <span style={{ color: '#64748b', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<ul class="lista">
  <li>Item 1</li>
  <li>Item 2 (par — azul)</li>
  <li>Item 3</li>
  <li>Item 4 (par — azul)</li>
</ul>

<input type="text" placeholder="Digite aqui..." class="campo">

<p class="citacao">CSS é poderoso!</p>`,
      css: `.lista { list-style: none; padding: 0; }
.lista li {
  padding: 10px 14px;
  border-radius: 8px;
  color: #e2e8f0;
  margin-bottom: 4px;
  background: rgba(255,255,255,0.03);
  transition: background 0.2s;
  position: relative;
}
.lista li:hover { background: rgba(126,179,255,0.12); cursor: pointer; }
.lista li:nth-child(even) { color: #7eb3ff; }
.lista li:first-child { font-weight: bold; color: #28c840; }

.campo { width: 100%; padding: 10px 14px; border-radius: 8px; background: #1a1a2e; border: 1px solid #264de4; color: #e2e8f0; margin: 10px 0; }
.campo::placeholder { color: #264de4; font-style: italic; }
.campo:focus { outline: none; border-color: #7eb3ff; box-shadow: 0 0 0 3px rgba(126,179,255,0.2); }

.citacao { position: relative; padding-left: 16px; color: #a78bfa; font-style: italic; }
.citacao::before { content: '"'; color: #6c63ff; font-size: 28px; position: absolute; left: 0; top: -6px; }
.citacao::after { content: '"'; color: #6c63ff; font-size: 28px; }`,
      mode: 'css',
    },
  },
];

// ─── Slides JavaScript ────────────────────────────────────────────────────────
const jsSlides: Slide[] = [
  {
    title: 'O que é JavaScript?',
    content: (
      <div>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: '#cbd5e1' }}>
          JavaScript é a linguagem que dá <strong style={{ color: '#f0db4f' }}>vida</strong> ao site. Com JS você cria interatividade, animações, validações e muito mais.
        </p>
        <div style={{ marginTop: 14, padding: '14px 18px', borderRadius: 12, background: 'rgba(240,219,79,0.08)', border: '1px solid rgba(240,219,79,0.25)' }}>
          <p style={{ margin: '4px 0', color: '#e2e8f0', fontSize: 14 }}>⚡ Responde a cliques e eventos</p>
          <p style={{ margin: '4px 0', color: '#e2e8f0', fontSize: 14 }}>🔄 Atualiza a página sem recarregar</p>
          <p style={{ margin: '4px 0', color: '#e2e8f0', fontSize: 14 }}>📡 Faz requisições para servidores</p>
          <p style={{ margin: '4px 0', color: '#e2e8f0', fontSize: 14 }}>🎮 Cria jogos e animações</p>
        </div>
      </div>
    ),
    playground: {
      html: `<h2 id="titulo">Clique no botão!</h2>
<button onclick="mudar()">Mudar texto</button>`,
      js: `function mudar() {
  const titulo = document.getElementById('titulo');
  titulo.textContent = '🎉 JavaScript funcionando!';
  titulo.style.color = '#f0db4f';
}`,
      mode: 'js',
    },
  },
  {
    title: 'Variáveis e Tipos',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Variáveis guardam dados. Use <code style={{ color: '#f0db4f' }}>let</code> e <code style={{ color: '#f0db4f' }}>const</code>:
        </p>
        {[
          ['const', 'Valor que não muda', '#28c840'],
          ['let', 'Valor que pode mudar', '#febc2e'],
        ].map(([k, v, c]) => (
          <div key={k} style={{ marginBottom: 6 }}>
            <code style={{ color: c as string, fontFamily: 'monospace', fontSize: 13 }}>{k}</code>
            <span style={{ color: '#64748b', fontSize: 13, marginLeft: 10 }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <p style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Tipos de dados:</p>
          {[
            ['"texto"', 'String — textos'],
            ['42', 'Number — números'],
            ['true/false', 'Boolean — verdadeiro/falso'],
            ['[1, 2, 3]', 'Array — lista de valores'],
            ['{ nome: "Gean" }', 'Object — objeto com propriedades'],
          ].map(([ex, desc]) => (
            <p key={ex} style={{ margin: '3px 0', fontSize: 13, color: '#94a3b8' }}>
              <code style={{ color: '#f0db4f', fontSize: 12, fontFamily: 'monospace' }}>{ex}</code>
              <span style={{ color: '#475569', marginLeft: 8 }}>→ {desc}</span>
            </p>
          ))}
        </div>
      </div>
    ),
    playground: {
      html: `<div id="saida"></div>`,
      js: `const nome = 'Gean';
let idade = 25;
const linguagens = ['HTML', 'CSS', 'JavaScript'];
const dev = { nome: nome, senior: true };

const saida = document.getElementById('saida');
saida.innerHTML = \`
  <p>Nome: <b>\${nome}</b></p>
  <p>Idade: <b>\${idade}</b></p>
  <p>Linguagens: <b>\${linguagens.join(', ')}</b></p>
  <p>É sênior? <b>\${dev.senior}</b></p>
\`;`,
      mode: 'js',
    },
  },
  {
    title: 'Funções',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Funções são blocos de código reutilizáveis. Você define uma vez e chama quantas vezes quiser.
        </p>
        <div style={{ background: 'rgba(240,219,79,0.07)', borderRadius: 10, padding: 12, border: '1px solid rgba(240,219,79,0.2)', marginBottom: 10 }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 1.8 }}>
{`// Função tradicional
function saudar(nome) {
  return 'Olá, ' + nome + '!';
}

// Arrow function (moderna)
const dobrar = (n) => n * 2;`}
          </pre>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>
          <code style={{ color: '#f0db4f' }}>return</code> — devolve um valor da função
        </p>
      </div>
    ),
    playground: {
      html: `<div id="resultado"></div>`,
      js: `function saudar(nome) {
  return '👋 Olá, ' + nome + '!';
}

const dobrar = (n) => n * 2;

const calcularIMC = (peso, altura) => {
  const imc = peso / (altura * altura);
  return imc.toFixed(2);
};

const div = document.getElementById('resultado');
div.innerHTML = \`
  <p>\${saudar('Gean')}</p>
  <p>10 dobrado = <b>\${dobrar(10)}</b></p>
  <p>IMC (70kg / 1.75m) = <b>\${calcularIMC(70, 1.75)}</b></p>
\`;`,
      mode: 'js',
    },
  },
  {
    title: 'Manipulando o DOM',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 10 }}>
          DOM = Document Object Model. É a representação da página em JavaScript. Você pode selecionar, criar, modificar e remover elementos.
        </p>
        {[
          ['document.getElementById("id")', 'Busca por ID'],
          ['document.querySelector(".classe")', 'Busca por seletor CSS'],
          ['elemento.textContent = "novo"', 'Muda o texto'],
          ['elemento.style.color = "red"', 'Muda o estilo'],
          ['elemento.innerHTML = "<b>html</b>"', 'Insere HTML'],
          ['elemento.classList.add("classe")', 'Adiciona classe CSS'],
        ].map(([code, desc]) => (
          <div key={code} style={{ marginBottom: 6, padding: '6px 10px', background: 'rgba(240,219,79,0.05)', borderRadius: 6 }}>
            <code style={{ color: '#f0db4f', fontSize: 11, fontFamily: 'monospace', display: 'block' }}>{code}</code>
            <span style={{ color: '#64748b', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<h2 id="titulo">Texto original</h2>
<p id="para">Parágrafo aqui</p>
<div id="lista"></div>
<button onclick="modificar()">Modificar tudo!</button>`,
      css: `.destaque { background: #f0db4f22; border: 1px solid #f0db4f44; border-radius: 6px; padding: 8px; }`,
      js: `function modificar() {
  // Mudando texto
  document.getElementById('titulo').textContent = '🔥 DOM Modificado!';

  // Mudando estilo
  document.getElementById('para').style.color = '#f0db4f';
  document.getElementById('para').style.fontWeight = 'bold';

  // Adicionando classe
  document.getElementById('titulo').classList.add('destaque');

  // Criando lista dinâmica
  const itens = ['HTML', 'CSS', 'JavaScript'];
  const lista = document.getElementById('lista');
  lista.innerHTML = itens.map(i => \`<li>\${i} ✅</li>\`).join('');
}`,
      mode: 'js',
    },
  },
  {
    title: 'Eventos',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 10 }}>
          Eventos são ações do usuário que você pode "ouvir" e responder com JavaScript:
        </p>
        {[
          ['click', 'Ao clicar'],
          ['input', 'Ao digitar em um campo'],
          ['submit', 'Ao enviar um formulário'],
          ['mouseover', 'Ao passar o mouse'],
          ['keydown', 'Ao pressionar uma tecla'],
          ['load', 'Quando a página carrega'],
        ].map(([ev, desc]) => (
          <div key={ev} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'center' }}>
            <code style={{ color: '#f0db4f', fontSize: 12, fontFamily: 'monospace', minWidth: 90 }}>{ev}</code>
            <span style={{ color: '#64748b', fontSize: 13 }}>{desc}</span>
          </div>
        ))}
        <p style={{ marginTop: 10, color: '#94a3b8', fontSize: 13 }}>
          Use <code style={{ color: '#f0db4f' }}>addEventListener('evento', função)</code> para ouvir eventos.
        </p>
      </div>
    ),
    playground: {
      html: `<input id="campo" type="text" placeholder="Digite algo...">
<p id="eco"></p>

<button id="btn">Clique aqui</button>
<p id="contagem">Cliques: 0</p>`,
      css: `input { padding: 8px 12px; border-radius: 8px; border: 1px solid #444; background: #1a1a2e; color: #e2e8f0; width: 100%; margin-bottom: 8px; }
button { padding: 8px 18px; border-radius: 8px; background: #f0db4f; color: #0f0f1a; border: none; cursor: pointer; font-weight: bold; }`,
      js: `// Evento de digitação
document.getElementById('campo').addEventListener('input', (e) => {
  document.getElementById('eco').textContent = '✍️ Você digitou: ' + e.target.value;
});

// Evento de clique com contador
let cliques = 0;
document.getElementById('btn').addEventListener('click', () => {
  cliques++;
  document.getElementById('contagem').textContent = 'Cliques: ' + cliques;
  if (cliques >= 5) {
    document.getElementById('btn').textContent = '🔥 Você é rápido!';
    document.getElementById('btn').style.background = '#ff5f57';
  }
});`,
      mode: 'js',
    },
  },
  {
    title: 'Arrays e seus métodos',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Arrays são listas. Os métodos modernos tornam a manipulação muito mais fácil:
        </p>
        {[
          ['map(fn)', 'Transforma cada item e retorna novo array'],
          ['filter(fn)', 'Retorna apenas itens que passam no teste'],
          ['reduce(fn, init)', 'Acumula valores em um único resultado'],
          ['find(fn)', 'Retorna o primeiro item que satisfaz a condição'],
          ['forEach(fn)', 'Executa uma função para cada item'],
          ['includes(val)', 'Verifica se o valor está no array'],
          ['sort(fn)', 'Ordena o array'],
          ['flat()', 'Achata arrays aninhados'],
        ].map(([m, desc]) => (
          <div key={m} style={{ marginBottom: 5 }}>
            <code style={{ color: '#f0db4f', fontSize: 12, fontFamily: 'monospace', minWidth: 140, display: 'inline-block' }}>.{m}</code>
            <span style={{ color: '#64748b', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<div id="saida" style="font-family:monospace;font-size:14px;line-height:2"></div>`,
      js: `const nums = [3, 7, 1, 9, 2, 5];
const devs = [
  { nome: 'Ana', nivel: 'senior' },
  { nome: 'Bob', nivel: 'junior' },
  { nome: 'Gean', nivel: 'senior' },
];

const dobrados = nums.map(n => n * 2);
const pares = nums.filter(n => n % 2 === 0);
const soma = nums.reduce((acc, n) => acc + n, 0);
const seniors = devs.filter(d => d.nivel === 'senior').map(d => d.nome);

document.getElementById('saida').innerHTML = \`
  <p>Array original: <b>[\${nums}]</b></p>
  <p>Dobrados (.map): <b>[\${dobrados}]</b></p>
  <p>Pares (.filter): <b>[\${pares}]</b></p>
  <p>Soma (.reduce): <b>\${soma}</b></p>
  <p>Seniors: <b>[\${seniors.join(', ')}]</b></p>
  <p>Ordenado: <b>[\${[...nums].sort((a,b) => a-b)}]</b></p>
\`;`,
      mode: 'js',
    },
  },
  {
    title: 'Condicionais e Operadores',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Condicionais controlam o fluxo do programa:
        </p>
        <div style={{ background: 'rgba(240,219,79,0.06)', borderRadius: 10, padding: 10, border: '1px solid rgba(240,219,79,0.2)', marginBottom: 10 }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 1.8 }}>
{`// if / else if / else
if (nota >= 7) {
  console.log('Aprovado!');
} else if (nota >= 5) {
  console.log('Recuperação');
} else {
  console.log('Reprovado');
}

// Operador ternário (if inline)
const msg = nota >= 7 ? 'Aprovado' : 'Reprovado';

// Nullish coalescing (??)
const nome = usuario?.nome ?? 'Anônimo';`}
          </pre>
        </div>
      </div>
    ),
    playground: {
      html: `<input id="nota" type="number" placeholder="Digite sua nota (0-10)" min="0" max="10">
<button onclick="verificar()">Verificar</button>
<div id="resultado" style="margin-top:12px;font-size:20px;font-weight:bold"></div>`,
      css: `input { padding: 10px; border-radius: 8px; background: #1a1a2e; border: 1px solid #444; color: #e2e8f0; width: 100%; margin-bottom: 8px; }
button { padding: 10px 20px; background: #f0db4f; color: #0f0f1a; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px; }`,
      js: `function verificar() {
  const nota = Number(document.getElementById('nota').value);
  const el = document.getElementById('resultado');

  if (nota === '' || isNaN(nota)) {
    el.textContent = '⚠️ Digite uma nota válida!';
    el.style.color = '#febc2e';
    return;
  }

  if (nota >= 9) {
    el.textContent = '🏆 Excelente! Nota: ' + nota;
    el.style.color = '#28c840';
  } else if (nota >= 7) {
    el.textContent = '✅ Aprovado! Nota: ' + nota;
    el.style.color = '#7eb3ff';
  } else if (nota >= 5) {
    el.textContent = '⚠️ Recuperação. Nota: ' + nota;
    el.style.color = '#febc2e';
  } else {
    el.textContent = '❌ Reprovado. Nota: ' + nota;
    el.style.color = '#ff5f57';
  }
}`,
      mode: 'js',
    },
  },
  {
    title: 'Loops (for, while, forEach)',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          Loops repetem código. Escolha o certo para cada situação:
        </p>
        <div style={{ background: 'rgba(240,219,79,0.06)', borderRadius: 10, padding: 10, border: '1px solid rgba(240,219,79,0.2)' }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 1.9 }}>
{`// for — quando você sabe quantas vezes
for (let i = 0; i < 5; i++) { ... }

// for...of — para arrays
for (const item of array) { ... }

// for...in — para objetos (chaves)
for (const chave in objeto) { ... }

// while — enquanto condição for verdadeira
while (tentativas < 3) { ... }

// forEach — método de array
array.forEach((item, index) => { ... })`}
          </pre>
        </div>
      </div>
    ),
    playground: {
      html: `<div id="tabuada"></div>
<div id="lista"></div>`,
      css: `#tabuada, #lista { font-family: monospace; font-size: 14px; line-height: 1.8; padding: 10px; }
.item { padding: 4px 8px; border-radius: 6px; display: inline-block; margin: 3px; background: rgba(240,219,79,0.1); border: 1px solid rgba(240,219,79,0.3); color: #f0db4f; }`,
      js: `// Tabuada do 7 com for
const tabuada = document.getElementById('tabuada');
tabuada.innerHTML = '<b style="color:#f0db4f">Tabuada do 7:</b><br>';
for (let i = 1; i <= 10; i++) {
  tabuada.innerHTML += \`7 × \${i} = <b>\${7 * i}</b><br>\`;
}

// Lista de linguagens com forEach
const linguagens = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'];
const lista = document.getElementById('lista');
lista.innerHTML = '<b style="color:#f0db4f">Linguagens:</b><br>';
linguagens.forEach((lang, i) => {
  lista.innerHTML += \`<span class="item">\${i + 1}. \${lang}</span>\`;
});`,
      mode: 'js',
    },
  },
  {
    title: 'Fetch API — Consumindo dados externos',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          <code style={{ color: '#f0db4f' }}>fetch()</code> busca dados de APIs externas. É assíncrono — use <code style={{ color: '#f0db4f' }}>async/await</code>:
        </p>
        <div style={{ background: 'rgba(240,219,79,0.06)', borderRadius: 10, padding: 10, border: '1px solid rgba(240,219,79,0.2)', marginBottom: 10 }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 1.8 }}>
{`async function buscarDados() {
  try {
    const resposta = await fetch('https://api.exemplo.com/dados');
    const dados = await resposta.json();
    console.log(dados);
  } catch (erro) {
    console.error('Erro:', erro);
  }
}`}
          </pre>
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          💡 <code style={{ color: '#f0db4f' }}>await</code> pausa a execução até a promise resolver. Sempre use <code style={{ color: '#f0db4f' }}>try/catch</code> para erros!
        </p>
      </div>
    ),
    playground: {
      html: `<button onclick="buscarPokemon()">🎮 Buscar Pokémon aleatório</button>
<div id="card" style="margin-top:14px"></div>`,
      css: `button { padding: 12px 24px; background: #f0db4f; color: #0f0f1a; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 15px; }
#card { background: rgba(240,219,79,0.06); border: 1px solid rgba(240,219,79,0.2); border-radius: 12px; padding: 16px; display: none; text-align: center; }`,
      js: `async function buscarPokemon() {
  const card = document.getElementById('card');
  card.style.display = 'block';
  card.innerHTML = '⏳ Carregando...';

  try {
    const id = Math.floor(Math.random() * 151) + 1;
    const res = await fetch(\`https://pokeapi.co/api/v2/pokemon/\${id}\`);
    const data = await res.json();

    card.innerHTML = \`
      <img src="\${data.sprites.front_default}" style="width:96px;image-rendering:pixelated">
      <h3 style="color:#f0db4f;text-transform:capitalize">\${data.name}</h3>
      <p style="color:#94a3b8">HP: <b>\${data.stats[0].base_stat}</b> | Peso: <b>\${data.weight/10}kg</b></p>
      <p style="color:#64748b;font-size:12px">ID: #\${String(id).padStart(3,'0')}</p>
    \`;
  } catch(e) {
    card.innerHTML = '❌ Erro ao buscar dados. Verifique a conexão.';
  }
}`,
      mode: 'js',
    },
  },
  {
    title: 'LocalStorage — Salvando dados no browser',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', marginBottom: 12 }}>
          LocalStorage guarda dados no navegador do usuário — persistem mesmo fechando a aba:
        </p>
        {[
          ['localStorage.setItem("chave", valor)', 'Salva um valor (sempre string)'],
          ['localStorage.getItem("chave")', 'Lê um valor salvo'],
          ['localStorage.removeItem("chave")', 'Remove um item'],
          ['localStorage.clear()', 'Remove tudo'],
          ['JSON.stringify(obj)', 'Converte objeto para string (para salvar)'],
          ['JSON.parse(str)', 'Converte string de volta para objeto'],
        ].map(([code, desc]) => (
          <div key={code} style={{ marginBottom: 7, padding: '6px 10px', background: 'rgba(240,219,79,0.05)', borderRadius: 6 }}>
            <code style={{ color: '#f0db4f', fontSize: 11, fontFamily: 'monospace', display: 'block', marginBottom: 1 }}>{code}</code>
            <span style={{ color: '#64748b', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
    playground: {
      html: `<input id="nome-input" type="text" placeholder="Digite seu nome">
<button onclick="salvar()">💾 Salvar</button>
<button onclick="carregar()">📂 Carregar</button>
<button onclick="limpar()">🗑️ Limpar</button>
<p id="status" style="margin-top:12px;font-size:15px"></p>`,
      css: `input { padding: 10px; border-radius: 8px; background: #1a1a2e; border: 1px solid #444; color: #e2e8f0; width: 100%; margin-bottom: 8px; }
button { padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; margin-right: 6px; margin-bottom: 6px; font-size: 13px; }
button:nth-child(2) { background: #f0db4f; color: #0f0f1a; }
button:nth-child(3) { background: #264de4; color: white; }
button:nth-child(4) { background: #ff5f5740; color: #ff5f57; border: 1px solid #ff5f5760; }`,
      js: `function salvar() {
  const nome = document.getElementById('nome-input').value;
  if (!nome) { mostrar('⚠️ Digite um nome primeiro!', '#febc2e'); return; }
  localStorage.setItem('meu-nome', nome);
  mostrar('✅ Salvo: "' + nome + '"', '#28c840');
}
function carregar() {
  const nome = localStorage.getItem('meu-nome');
  if (nome) mostrar('📂 Carregado: "' + nome + '"', '#7eb3ff');
  else mostrar('❌ Nenhum dado salvo ainda.', '#ff5f57');
}
function limpar() {
  localStorage.removeItem('meu-nome');
  mostrar('🗑️ Dado removido do localStorage', '#94a3b8');
}
function mostrar(texto, cor) {
  const el = document.getElementById('status');
  el.textContent = texto;
  el.style.color = cor;
}
// Carrega automaticamente ao abrir
carregar();`,
      mode: 'js',
    },
  },
];

// ─── Slide do Desafio Final ───────────────────────────────────────────────────
const finalSlides: Slide[] = [
  /* ─── Desafio 1 ─── */
  {
    title: 'Desafio 1 — Sua Página Pessoal',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.8, marginBottom: 10 }}>
          Junte <strong style={{ color: '#e34c26' }}>HTML</strong>, <strong style={{ color: '#7eb3ff' }}>CSS</strong> e <strong style={{ color: '#f0db4f' }}>JS</strong> para criar sua primeira página do zero!
        </p>
        <div style={{ background: 'rgba(108,99,255,0.1)', borderRadius: 12, padding: 14, border: '1px solid rgba(108,99,255,0.3)', marginBottom: 10 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#a78bfa' }}>Missão:</p>
          {['Adicione seu nome e uma descrição','Use pelo menos 3 estilos CSS diferentes','Crie um botão com ação JavaScript','Use Flexbox para organizar o layout'].map(t => (
            <p key={t} style={{ margin: '4px 0', color: '#cbd5e1', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#28c840" strokeWidth="1.2"/><path d="M4 7l2.5 2.5 3.5-4" stroke="#28c840" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {t}
            </p>
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>Edite o código e deixe no seu estilo!</p>
      </div>
    ),
    playground: {
      html: `<div class="pagina">
  <header class="cabecalho">
    <h1 id="meu-nome">Seu Nome Aqui</h1>
    <p>Desenvolvedor(a) Web 🚀</p>
  </header>
  <main class="conteudo">
    <section class="sobre">
      <h2>Sobre mim</h2>
      <p>Estou aprendendo desenvolvimento web!</p>
    </section>
    <section class="skills">
      <div class="skill">HTML</div>
      <div class="skill">CSS</div>
      <div class="skill">JavaScript</div>
    </section>
    <button onclick="celebrar()">🎉 Clique aqui!</button>
    <p id="mensagem"></p>
  </main>
  <footer>Feito com ❤️ por mim</footer>
</div>`,
      css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; background: #0f0f1a; color: #e2e8f0; }
.pagina { max-width: 560px; margin: 0 auto; padding: 20px; }
.cabecalho { text-align: center; padding: 24px; background: linear-gradient(135deg,#6c63ff33,#00d9ff22); border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(108,99,255,0.3); }
.cabecalho h1 { font-size: 26px; color: #a78bfa; margin-bottom: 6px; }
.cabecalho p { color: #64748b; }
.conteudo { display: flex; flex-direction: column; gap: 14px; }
.sobre { background: rgba(255,255,255,0.04); padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
.sobre h2 { color: #00d9ff; margin-bottom: 6px; }
.skills { display: flex; gap: 8px; flex-wrap: wrap; }
.skill { padding: 7px 14px; border-radius: 20px; background: rgba(108,99,255,0.2); border: 1px solid rgba(108,99,255,0.4); color: #a78bfa; font-weight: bold; font-size: 13px; }
button { padding: 12px; background: linear-gradient(135deg,#6c63ff,#00d9ff); color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: bold; width: 100%; transition: transform 0.2s; }
button:hover { transform: scale(1.03); }
#mensagem { text-align: center; font-size: 17px; min-height: 22px; }
footer { text-align: center; padding: 14px; color: #475569; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); }`,
      js: `function celebrar() {
  const msgs = ['🎉 Você é incrível!','🚀 Dev em formação!','💜 Continue assim!','🔥 HTML+CSS+JS = Poder!'];
  document.getElementById('mensagem').textContent = msgs[Math.floor(Math.random()*msgs.length)];
  document.querySelectorAll('.skill').forEach((el,i) => {
    setTimeout(() => {
      el.style.background = 'rgba(0,217,255,0.3)';
      el.style.borderColor = '#00d9ff';
      setTimeout(() => { el.style.background=''; el.style.borderColor=''; }, 600);
    }, i*150);
  });
}`,
      mode: 'full',
    },
  },

  /* ─── Desafio 2 ─── */
  {
    title: 'Desafio 2 — Calculadora',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.8, marginBottom: 10 }}>
          Crie uma <strong style={{ color: '#f0db4f' }}>calculadora simples</strong> usando HTML, CSS e JavaScript puro!
        </p>
        <div style={{ background: 'rgba(240,219,79,0.08)', borderRadius: 12, padding: 14, border: '1px solid rgba(240,219,79,0.25)', marginBottom: 10 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#f0db4f' }}>Missão:</p>
          {['Mostre o número digitado em um display','Botões de 0–9 somam ao display','Botão = calcula o resultado','Botão C limpa o display'].map(t => (
            <p key={t} style={{ margin: '4px 0', color: '#cbd5e1', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#f0db4f" strokeWidth="1.2"/><path d="M4 7l2.5 2.5 3.5-4" stroke="#f0db4f" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {t}
            </p>
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>Dica: use <code style={{ color: '#f0db4f' }}>eval()</code> ou lógica manual para calcular.</p>
      </div>
    ),
    playground: {
      html: `<div class="calc">
  <div class="display" id="display">0</div>
  <div class="botoes">
    <button class="btn op" onclick="limpar()">C</button>
    <button class="btn op" onclick="digitar('/')">÷</button>
    <button class="btn op" onclick="digitar('*')">×</button>
    <button class="btn op" onclick="digitar('-')">−</button>
    <button class="btn" onclick="digitar('7')">7</button>
    <button class="btn" onclick="digitar('8')">8</button>
    <button class="btn" onclick="digitar('9')">9</button>
    <button class="btn op" onclick="digitar('+')">+</button>
    <button class="btn" onclick="digitar('4')">4</button>
    <button class="btn" onclick="digitar('5')">5</button>
    <button class="btn" onclick="digitar('6')">6</button>
    <button class="btn zero" onclick="digitar('0')">0</button>
    <button class="btn" onclick="digitar('1')">1</button>
    <button class="btn" onclick="digitar('2')">2</button>
    <button class="btn" onclick="digitar('3')">3</button>
    <button class="btn igual" onclick="calcular()">=</button>
  </div>
</div>`,
      css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0f0f1a; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
.calc { background: #1a1a2e; border-radius: 20px; padding: 20px; width: 260px; box-shadow: 0 0 30px rgba(108,99,255,0.3); border: 1px solid rgba(108,99,255,0.2); }
.display { background: #0d0d1a; color: #e2e8f0; font-size: 28px; text-align: right; padding: 14px 16px; border-radius: 12px; margin-bottom: 14px; min-height: 56px; word-break: break-all; border: 1px solid rgba(255,255,255,0.06); }
.botoes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.btn { padding: 14px; border: none; border-radius: 10px; background: rgba(255,255,255,0.06); color: #e2e8f0; font-size: 17px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.btn:hover { background: rgba(108,99,255,0.25); }
.btn:active { transform: scale(0.92); }
.op { color: #a78bfa; background: rgba(108,99,255,0.12); }
.igual { background: linear-gradient(135deg,#6c63ff,#00d9ff); color: #fff; grid-row: span 2; }
.zero { grid-column: span 1; }`,
      js: `let expr = '';
function digitar(v) {
  if (expr === '0' && !isNaN(v)) expr = v;
  else expr += v;
  document.getElementById('display').textContent = expr;
}
function calcular() {
  try {
    const r = Function('"use strict"; return (' + expr + ')')();
    expr = String(parseFloat(r.toFixed(8)));
    document.getElementById('display').textContent = expr;
  } catch { document.getElementById('display').textContent = 'Erro'; expr = ''; }
}
function limpar() { expr = ''; document.getElementById('display').textContent = '0'; }`,
      mode: 'full',
    },
  },

  /* ─── Desafio 3 ─── */
  {
    title: 'Desafio 3 — Lista de Tarefas',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.8, marginBottom: 10 }}>
          Crie um <strong style={{ color: '#00d9ff' }}>To-Do List</strong> funcional — adicione, marque como feito e remova tarefas!
        </p>
        <div style={{ background: 'rgba(0,217,255,0.07)', borderRadius: 12, padding: 14, border: '1px solid rgba(0,217,255,0.2)', marginBottom: 10 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#00d9ff' }}>Missão:</p>
          {['Campo de texto + botão Adicionar','Tarefas aparecem em uma lista','Clicar na tarefa risca como concluída','Botão × remove a tarefa'].map(t => (
            <p key={t} style={{ margin: '4px 0', color: '#cbd5e1', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#00d9ff" strokeWidth="1.2"/><path d="M4 7l2.5 2.5 3.5-4" stroke="#00d9ff" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {t}
            </p>
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>Dica: use <code style={{ color: '#00d9ff' }}>createElement</code> e <code style={{ color: '#00d9ff' }}>appendChild</code>.</p>
      </div>
    ),
    playground: {
      html: `<div class="app">
  <h1>📝 Minhas Tarefas</h1>
  <div class="input-row">
    <input id="nova" type="text" placeholder="Nova tarefa..." />
    <button onclick="adicionar()">+ Adicionar</button>
  </div>
  <ul id="lista"></ul>
  <p id="vazio" style="color:#475569;text-align:center;margin-top:16px">Nenhuma tarefa ainda!</p>
</div>`,
      css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0f0f1a; font-family: sans-serif; display: flex; justify-content: center; padding: 30px 14px; }
.app { width: 100%; max-width: 440px; }
h1 { color: #00d9ff; font-size: 22px; margin-bottom: 16px; text-align: center; }
.input-row { display: flex; gap: 8px; margin-bottom: 16px; }
input { flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(0,217,255,0.3); background: rgba(255,255,255,0.04); color: #e2e8f0; font-size: 14px; outline: none; }
input:focus { border-color: #00d9ff; }
button { padding: 10px 16px; background: linear-gradient(135deg,#00d9ff,#6c63ff); border: none; border-radius: 10px; color: #fff; font-weight: 700; cursor: pointer; white-space: nowrap; font-size: 13px; }
ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
li { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
li:hover { border-color: rgba(0,217,255,0.3); }
li.done { opacity: 0.45; text-decoration: line-through; color: #64748b; }
li span.texto { flex: 1; color: #e2e8f0; font-size: 14px; }
li button.rem { background: rgba(255,107,107,0.15); border: none; border-radius: 8px; color: #ff6b6b; font-size: 15px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }`,
      js: `function atualizar() {
  document.getElementById('vazio').style.display =
    document.getElementById('lista').children.length === 0 ? 'block' : 'none';
}
function adicionar() {
  const inp = document.getElementById('nova');
  const txt = inp.value.trim();
  if (!txt) return;
  const li = document.createElement('li');
  li.innerHTML = \`<span class="texto">\${txt}</span><button class="rem" onclick="remover(this)">×</button>\`;
  li.querySelector('.texto').addEventListener('click', () => li.classList.toggle('done'));
  document.getElementById('lista').appendChild(li);
  inp.value = '';
  atualizar();
}
function remover(btn) { btn.parentElement.remove(); atualizar(); }
document.getElementById('nova').addEventListener('keydown', e => { if(e.key==='Enter') adicionar(); });
atualizar();`,
      mode: 'full',
    },
  },

  /* ─── Desafio 4 ─── */
  {
    title: 'Desafio 4 — Gerador de Cores',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.8, marginBottom: 10 }}>
          Crie um <strong style={{ color: '#ff6b6b' }}>gerador de paleta de cores</strong> aleatórias com cópia de HEX!
        </p>
        <div style={{ background: 'rgba(255,107,107,0.07)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,107,107,0.2)', marginBottom: 10 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#ff6b6b' }}>Missão:</p>
          {['Gere 5 cores aleatórias ao clicar','Cada card mostra a cor + código HEX','Clicar em um card copia o HEX','Animação suave ao gerar novas cores'].map(t => (
            <p key={t} style={{ margin: '4px 0', color: '#cbd5e1', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#ff6b6b" strokeWidth="1.2"/><path d="M4 7l2.5 2.5 3.5-4" stroke="#ff6b6b" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {t}
            </p>
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>Dica: <code style={{ color: '#ff6b6b' }}>Math.random()</code> + <code style={{ color: '#ff6b6b' }}>toString(16)</code>.</p>
      </div>
    ),
    playground: {
      html: `<div class="app">
  <h1>🎨 Gerador de Cores</h1>
  <button id="gerar" onclick="gerarPaleta()">✨ Gerar Paleta</button>
  <div class="paleta" id="paleta"></div>
  <p id="copiado" style="display:none;color:#28c840;text-align:center;margin-top:10px;font-weight:bold"></p>
</div>`,
      css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0f0f1a; font-family: sans-serif; display: flex; justify-content: center; padding: 30px 14px; }
.app { width: 100%; max-width: 520px; text-align: center; }
h1 { color: #e2e8f0; font-size: 20px; margin-bottom: 18px; }
#gerar { padding: 11px 28px; background: linear-gradient(135deg,#ff6b6b,#a78bfa); border: none; border-radius: 12px; color: #fff; font-weight: 900; font-size: 15px; cursor: pointer; margin-bottom: 20px; transition: transform 0.15s; }
#gerar:hover { transform: scale(1.05); }
.paleta { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.cor { width: 90px; border-radius: 14px; overflow: hidden; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
.cor:hover { transform: translateY(-6px) scale(1.05); }
.swatch { height: 80px; transition: background 0.4s; }
.hex { padding: 6px 4px; font-size: 11px; font-weight: 700; font-family: monospace; background: rgba(255,255,255,0.05); color: #e2e8f0; text-align: center; }`,
      js: `function hex() {
  return '#' + Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
}
function gerarPaleta() {
  const p = document.getElementById('paleta');
  p.innerHTML = '';
  for(let i=0;i<5;i++){
    const c = hex();
    const div = document.createElement('div');
    div.className = 'cor';
    div.innerHTML = \`<div class="swatch" style="background:\${c}"></div><div class="hex">\${c}</div>\`;
    div.title = 'Clique para copiar';
    div.addEventListener('click', () => {
      navigator.clipboard?.writeText(c).catch(()=>{});
      const msg = document.getElementById('copiado');
      msg.textContent = c + ' copiado!';
      msg.style.display = 'block';
      setTimeout(()=>msg.style.display='none', 1800);
    });
    p.appendChild(div);
  }
}
gerarPaleta();`,
      mode: 'full',
    },
  },

  /* ─── Desafio 5 ─── */
  {
    title: 'Desafio 5 — Quiz de Programação',
    content: (
      <div>
        <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.8, marginBottom: 10 }}>
          Crie um <strong style={{ color: '#28c840' }}>quiz interativo</strong> com 5 perguntas sobre o que você aprendeu!
        </p>
        <div style={{ background: 'rgba(40,200,64,0.07)', borderRadius: 12, padding: 14, border: '1px solid rgba(40,200,64,0.2)', marginBottom: 10 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#28c840' }}>Missão:</p>
          {['Mostre uma pergunta por vez','4 opções de resposta por pergunta','Verde = acerto, vermelho = erro','Placar final com porcentagem de acertos'].map(t => (
            <p key={t} style={{ margin: '4px 0', color: '#cbd5e1', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#28c840" strokeWidth="1.2"/><path d="M4 7l2.5 2.5 3.5-4" stroke="#28c840" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {t}
            </p>
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>Última missão — você consegue! 🏆</p>
      </div>
    ),
    playground: {
      html: `<div class="quiz" id="quiz">
  <div id="tela-pergunta">
    <p id="progresso"></p>
    <h2 id="pergunta"></h2>
    <div id="opcoes"></div>
  </div>
  <div id="tela-final" style="display:none;text-align:center">
    <div style="font-size:48px;margin-bottom:10px" id="emoji-final"></div>
    <h2 id="placar-final"></h2>
    <p id="msg-final" style="color:#94a3b8;margin:8px 0 16px"></p>
    <button onclick="reiniciar()">🔄 Jogar de novo</button>
  </div>
</div>`,
      css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0f0f1a; font-family: sans-serif; display: flex; justify-content: center; padding: 30px 14px; color: #e2e8f0; }
.quiz { width: 100%; max-width: 480px; }
#progresso { color: #64748b; font-size: 13px; margin-bottom: 10px; }
h2 { font-size: 18px; margin-bottom: 16px; line-height: 1.5; }
#opcoes { display: flex; flex-direction: column; gap: 8px; }
.opcao { padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #e2e8f0; font-size: 14px; cursor: pointer; text-align: left; transition: all 0.2s; }
.opcao:hover { border-color: rgba(108,99,255,0.5); background: rgba(108,99,255,0.1); }
.opcao.certa { background: rgba(40,200,64,0.2); border-color: #28c840; color: #28c840; cursor: default; }
.opcao.errada { background: rgba(255,107,107,0.2); border-color: #ff6b6b; color: #ff6b6b; cursor: default; }
button { padding: 11px 24px; background: linear-gradient(135deg,#6c63ff,#00d9ff); border: none; border-radius: 12px; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 8px; }`,
      js: `const perguntas = [
  { p: 'Qual tag HTML cria um título principal?', ops: ['<p>', '<h1>', '<div>', '<span>'], c: 1 },
  { p: 'Qual propriedade CSS muda a cor do texto?', ops: ['background', 'font-size', 'color', 'border'], c: 2 },
  { p: 'O que o display:flex faz?', ops: ['Esconde o elemento','Transforma em link','Organiza filhos em linha/coluna','Aumenta a fonte'], c: 2 },
  { p: 'Como declarar uma variável em JS moderno?', ops: ['var x = 1', 'let x = 1', 'int x = 1', 'dim x = 1'], c: 1 },
  { p: 'O que é DOM?', ops: ['Banco de dados','Representação da página em objetos JS','Linguagem de estilo','Tipo de servidor'], c: 1 },
];
let atual = 0, acertos = 0;
function render() {
  const q = perguntas[atual];
  document.getElementById('progresso').textContent = \`Pergunta \${atual+1} de \${perguntas.length}\`;
  document.getElementById('pergunta').textContent = q.p;
  const div = document.getElementById('opcoes');
  div.innerHTML = '';
  q.ops.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.className = 'opcao';
    btn.textContent = op;
    btn.addEventListener('click', () => responder(i));
    div.appendChild(btn);
  });
}
function responder(i) {
  const q = perguntas[atual];
  document.querySelectorAll('.opcao').forEach((b,j) => {
    b.classList.add(j===q.c ? 'certa' : 'errada');
  });
  if(i===q.c) acertos++;
  setTimeout(() => { atual++; atual < perguntas.length ? render() : final(); }, 900);
}
function final() {
  document.getElementById('tela-pergunta').style.display='none';
  document.getElementById('tela-final').style.display='block';
  const pct = Math.round(acertos/perguntas.length*100);
  document.getElementById('emoji-final').textContent = pct===100?'🏆':pct>=60?'🎉':'💪';
  document.getElementById('placar-final').textContent = \`\${acertos}/\${perguntas.length} acertos (\${pct}%)\`;
  document.getElementById('msg-final').textContent = pct===100?'Perfeito! Você dominou tudo!':pct>=60?'Muito bom! Continue praticando!':'Não desista, revise os módulos!';
}
function reiniciar() {
  atual=0; acertos=0;
  document.getElementById('tela-pergunta').style.display='block';
  document.getElementById('tela-final').style.display='none';
  render();
}
render();`,
      mode: 'full',
    },
  },
];

function SvgHTML() {
  return (
    <img src="/html-5-svgrepo-com.svg" alt="HTML" width={44} height={44} style={{ display: 'block' }} />
  );
}
function SvgCSS() {
  return (
    <img src="/css-3-logo-svgrepo-com.svg" alt="CSS" width={44} height={44} style={{ display: 'block' }} />
  );
}
function SvgJS() {
  return (
    <img src="/javascript-svgrepo-com.svg" alt="JavaScript" width={44} height={44} style={{ display: 'block' }} />
  );
}
function SvgTrophy() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M14 6h16v14a8 8 0 01-16 0V6z" fill="rgba(108,99,255,0.2)" stroke="#a78bfa" strokeWidth="1.5"/>
      <path d="M14 12H8a4 4 0 004 4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M30 12h6a4 4 0 01-4 4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <line x1="22" y1="20" x2="22" y2="30" stroke="#a78bfa" strokeWidth="1.5"/>
      <rect x="15" y="30" width="14" height="3" rx="1.5" fill="#a78bfa"/>
      <rect x="12" y="33" width="20" height="3" rx="2" fill="rgba(108,99,255,0.4)" stroke="#a78bfa" strokeWidth="1"/>
    </svg>
  );
}
function SvgLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="9" rx="2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="10" cy="14" r="1.2" fill="rgba(255,255,255,0.3)"/>
    </svg>
  );
}
function SvgCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="rgba(40,200,64,0.2)" stroke="#28c840" strokeWidth="1.5"/>
      <path d="M6 10l3 3 5-5" stroke="#28c840" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const modules = [
  { id: 'html' as ModuleId, label: 'HTML', color: '#e34c26', Icon: SvgHTML, desc: '10 lições', slides: htmlSlides },
  { id: 'css'  as ModuleId, label: 'CSS',  color: '#264de4', Icon: SvgCSS,  desc: '10 lições', slides: cssSlides },
  { id: 'js'   as ModuleId, label: 'JS',   color: '#f0db4f', Icon: SvgJS,   desc: '10 lições', slides: jsSlides  },
  { id: 'final' as ModuleId, label: 'Desafio Final', color: '#6c63ff', Icon: SvgTrophy, desc: '5 desafios práticos', slides: [] },
];

export default function DevLearn() {
  const [activeModule, setActiveModule] = useState<ModuleId>('home');
  const [slideIndex, setSlideIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<ModuleId>>(() => {
    try {
      const saved = localStorage.getItem('devlearn_completed');
      if (saved) {
        const arr: ModuleId[] = JSON.parse(saved);
        return new Set(arr);
      }
    } catch { /* ignora */ }
    return new Set();
  });
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 700 : false
  );

  // Persiste progresso no localStorage sempre que completedModules mudar
  useEffect(() => {
    try {
      localStorage.setItem('devlearn_completed', JSON.stringify([...completedModules]));
    } catch { /* ignora */ }
  }, [completedModules]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const currentModule = modules.find((m) => m.id === activeModule);
  const slides = activeModule === 'final' ? finalSlides : currentModule?.slides ?? [];
  const slide = slides[slideIndex];
  const isLast = slideIndex === slides.length - 1;

  const goToModule = (id: ModuleId) => { setActiveModule(id); setSlideIndex(0); };
  const goBack = () => { if (slideIndex > 0) setSlideIndex(slideIndex - 1); else setActiveModule('home'); };
  const goNext = () => {
    if (!isLast) { setSlideIndex(slideIndex + 1); }
    else { setCompletedModules((prev) => new Set([...prev, activeModule])); setActiveModule('home'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080812', color: '#e2e8f0' }}>
      {/* ── Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,8,18,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(108,99,255,0.2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => {
            if (activeModule !== 'home') {
              setActiveModule('home');
            } else {
              window.location.href = '/';
            }
          }}
          style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '6px 12px', color: '#a78bfa', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          ← {activeModule !== 'home' ? 'Menu' : 'Voltar'}
        </motion.button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/develope.svg" alt="" style={{ width: 26, height: 26 }} />
          <span style={{ fontWeight: 900, fontSize: 17, background: 'linear-gradient(135deg, #6c63ff, #00d9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DevLearn</span>
        </div>
        {activeModule !== 'home' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ color: '#475569', fontSize: 12 }}>{slideIndex + 1}/{slides.length}</span>
            <div style={{ width: 70, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${((slideIndex + 1) / slides.length) * 100}%`, height: '100%', background: currentModule?.color ?? '#6c63ff', transition: 'width 0.3s', borderRadius: 4 }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 14px' }}>
        <AnimatePresence mode="wait">

          {/* ── Home ── */}
          {activeModule === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 900, marginBottom: 10, background: 'linear-gradient(135deg, #6c63ff, #00d9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
                  Aprenda Dev do Zero
                </h1>
                <p style={{ color: '#64748b', fontSize: 14, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
                  Aulas interativas com exemplos ao vivo. Complete HTML, CSS e JS para desbloquear o Desafio Final!
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {modules.map((mod) => {
                  const done = completedModules.has(mod.id);
                  const isFinalLocked = mod.id === 'final' && ['html','css','js'].filter(id => completedModules.has(id as ModuleId)).length < 3;
                  return (
                    <motion.button
                      key={mod.id}
                      whileHover={!isFinalLocked ? { scale: 1.03, y: -3 } : {}}
                      whileTap={!isFinalLocked ? { scale: 0.96 } : {}}
                      onClick={() => !isFinalLocked && goToModule(mod.id)}
                      style={{
                        background: done ? `${mod.color}12` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${done ? mod.color + '55' : isFinalLocked ? 'rgba(255,255,255,0.07)' : mod.color + '35'}`,
                        borderRadius: 16,
                        padding: '20px 16px',
                        textAlign: 'left',
                        cursor: isFinalLocked ? 'not-allowed' : 'pointer',
                        opacity: isFinalLocked ? 0.45 : 1,
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                    >
                      {done && <span style={{ position: 'absolute', top: 10, right: 10 }}><SvgCheck /></span>}
                      <mod.Icon />
                      <div style={{ fontWeight: 900, fontSize: 18, color: mod.color, marginTop: 10, marginBottom: 3 }}>{mod.label}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{mod.desc}</div>
                      {isFinalLocked && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 12 }}>
                          <SvgLock /> Complete os 3 módulos para desbloquear
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {completedModules.size > 0 && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(108,99,255,0.08)', borderRadius: 12, border: '1px solid rgba(108,99,255,0.2)', textAlign: 'center' }}>
                  <span style={{ color: '#a78bfa', fontSize: 13 }}>
                    {(() => {
                      const base = ['html', 'css', 'js'].filter(id => completedModules.has(id as ModuleId)).length;
                      const allDone = completedModules.has('final');
                      if (allDone) return '🏆 Todos os módulos concluídos — Parabéns!';
                      if (base === 3) return `${base}/3 módulos concluídos — Desafio Final desbloqueado!`;
                      return `${base}/3 módulos concluídos — continue assim!`;
                    })()}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Slide de módulo ── */}
          {activeModule !== 'home' && slide && (
            <motion.div key={`${activeModule}-${slideIndex}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              {/* Título */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: currentModule?.color, fontWeight: 700, background: `${currentModule?.color}20`, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>
                  {currentModule?.label} · Lição {slideIndex + 1}
                </span>
                <h2 style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 900, color: '#f1f5f9', lineHeight: 1.3 }}>{slide.title}</h2>
              </div>

              {/* Layout responsivo: mobile = coluna (playground embaixo), desktop = lado a lado */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 16,
                alignItems: 'start',
              }}>
                {/* Explicação */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 14px', flex: isMobile ? 'none' : '0 0 320px', width: isMobile ? '100%' : undefined }}>
                  {slide.content}
                </div>

                {/* Playground — abaixo no mobile, ao lado no desktop */}
                {slide.playground && (
                  <div style={{ flex: 1, width: isMobile ? '100%' : undefined }}>
                    <CodePlayground
                      initialHtml={slide.playground.html ?? ''}
                      initialCss={slide.playground.css ?? ''}
                      initialJs={slide.playground.js ?? ''}
                      mode={slide.playground.mode}
                      height={isMobile ? 300 : 340}
                    />
                  </div>
                )}
              </div>

              {/* Navegação */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 10 }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={goBack}
                  style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  ← Anterior
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={goNext}
                  style={{ padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg, ${currentModule?.color ?? '#6c63ff'}, #6c63ff)`, border: 'none', color: currentModule?.color === '#f0db4f' ? '#0f0f1a' : '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: `0 0 14px ${currentModule?.color ?? '#6c63ff'}44` }}
                >
                  {isLast ? 'Concluir modulo' : 'Proximo →'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
