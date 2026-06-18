import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CodePlaygroundProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  mode?: 'html' | 'css' | 'js' | 'full';
  height?: number;
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

      {/* ── Layout: editor + preview — lado a lado no desktop, empilhado no mobile ── */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : height }}>
        {/* Editor */}
        <div style={{ flex: 1, background: '#13131f', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: isMobile ? 200 : 'auto' }}>
          {/* Line numbers + textarea */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <textarea
              value={getValue()}
              onChange={(e) => setValue(e.target.value)}
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
