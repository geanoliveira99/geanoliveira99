import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodePlaygroundProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  mode?: 'html' | 'css' | 'js' | 'full';
  height?: number;
}

// ─── Tipos de erro ────────────────────────────────────────────────────────────
interface CodeError {
  type: 'error' | 'warning';
  icon: string;
  title: string;
  explanation: string;
  tip: string;
  line?: number;
}

// ─── Validador HTML ───────────────────────────────────────────────────────────
function validateHTML(html: string): CodeError[] {
  const errors: CodeError[] = [];
  const lines = html.split('\n');

  // Tags que precisam ser fechadas
  const pairedTags = ['div','p','h1','h2','h3','h4','h5','h6','span','ul','ol','li',
    'table','tr','td','th','thead','tbody','section','article','main','header',
    'footer','nav','aside','form','label','button','a','strong','em','b','i',
    'textarea','select','video','audio','figure','figcaption','blockquote'];

  // Tags void (não precisam fechar)
  const voidTags = ['img','br','hr','input','meta','link','area','base','col','embed','param','source','track','wbr'];

  // Detecta texto solto fora de tags (não dentro de tag válida)
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Linha com texto puro sem nenhuma tag HTML e não é comentário
    if (
      trimmed.length > 0 &&
      !trimmed.startsWith('<') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*') &&
      !/^[{};.,:#\-+\d\s%"'()[\]@]+$/.test(trimmed)
    ) {
      // Verifica se parece texto solto (tem pelo menos uma palavra com 2+ letras)
      const hasWord = /[a-záàãâéêíóôõúüçA-Z]{2,}/.test(trimmed);
      // E não contém nenhuma tag
      const hasTag = /<\/?[a-zA-Z]/.test(trimmed);
      if (hasWord && !hasTag) {
        errors.push({
          type: 'error',
          icon: '📝',
          title: 'Texto solto fora de uma tag HTML',
          explanation: `Na linha ${idx + 1}, o texto "${trimmed.slice(0, 40)}${trimmed.length > 40 ? '...' : ''}" está escrito diretamente no HTML sem estar dentro de uma tag. Em HTML, todo conteúdo precisa estar dentro de uma tag adequada.`,
          tip: `Coloque o texto dentro de uma tag. Exemplos:\n• <p>${trimmed.slice(0, 30)}</p>  → para parágrafos\n• <span>${trimmed.slice(0, 30)}</span>  → para texto em linha`,
          line: idx + 1,
        });
      }
    }

    // Tag aberta sem fechar (simples)
    const openMatch = trimmed.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>(?!.*<\/\1>)/);
    if (openMatch) {
      const tagName = openMatch[1].toLowerCase();
      if (pairedTags.includes(tagName) && !voidTags.includes(tagName)) {
        // Verifica se fecha em alguma outra linha
        const closedElsewhere = lines.some(l => l.includes(`</${tagName}>`));
        if (!closedElsewhere) {
          errors.push({
            type: 'error',
            icon: '🔧',
            title: `Tag <${tagName}> não foi fechada`,
            explanation: `Na linha ${idx + 1}, você abriu a tag <${tagName}> mas nunca a fechou. Em HTML, toda tag que abre precisa de uma tag de fechamento correspondente.`,
            tip: `Adicione </${tagName}> após o conteúdo da tag. Exemplo:\n<${tagName}>seu conteúdo aqui</${tagName}>`,
            line: idx + 1,
          });
        }
      }
    }

    // Atributos sem aspas
    const attrNoQuote = trimmed.match(/<[a-zA-Z]+\s+[a-zA-Z-]+=([^"'\s>][^\s>]*)/);
    if (attrNoQuote) {
      errors.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Atributo HTML sem aspas',
        explanation: `Na linha ${idx + 1}, um atributo está sem aspas ao redor do valor. Isso pode causar comportamento inesperado.`,
        tip: `Use aspas duplas nos valores dos atributos:\n✅ <img src="foto.jpg">\n❌ <img src=foto.jpg>`,
        line: idx + 1,
      });
    }

    // img sem src
    if (/<img(?![^>]*src=)[^>]*>/.test(trimmed)) {
      errors.push({
        type: 'error',
        icon: '🖼️',
        title: 'Tag <img> sem atributo src',
        explanation: `Na linha ${idx + 1}, você usou <img> sem o atributo src. Sem o src, o navegador não sabe qual imagem exibir.`,
        tip: `Adicione o atributo src com o caminho da imagem:\n<img src="minha-foto.jpg" alt="descrição da imagem">`,
        line: idx + 1,
      });
    }

    // a sem href
    if (/<a(?![^>]*href=)[^>]*>/.test(trimmed)) {
      errors.push({
        type: 'warning',
        icon: '🔗',
        title: 'Tag <a> sem atributo href',
        explanation: `Na linha ${idx + 1}, você criou um link <a> sem o href. Sem href, o link não vai a lugar nenhum.`,
        tip: `Adicione o href com o destino do link:\n<a href="https://exemplo.com">Clique aqui</a>`,
        line: idx + 1,
      });
    }
  });

  // Verifica fechamentos sem abertura correspondente
  const closeMatches = html.matchAll(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g);
  for (const m of closeMatches) {
    const tagName = m[1].toLowerCase();
    if (pairedTags.includes(tagName)) {
      const openCount = (html.match(new RegExp(`<${tagName}[\\s>]`, 'gi')) || []).length;
      const closeCount = (html.match(new RegExp(`</${tagName}>`, 'gi')) || []).length;
      if (closeCount > openCount) {
        errors.push({
          type: 'error',
          icon: '❌',
          title: `Tag </${tagName}> sem abertura correspondente`,
          explanation: `Você fechou a tag </${tagName}> mais vezes do que a abriu. Isso indica que há um fechamento a mais ou falta uma abertura <${tagName}>.`,
          tip: `Verifique o equilíbrio das tags:\n✅ <${tagName}>conteúdo</${tagName}>\n❌ conteúdo</${tagName}>  ← sem abertura`,
        });
        break;
      }
    }
  }

  return errors;
}

