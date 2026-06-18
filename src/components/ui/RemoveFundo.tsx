import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { removeBackground } from '@imgly/background-removal';

// ─── Detecção de plataforma ───────────────────────────────────────────────────
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIOS();
}

// ─── API remove.bg ────────────────────────────────────────────────────────────
async function removeBgAPI(file: File, apiKey: string): Promise<Blob> {
  const formData = new FormData();
  formData.append('image_file', file);
  formData.append('size', 'auto');
  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err?.errors?.[0]?.title) ?? `Erro ${res.status}`);
  }
  return res.blob();
}

// ─── Resize para mobile (IA local) ───────────────────────────────────────────
async function resizeFileSeNecessario(file: File, maxPx: number): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= maxPx && h <= maxPx) {
        // já é pequena, usa direto
        resolve(file);
        return;
      }
      const scale  = maxPx / Math.max(w, h);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Arquivo {
  id: string;
  file: File;
  previewUrl: string;
  status: 'aguardando' | 'processando' | 'pronto' | 'erro';
  erro?: string;
  resultUrl?: string;
  progresso?: number; // 0–100
}

function gerarId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function formatarBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const ACEITOS = 'image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp';
const LS_KEY  = 'removebg_apikey';

// ─── Componente ───────────────────────────────────────────────────────────────
export default function RemoveFundo({ onClose: _onClose }: { onClose: () => void }) {
  const usarAPI = isIOS();   // iOS → API remove.bg; Android/PC → IA local
  const mobile  = isMobile();

  const [arquivos, setArquivos]       = useState<Arquivo[]>([]);
  const [arrastando, setArrastando]   = useState(false);
  const [modeloMsg, setModeloMsg]     = useState<string | null>(null);

  // ── API Key (só iOS) ───────────────────────────────────────────────────────
  const [apiKey, setApiKey]           = useState(() => localStorage.getItem(LS_KEY) ?? '');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [telaChave, setTelaChave]     = useState(false);

  const inputRef       = useRef<HTMLInputElement>(null);
  const processandoRef = useRef(false);

  useEffect(() => {
    if (apiKey) localStorage.setItem(LS_KEY, apiKey);
    else localStorage.removeItem(LS_KEY);
  }, [apiKey]);

  // ── Adicionar ──────────────────────────────────────────────────────────────
  const adicionarArquivos = useCallback((fileList: FileList | File[]) => {
    const novos: Arquivo[] = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 10) // máx 10 por vez
      .map(f => ({
        id: gerarId(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: 'aguardando',
      }));
    setArquivos(prev => [...prev, ...novos]);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) adicionarArquivos(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files) adicionarArquivos(e.dataTransfer.files);
  };

  const remover = (id: string) => {
    setArquivos(prev => {
      const item = prev.find(a => a.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item?.resultUrl)  URL.revokeObjectURL(item.resultUrl);
      return prev.filter(a => a.id !== id);
    });
  };

  const limpar = () => {
    arquivos.forEach(a => {
      URL.revokeObjectURL(a.previewUrl);
      if (a.resultUrl) URL.revokeObjectURL(a.resultUrl);
    });
    setArquivos([]);
    setModeloMsg(null);
  };

  // ── Salvar chave API ───────────────────────────────────────────────────────
  const salvarChave = () => {
    const chave = apiKeyInput.trim();
    if (!chave) return;
    setApiKey(chave);
    setApiKeyInput('');
    setTelaChave(false);
  };

  // ── Processar ──────────────────────────────────────────────────────────────
  const processar = async () => {
    if (processandoRef.current) return;
    const fila = arquivos.filter(a => a.status === 'aguardando');
    if (!fila.length) return;

    processandoRef.current = true;

    for (const item of fila) {
      setArquivos(prev => prev.map(a =>
        a.id === item.id ? { ...a, status: 'processando', progresso: 0 } : a
      ));

      try {
        let blob: Blob;

        if (usarAPI) {
          // ── iOS: remove.bg API ─────────────────────────────────────────
          setModeloMsg('☁️ Enviando para remove.bg...');
          blob = await removeBgAPI(item.file, apiKey);
          setModeloMsg(null);
        } else {
          // ── Android / PC: IA local ─────────────────────────────────────
          setModeloMsg('⏳ Carregando modelo de IA (primeira vez pode demorar ~30s)...');
          const entrada = mobile
            ? await resizeFileSeNecessario(item.file, 1024)
            : item.file;
          blob = await removeBackground(entrada, {
            model: mobile ? 'isnet_quint8' : 'isnet',
            progress: (key: string, current: number, total: number) => {
              const pct = total > 0 ? Math.round((current / total) * 100) : 0;
              if (key.startsWith('fetch')) setModeloMsg(`📥 Baixando modelo IA... ${pct}%`);
              else setModeloMsg(null);
              setArquivos(prev => prev.map(a =>
                a.id === item.id ? { ...a, progresso: pct } : a
              ));
            },
          });
          setModeloMsg(null);
        }

        const resultUrl = URL.createObjectURL(blob);
        setArquivos(prev => prev.map(a =>
          a.id === item.id ? { ...a, status: 'pronto', resultUrl, progresso: 100 } : a
        ));
      } catch (err) {
        setModeloMsg(null);
        setArquivos(prev => prev.map(a =>
          a.id === item.id ? { ...a, status: 'erro', erro: (err as Error).message } : a
        ));
      }
    }

    setModeloMsg(null);
    processandoRef.current = false;
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const baixar = (item: Arquivo) => {
    if (!item.resultUrl) return;
    const a = document.createElement('a');
    a.href = item.resultUrl;
    const nomeSemExt = item.file.name.replace(/\.[^.]+$/, '');
    a.download = `${nomeSemExt}_sem_fundo.png`;
    a.click();
  };

  const baixarTodos = () => {
    arquivos.filter(a => a.status === 'pronto').forEach((a, i) => {
      setTimeout(() => baixar(a), i * 350);
    });
  };

  const prontos       = arquivos.filter(a => a.status === 'pronto').length;
  const processando   = arquivos.some(a => a.status === 'processando');
  const temAguardando = arquivos.some(a => a.status === 'aguardando');
  const jaProcessou   = prontos > 0 && !processando && !temAguardando;

  // ─── Tela: configurar chave API ───────────────────────────────────────────
  if (usarAPI && telaChave) {
    return (
      <div style={{ color: '#e2e8f0' }}>
        <button type="button" onClick={() => setTelaChave(false)}
          style={{ background: 'none', border: 'none', color: '#6c63ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 18, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Voltar
        </button>
        <h3 style={{ margin: '0 0 6px', fontWeight: 900, fontSize: 16, color: '#f1f5f9' }}>🔑 Chave API remove.bg</h3>
        <p style={{ margin: '0 0 16px', color: '#475569', fontSize: 12, lineHeight: 1.6 }}>
          Crie uma conta gratuita em <strong style={{ color: '#a78bfa' }}>remove.bg</strong> e copie sua chave API.
          O plano grátis inclui <strong style={{ color: '#e2e8f0' }}>50 usos/mês</strong>.
          A chave fica salva <strong style={{ color: '#e2e8f0' }}>só no seu celular</strong>.
        </p>
        <a href="https://www.remove.bg/pt-br/api" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', marginBottom: 16, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: 8, padding: '8px 14px', color: '#a78bfa', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          🌐 Abrir remove.bg → pegar chave
        </a>
        <input type="text" placeholder="Cole sua chave aqui: abcd1234..."
          value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(108,99,255,0.3)', borderRadius: 10, color: '#f1f5f9', fontSize: 14, marginBottom: 12, outline: 'none', fontFamily: 'monospace' }}
        />
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={salvarChave} disabled={!apiKeyInput.trim()}
          style={{ width: '100%', padding: '13px', background: apiKeyInput.trim() ? 'linear-gradient(135deg,#6c63ff,#a78bfa)' : 'rgba(108,99,255,0.2)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 14, cursor: apiKeyInput.trim() ? 'pointer' : 'not-allowed' }}>
          ✓ Salvar chave
        </motion.button>
        {apiKey && (
          <button type="button" onClick={() => { setApiKey(''); setTelaChave(false); }}
            style={{ marginTop: 12, background: 'none', border: 'none', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'center' }}>
            🗑 Remover chave salva
          </button>
        )}
      </div>
    );
  }

  // ─── Tela: iOS sem chave ──────────────────────────────────────────────────
  if (usarAPI && !apiKey) {
    return (
      <div style={{ color: '#e2e8f0' }}>
        <h3 style={{ margin: '0 0 14px', fontWeight: 900, fontSize: 16, color: '#f1f5f9' }}>✂️ Remover Fundo</h3>
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1.5px solid rgba(251,191,36,0.25)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 6px', color: '#fbbf24', fontWeight: 800, fontSize: 14 }}>⚠️ Safari / iOS detectado</p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
            O Safari bloqueia o motor de IA (WebAssembly) necessário. Para funcionar no iPhone, usamos a <strong style={{ color: '#e2e8f0' }}>API do remove.bg</strong> — a imagem é enviada para o servidor deles.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '🆓', title: '50 usos gratuitos/mês', desc: 'Plano free do remove.bg' },
            { icon: '☁️', title: 'Imagem vai para o servidor', desc: 'Servidor do remove.bg, não nosso' },
            { icon: '🔑', title: 'Chave salva só no seu celular', desc: 'Nunca passa pelo nosso servidor' },
          ].map(item => (
            <div key={item.icon} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>{item.title}</p>
                <p style={{ margin: 0, color: '#475569', fontSize: 11 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setTelaChave(true)}
          style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>
          🔑 Configurar chave API gratuita
        </motion.button>
        <p style={{ marginTop: 10, color: '#334155', fontSize: 11, textAlign: 'center' }}>
          No Android e PC a IA roda direto no dispositivo, sem precisar de chave.
        </p>
      </div>
    );
  }

  // ─── Render principal ─────────────────────────────────────────────────────
  return (
    <div style={{ color: '#e2e8f0' }}>

      {/* Título */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✂️ Remover Fundo
          </h3>
          <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 12 }}>
            {usarAPI
              ? '☁️ Via API remove.bg · imagem processada no servidor deles'
              : 'IA local · resultado em PNG transparente · 100% no seu dispositivo'}
          </p>
        </div>
        {usarAPI && (
          <button type="button" onClick={() => setTelaChave(true)} title="Alterar chave API"
            style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 8, padding: '5px 10px', color: '#6c63ff', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
            🔑 Chave API
          </button>
        )}
      </div>

      {/* Aviso privacidade iOS */}
      {usarAPI && (
        <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 10, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#78716c', display: 'flex', gap: 6 }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>A imagem será enviada para os servidores do <strong style={{ color: '#a78bfa' }}>remove.bg</strong> para processamento.</span>
        </div>
      )}

      {/* Aviso modelo */}
      <AnimatePresence>
        {modeloMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#a78bfa', fontWeight: 700 }}
          >
            {modeloMsg}
            <p style={{ margin: '4px 0 0', color: '#475569', fontWeight: 400, fontSize: 11 }}>
              O modelo fica em cache — nas próximas vezes é instantâneo.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zona de drop */}
      {!jaProcessou && (
        <div
          onDragOver={e => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={onDrop}
          onClick={() => !processando && inputRef.current?.click()}
          style={{
            border: `2px dashed ${arrastando ? '#a78bfa' : 'rgba(108,99,255,0.25)'}`,
            borderRadius: 14,
            padding: '28px 16px',
            textAlign: 'center',
            cursor: processando ? 'not-allowed' : 'pointer',
            background: arrastando ? 'rgba(108,99,255,0.08)' : 'rgba(108,99,255,0.03)',
            transition: 'all 0.2s',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>✂️</div>
          <p style={{ margin: 0, color: '#94a3b8', fontWeight: 700, fontSize: 14 }}>
            {arrastando ? 'Solte as imagens!' : 'Clique ou arraste imagens'}
          </p>
          <p style={{ margin: '4px 0 0', color: '#334155', fontSize: 11 }}>
            PNG · JPG · JPEG · WEBP · até 10 imagens por vez
          </p>
          <p style={{ margin: '4px 0 0', color: '#334155', fontSize: 11 }}>
            Resultado sempre em PNG com fundo transparente
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACEITOS}
            multiple
            onChange={onInputChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Lista de arquivos */}
      <AnimatePresence>
        {arquivos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

            {/* Cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                {arquivos.length} {arquivos.length === 1 ? 'imagem' : 'imagens'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {!processando && !jaProcessou && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    style={{ background: 'none', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 7, padding: '3px 10px', color: '#6c63ff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Adicionar
                  </button>
                )}
                <button
                  type="button"
                  onClick={limpar}
                  disabled={processando}
                  style={{ background: 'none', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 7, padding: '3px 10px', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: processando ? 'not-allowed' : 'pointer', opacity: processando ? 0.4 : 1 }}
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 2 }}>
              {arquivos.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${
                      item.status === 'pronto'      ? 'rgba(34,197,94,0.35)' :
                      item.status === 'erro'        ? 'rgba(239,68,68,0.35)' :
                      item.status === 'processando' ? 'rgba(167,139,250,0.45)' :
                      'rgba(255,255,255,0.07)'
                    }`,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>

                    {/* Thumbnails: antes / depois */}
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {/* Original */}
                      <div style={{ position: 'relative' }}>
                        <img
                          src={item.previewUrl}
                          alt="original"
                          style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                        <span style={{ position: 'absolute', bottom: 1, right: 1, fontSize: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 3, padding: '0 2px', color: '#94a3b8' }}>original</span>
                      </div>
                      {/* Resultado */}
                      {item.resultUrl && (
                        <>
                          <span style={{ color: '#334155', fontSize: 14, alignSelf: 'center' }}>→</span>
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
                              backgroundImage: 'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)',
                              backgroundSize: '10px 10px',
                              backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                              backgroundColor: '#1f2937',
                            }}>
                              <img src={item.resultUrl} alt="resultado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <span style={{ position: 'absolute', bottom: 1, right: 1, fontSize: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 3, padding: '0 2px', color: '#22c55e' }}>sem fundo</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.file.name}
                      </p>
                      <p style={{ margin: '2px 0 0', color: '#475569', fontSize: 11 }}>
                        {formatarBytes(item.file.size)}
                      </p>
                      {item.status === 'processando' && (
                        <p style={{ margin: '2px 0 0', color: '#a78bfa', fontSize: 11, fontWeight: 700 }}>
                          🤖 IA processando... {item.progresso ?? 0}%
                        </p>
                      )}
                      {item.status === 'erro' && (
                        <p style={{ margin: '2px 0 0', color: '#f87171', fontSize: 10 }}>⚠ {item.erro}</p>
                      )}
                      {item.status === 'pronto' && (
                        <p style={{ margin: '2px 0 0', color: '#22c55e', fontSize: 11, fontWeight: 700 }}>✓ Fundo removido!</p>
                      )}
                    </div>

                    {/* Ação */}
                    {item.status === 'pronto' && (
                      <button
                        type="button"
                        onClick={() => baixar(item)}
                        title="Baixar PNG sem fundo"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
                      >
                        ⬇
                      </button>
                    )}
                    {item.status === 'processando' && (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid #a78bfa', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    )}
                    {item.status === 'aguardando' && (
                      <button
                        type="button"
                        onClick={() => remover(item.id)}
                        style={{ background: 'none', border: 'none', color: '#475569', fontSize: 16, cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Barra de progresso por item */}
                  {item.status === 'processando' && (
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        animate={{ width: `${item.progresso ?? 0}%` }}
                        transition={{ duration: 0.3 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #6c63ff, #a78bfa)' }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Botões */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {temAguardando && !processando && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={processar}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    padding: '13px',
                    background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  ✂️ Remover Fundo{arquivos.filter(a => a.status === 'aguardando').length > 1 ? ` (${arquivos.filter(a => a.status === 'aguardando').length} imagens)` : ''}
                </motion.button>
              )}

              {processando && (
                <div style={{ flex: 1, padding: '13px', background: 'rgba(108,99,255,0.15)', border: '1.5px solid rgba(108,99,255,0.3)', borderRadius: 12, color: '#a78bfa', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>
                  ⏳ Processando com IA...
                </div>
              )}

              {jaProcessou && (
                <>
                  {prontos > 1 && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={baixarTodos}
                      style={{ flex: 1, minWidth: 160, padding: '13px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}
                    >
                      ⬇ Baixar todos ({prontos})
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={limpar}
                    style={{ flex: 1, minWidth: 120, padding: '13px', background: 'rgba(108,99,255,0.12)', border: '1.5px solid rgba(108,99,255,0.3)', borderRadius: 12, color: '#a78bfa', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
                  >
                    🔄 Nova imagem
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rodapé */}
      <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
        <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center' }}>
          {usarAPI
            ? '☁️ Imagem processada pelos servidores do remove.bg · Sua chave API fica salva só no seu celular'
            : '🔒 Nenhuma imagem é enviada · O modelo de IA roda totalmente no seu dispositivo'}
        </p>
      </div>
    </div>
  );
}