// ─── Validador CSS ────────────────────────────────────────────────────────────
function validateCSS(css: string): CodeError[] {
  const errors: CodeError[] = [];
  const lines = css.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) return;

    // Declaração sem ponto-e-vírgula (tem : mas não ; e não é { ou })
    if (
      trimmed.includes(':') &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(',') &&
      !trimmed.startsWith('@')
    ) {
      errors.push({
        type: 'error',
        icon: '🔤',
        title: 'Falta ponto-e-vírgula (;) no CSS',
        explanation: `Na linha ${idx + 1} ("${trimmed.slice(0, 50)}"), a propriedade CSS não termina com ponto-e-vírgula. Em CSS, toda propriedade precisa terminar com ; para o navegador saber onde ela termina.`,
        tip: `Adicione ; no final da linha:\n✅ color: red;\n❌ color: red`,
        line: idx + 1,
      });
    }

    // Chave abrindo sem seletor
    if (trimmed === '{') {
      errors.push({
        type: 'error',
        icon: '🎯',
        title: 'Chave { sem seletor CSS',
        explanation: `Na linha ${idx + 1}, há uma chave { sem um seletor antes dela. O seletor define qual elemento HTML será estilizado.`,
        tip: `Sempre coloque o seletor antes das chaves:\n✅ p { color: red; }\n❌ { color: red; }`,
        line: idx + 1,
      });
    }

    // Valor de cor inválido simples (ex: color: azul)
    const colorProp = trimmed.match(/^color\s*:\s*([^;{]+)/i);
    if (colorProp) {
      const val = colorProp[1].trim().toLowerCase();
      const validKeywords = ['red','blue','green','yellow','black','white','gray','grey','orange','purple',
        'pink','brown','cyan','magenta','lime','navy','teal','silver','maroon','olive',
        'transparent','inherit','initial','unset','currentcolor'];
      if (
        !val.startsWith('#') && !val.startsWith('rgb') && !val.startsWith('hsl') &&
        !val.startsWith('var(') && !validKeywords.includes(val)
      ) {
        errors.push({
          type: 'error',
          icon: '🎨',
          title: `Cor inválida: "${colorProp[1].trim()}"`,
          explanation: `Na linha ${idx + 1}, o valor de cor "${colorProp[1].trim()}" não é reconhecido pelo CSS. O CSS usa nomes em inglês ou valores especiais.`,
          tip: `Use cores em inglês ou no formato correto:\n• Inglês: color: red; (vermelho), color: blue; (azul)\n• Hex: color: #ff0000;\n• RGB: color: rgb(255, 0, 0);\n• HSL: color: hsl(0, 100%, 50%);`,
          line: idx + 1,
        });
      }
    }
  });

  // Verifica chaves não balanceadas
  const openBraces = (css.match(/\{/g) || []).length;
  const closeBraces = (css.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push({
      type: 'error',
      icon: '⚖️',
      title: `Chaves desequilibradas no CSS (${openBraces} abre, ${closeBraces} fecha)`,
      explanation: `O número de chaves { que abrem é diferente do número que fecham }. Isso quebra todo o bloco de CSS.`,
      tip: `Cada bloco CSS precisa de { e }:\n✅ .classe { propriedade: valor; }\nConfira se não está faltando ou sobrando alguma chave.`,
    });
  }

  return errors;
}

// ─── Validador JS ─────────────────────────────────────────────────────────────
function validateJS(js: string): CodeError[] {
  const errors: CodeError[] = [];

  // Testa sintaxe real com Function constructor
  try {
    new Function(js);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    let explanation = `Seu código JavaScript tem um erro de sintaxe: "${msg}".`;
    let tip = 'Verifique o código com cuidado.';

    if (msg.includes('Unexpected token')) {
      const token = msg.match(/Unexpected token '?(.+?)'?$/)?.[1] ?? '';
      explanation = `JavaScript encontrou algo inesperado: "${token}". Isso geralmente significa que falta algum símbolo antes ou você usou um caractere errado.`;
      tip = `Erros comuns com "Unexpected token":\n• Falta fechar parênteses: if (x > 0 { → if (x > 0) {\n• Vírgula a mais em array: [1, 2,] → [1, 2]\n• Usando = ao invés de == numa comparação`;
    } else if (msg.includes('Unexpected end')) {
      explanation = `O JavaScript chegou ao fim do código sem esperado — provavelmente falta fechar algum bloco.`;
      tip = `Verifique se todos os blocos estão fechados:\n• Cada { precisa de um }\n• Cada ( precisa de um )\n• Cada [ precisa de um ]`;
    } else if (msg.includes('is not defined')) {
      explanation = `Uma variável ou função está sendo usada sem ter sido declarada antes.`;
      tip = `Declare a variável antes de usar:\n✅ let nome = "João"; console.log(nome);\n❌ console.log(nome); ← nome nunca foi declarado`;
    } else if (msg.includes('missing )')) {
      explanation = `Falta fechar um parêntese ) em algum lugar do código.`;
      tip = `Confira se todos os parênteses estão balanceados:\n✅ if (x > 0) { }\n❌ if (x > 0 { }`;
    }

    errors.push({
      type: 'error',
      icon: '⚡',
      title: 'Erro de sintaxe no JavaScript',
      explanation,
      tip,
    });
    return errors; // Se há erro de sintaxe, não adianta continuar
  }

  const lines = js.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    // Atribuição em condição (= ao invés de == ou ===)
    if (/if\s*\(.*[^=!<>]=[^=].*\)/.test(trimmed) && !/[=!<>]=[=]?/.test(trimmed.replace(/[=!<>]=?/g, ''))) {
      errors.push({
        type: 'warning',
        icon: '🔍',
        title: 'Possível atribuição dentro de if (use == ou ===)',
        explanation: `Na linha ${idx + 1}, parece que você usou = (atribuição) dentro de um if. Em JS, = define um valor, enquanto == e === comparam valores.`,
        tip: `Para comparar, use == ou ===:\n✅ if (x === 5) { }\n❌ if (x = 5) { }  ← isso atribui 5 a x, não compara`,
        line: idx + 1,
      });
    }

    // console.log sem parênteses
    if (/console\.log\s*[^(]/.test(trimmed)) {
      errors.push({
        type: 'error',
        icon: '🖨️',
        title: 'console.log sem parênteses',
        explanation: `Na linha ${idx + 1}, o console.log está sem parênteses. Funções em JavaScript sempre precisam de () para serem chamadas.`,
        tip: `Use parênteses para chamar funções:\n✅ console.log("Olá");\n❌ console.log "Olá";`,
        line: idx + 1,
      });
    }

    // var ao invés de let/const (warning educativo)
    if (/^\s*var\s+/.test(line)) {
      errors.push({
        type: 'warning',
        icon: '📚',
        title: 'Uso de var (prefira let ou const)',
        explanation: `Na linha ${idx + 1}, você usou var para declarar uma variável. Em JavaScript moderno, recomenda-se usar let (para valores que mudam) ou const (para valores fixos), pois var tem comportamentos antigos que podem causar bugs difíceis de encontrar.`,
        tip: `Prefira let ou const:\n✅ let contador = 0;  ← pode mudar\n✅ const nome = "João";  ← não vai mudar\n⚠️ var x = 1;  ← evite`,
        line: idx + 1,
      });
    }
  });

  return errors;
}

export default function CodePlayground({
  initialHtml = '',
  initialCss = '',
  initialJs = '',
  mode = 'html',
  height = 340,
}: CodePlaygroundProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>(
    mode === 'full' ? 'html' : mode
  );
  const [ran, setRan] = useState(false);
  const [errors, setErrors] = useState<CodeError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 700 : false
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const buildSrc = () => {
    const doc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body { margin: 0; padding: 12px; font-family: sans-serif; background: #0f0f1a; color: #e2e8f0; box-sizing: border-box; }
  * { box-sizing: border-box; }
  ${css}
</style>
</head>
<body>
${html}
<script>
try { ${js} } catch(e) { document.body.innerHTML += '<pre style="color:#ff6b6b;font-size:12px;margin-top:8px;">' + e.message + '</pre>'; }
</script>
</body>
</html>`;
    return doc;
  };

  const runCode = () => {
    // ── Valida antes de executar ──────────────────────────────────────────────
    const allErrors: CodeError[] = [];
    if (mode === 'html' || mode === 'css' || mode === 'full') {
      allErrors.push(...validateHTML(html));
    }
    if (mode === 'css' || mode === 'full') {
      allErrors.push(...validateCSS(css));
    }
    if (mode === 'js' || mode === 'full') {
      allErrors.push(...validateJS(js));
    }

    // Erros críticos bloqueiam execução
    const hasBlockingErrors = allErrors.some(e => e.type === 'error');
    setErrors(allErrors);
    if (allErrors.length > 0) {
      setShowErrors(true);
      if (hasBlockingErrors) return; // Não executa se há erros
    }

    if (!iframeRef.current) return;
    const blob = new Blob([buildSrc()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    setRan(true);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // Auto-run on mount
  useEffect(() => { runCode(); }, []);

  const tabs =
    mode === 'full'
      ? (['html', 'css', 'js'] as const)
      : mode === 'html'
      ? (['html'] as const)
      : mode === 'css'
      ? (['html', 'css'] as const)
      : (['html', 'js'] as const);

  const tabColor: Record<string, string> = {
    html: '#e34c26',
    css: '#264de4',
    js: '#f0db4f',
  };

  const getValue = () => {
    if (activeTab === 'html') return html;
    if (activeTab === 'css') return css;
    return js;
  };

  const setValue = (v: string) => {
    if (activeTab === 'html') setHtml(v);
    else if (activeTab === 'css') setCss(v);
    else setJs(v);
  };

  return (
    <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* ── Barra do MacBook ── */}
      <div style={{ background: '#1e1e2e', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Bolinhas */}
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', boxShadow: '0 0 6px #ff5f57' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block', boxShadow: '0 0 6px #febc2e' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block', boxShadow: '0 0 6px #28c840' }} />
        {/* Nome do arquivo */}
        <span style={{ marginLeft: 12, fontSize: 12, color: '#888', fontFamily: 'monospace' }}>
          {activeTab === 'html' ? 'index.html' : activeTab === 'css' ? 'style.css' : 'script.js'}
        </span>
        {/* Dica de edição */}
        <span style={{
          marginLeft: 8,
          fontSize: 10,
          color: '#6c63ff',
          background: 'rgba(108,99,255,0.13)',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: 20,
          padding: '1px 8px',
          fontFamily: 'sans-serif',
          letterSpacing: 0.2,
          whiteSpace: 'nowrap',
        }}>
          ✏️ edite e clique ▶ Executar
        </span>
        {/* Tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'monospace',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === t ? tabColor[t] + '33' : 'transparent',
                color: activeTab === t ? tabColor[t] : '#666',
                borderBottom: activeTab === t ? `2px solid ${tabColor[t]}` : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Painel de Erros ── */}
      <AnimatePresence>
        {showErrors && errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #1a0a0a, #130a1a)',
              borderBottom: '1px solid rgba(255,80,80,0.25)',
              padding: '14px 16px',
            }}>
              {/* Cabeçalho do painel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🚨</span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#ff6b6b' }}>
                    {errors.filter(e => e.type === 'error').length > 0
                      ? `${errors.filter(e => e.type === 'error').length} erro${errors.filter(e => e.type === 'error').length > 1 ? 's' : ''} encontrado${errors.filter(e => e.type === 'error').length > 1 ? 's' : ''} — corrija antes de executar`
                      : `${errors.length} aviso${errors.length > 1 ? 's' : ''} — código executado com ressalvas`
                    }
                  </span>
                </div>
                <button
                  onClick={() => setShowErrors(false)}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '3px 10px' }}
                >
                  ✕ Fechar
                </button>
              </div>

              {/* Lista de erros */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {errors.map((err, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    style={{
                      background: err.type === 'error'
                        ? 'rgba(255,80,80,0.07)'
                        : 'rgba(254,188,46,0.07)',
                      border: `1px solid ${err.type === 'error' ? 'rgba(255,80,80,0.25)' : 'rgba(254,188,46,0.25)'}`,
                      borderRadius: 10,
                      padding: '12px 14px',
                    }}
                  >
                    {/* Título do erro */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{err.icon}</span>
                      <div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 20,
                          marginRight: 6,
                          background: err.type === 'error' ? 'rgba(255,80,80,0.2)' : 'rgba(254,188,46,0.2)',
                          color: err.type === 'error' ? '#ff6b6b' : '#febc2e',
                          textTransform: 'uppercase' as const,
                          letterSpacing: 1,
                        }}>
                          {err.type === 'error' ? 'ERRO' : 'AVISO'}
                        </span>
                        {err.line && (
                          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>linha {err.line}</span>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                      {err.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px 0', lineHeight: 1.6 }}>
                      {err.explanation}
                    </p>
                    {/* Dica de como corrigir */}
                    <div style={{
                      background: 'rgba(0,217,255,0.05)',
                      border: '1px solid rgba(0,217,255,0.15)',
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#00d9ff', textTransform: 'uppercase' as const, letterSpacing: 1 }}>💡 Como corrigir</span>
                      <pre style={{
                        margin: '4px 0 0 0',
                        fontSize: 11,
                        color: '#7dd3fc',
                        fontFamily: '"Fira Code", monospace',
                        whiteSpace: 'pre-wrap' as const,
                        lineHeight: 1.7,
                      }}>
                        {err.tip}
                      </pre>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Rodapé motivacional */}
              <div style={{ marginTop: 10, textAlign: 'center', color: '#475569', fontSize: 11 }}>
                {errors.filter(e => e.type === 'error').length > 0
                  ? '🔧 Corrija os erros acima e clique ▶ Executar novamente — você consegue!'
                  : '✅ Os avisos são sugestões. O código foi executado mesmo assim!'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layout: editor + preview — lado a lado no desktop, empilhado no mobile ── */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : height }}>
        {/* Editor */}
        <div style={{ flex: 1, background: '#13131f', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: isMobile ? 200 : 'auto' }}>
          {/* Line numbers + textarea */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <textarea
              value={getValue()}
              onChange={(e) => { setValue(e.target.value); setShowErrors(false); }}
              spellCheck={false}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: 'transparent',
                color: activeTab === 'html' ? '#e34c26' : activeTab === 'css' ? '#7eb3ff' : '#f0db4f',
                fontFamily: '"Fira Code", "Courier New", monospace',
                fontSize: 13,
                lineHeight: 1.7,
                padding: '12px 12px 12px 48px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                caretColor: '#fff',
              }}
            />
            {/* Fake line numbers */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 40,
                height: '100%',
                background: '#0f0f1a',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                padding: '12px 0',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              {getValue().split('\n').map((_, i) => (
                <div key={i} style={{ height: '1.7em', textAlign: 'right', paddingRight: 8, fontSize: 11, color: '#444', fontFamily: 'monospace' }}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Run button */}
          <div style={{ background: '#0f0f1a', padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={runCode}
              style={{
                padding: '6px 18px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6c63ff, #00d9ff)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 12px rgba(108,99,255,0.4)',
              }}
            >
              ▶ Executar
            </motion.button>
          </div>
        </div>

        {/* Divisor */}
        {!isMobile && <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />}

        {/* Preview */}
        <div style={{ flex: 1, background: '#0f0f1a', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: isMobile ? 180 : 'auto' }}>
          <div style={{ background: '#1a1a2e', padding: '6px 12px', fontSize: 11, color: '#555', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ran ? '#28c840' : '#555', display: 'inline-block' }} />
            Preview
          </div>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            style={{ flex: 1, width: '100%', border: 'none', background: '#0f0f1a' }}
            title="preview"
          />
        </div>
      </div>
    </div>
  );
}
