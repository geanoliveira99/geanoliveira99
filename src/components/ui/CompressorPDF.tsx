import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type QualidadePreset = 'leve' | 'medio' | 'agressivo' | 'maximo' | 'custom';

interface PresetConfig {
  label: string;
  emoji: string;
  desc: string;
  cor: string;
  qualidade: number; // 0-1
  dpi: number;
}

const PRESETS: Record<QualidadePreset, PresetConfig> = {
  leve: {
    label: 'Leve',
    emoji: '🟢',
    desc: 'Qualidade alta — ideal para documentos com texto',
    cor: '#22c55e',
    qualidade: 0.85,
    dpi: 150,
  },
  medio: {
    label: 'Médio',
    emoji: '🟡',
    desc: 'Equilíbrio entre tamanho e qualidade',
    cor: '#eab308',
    qualidade: 0.60,
    dpi: 110,
  },
  agressivo: {
    label: 'Agressivo',
    emoji: '🟠',
    desc: 'Compressão forte — bom para imagens e fotos',
    cor: '#f97316',
    qualidade: 0.35,
    dpi: 72,
  },
  maximo: {
    label: 'Máximo',
    emoji: '🔴',
    desc: 'Tamanho mínimo — qualidade reduzida, teste antes de usar',
    cor: '#ef4444',
    qualidade: 0.15,
    dpi: 52,
  },
  custom: {
    label: 'Personalizado',
    emoji: '⚙️',
    desc: 'Você define a qualidade e o DPI manualmente',
    cor: '#6c63ff',
    qualidade: 0.5,
    dpi: 96,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Estimativa real: renderiza página 1 e mede o tamanho do JPEG resultante
// DPI é limitado a 96 para estimativa (evita canvas gigante em mobile que causa toBlob=null)
async function estimarTamanhoReal(file: File, qualidade: number, dpi: number): Promise<number> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  // Cap DPI em 96 apenas para estimativa — canvas menor, não estoura memória mobile
  const dpiEstimativa = Math.min(dpi, 96);
  const escala = dpiEstimativa / 72;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: escala });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;

  // Mede o tamanho real do JPEG comprimido desta página
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error('canvas.toBlob retornou null — memória insuficiente')),
      'image/jpeg',
      qualidade
    )
  );
  canvas.width = 0;
  canvas.height = 0;

  // Extrapola: ajusta pelo DPI real (área proporcional ao quadrado do fator de DPI)
  const fatordpi = (dpi / dpiEstimativa) ** 2;
  return Math.round(blob.size * fatordpi * numPages * 1.10);
}

// Timeout wrapper to avoid long hanging estimations (ms)
async function estimarComTimeout(file: File, qualidade: number, dpi: number, timeout = 8000): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        reject(new Error('timeout'));
      }
    }, timeout);

    estimarTamanhoReal(file, qualidade, dpi).then((v) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(v);
      }
    }).catch((e) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        reject(e);
      }
    });
  });
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function CompressorPDF({ onClose }: { onClose: () => void }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preset, setPreset] = useState<QualidadePreset>('medio');
  const [customQ, setCustomQ] = useState(50);   // 1-100
  const [customDPI, setCustomDPI] = useState(96);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<{ nome: string; originalSize: number; comprimidoSize: number; url: string } | null>(null);
  const [mostrarPriv, setMostrarPriv] = useState(false);
  const [estimativa, setEstimativa] = useState<number | null>(null);
  const [calculandoEstimativa, setCalculandoEstimativa] = useState(false);
  const [estimativaErro, setEstimativaErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calculandoRef = useRef<boolean>(false);

  const getQualidade = () => preset === 'custom' ? customQ / 100 : PRESETS[preset].qualidade;
  const getDPI = () => preset === 'custom' ? customDPI : PRESETS[preset].dpi;

  // Reseta estimativa quando troca preset ou controles (usuário precisa clicar Calcular de novo)
  useEffect(() => {
    setEstimativa(null);
  }, [preset, customQ, customDPI]);

  const calcularEstimativa = async () => {
    if (!arquivo || calculandoRef.current) return;
    calculandoRef.current = true;
    setCalculandoEstimativa(true);
    setEstimativa(null);
    setEstimativaErro(null);
    try {
      const bytes = await estimarComTimeout(arquivo, getQualidade(), getDPI(), 8000);
      setEstimativa(bytes);
    } catch (e: any) {
      console.warn('Estimativa falhou:', e?.message || e);
      setEstimativaErro('Não foi possível calcular a estimativa (dispositivo lento). Tente novamente ou prossiga para comprimir.');
    } finally {
      calculandoRef.current = false;
      setCalculandoEstimativa(false);
    }
  };

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { setErro('Por favor, selecione um arquivo PDF.'); return; }
    if (f.size > 200 * 1024 * 1024) { setErro('Arquivo muito grande. Limite: 200 MB.'); return; }
    setErro('');
    setResultado(null);
    setEstimativa(null);
    setArquivo(f);
  };

  const comprimir = useCallback(async () => {
    if (!arquivo) return;
    setProcessando(true);
    setProgresso(0);
    setErro('');
    setResultado(null);

    try {
      // Importações dinâmicas para não pesar o bundle inicial
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;

      const { jsPDF } = await import('jspdf');

      const arrayBuffer = await arquivo.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setTotalPaginas(numPages);

      const qualidade = getQualidade();
      const dpi = getDPI();
      const escala = dpi / 72; // PDF padrão é 72dpi

      let doc: InstanceType<typeof jsPDF> | null = null;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: escala });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, canvas, viewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', qualidade);

        // Dimensões em mm (1px a 72dpi = 0.3528mm)
        const larguraMM = (viewport.width / escala) * 0.3528;
        const alturaMM = (viewport.height / escala) * 0.3528;

        if (i === 1) {
          doc = new jsPDF({
            orientation: larguraMM > alturaMM ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [larguraMM, alturaMM],
          });
        } else {
          doc!.addPage([larguraMM, alturaMM], larguraMM > alturaMM ? 'landscape' : 'portrait');
        }

        doc!.addImage(imgData, 'JPEG', 0, 0, larguraMM, alturaMM, undefined, 'FAST');

        setProgresso(Math.round((i / numPages) * 100));

        // Libera memória
        canvas.width = 0;
        canvas.height = 0;
      }

      const pdfBlob = doc!.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const nomeOriginal = arquivo.name.replace(/\.pdf$/i, '');

      setResultado({
        nome: `${nomeOriginal}_comprimido.pdf`,
        originalSize: arquivo.size,
        comprimidoSize: pdfBlob.size,
        url,
      });
    } catch (e) {
      console.error(e);
      setErro('Erro ao processar o PDF. Tente com um arquivo menor ou diferente formato.');
    } finally {
      setProcessando(false);
    }
  }, [arquivo, preset, customQ, customDPI]);

  const baixar = () => {
    if (!resultado) return;
    const a = document.createElement('a');
    a.href = resultado.url;
    a.download = resultado.nome;
    a.click();
  };

  const resetar = () => {
    setArquivo(null);
    setResultado(null);
    setErro('');
    setProgresso(0);
    setTotalPaginas(0);
    setEstimativa(null);
    setCalculandoEstimativa(false);
    calculandoRef.current = false;
    if (inputRef.current) inputRef.current.value = '';
  };

  const presetAtual = PRESETS[preset];

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}>

      {/* ── Aviso de privacidade ─────────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(0,217,255,0.06)',
          border: '1px solid rgba(0,217,255,0.2)',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: 'pointer',
        }}
        onClick={() => setMostrarPriv(v => !v)}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
        <div>
          <span style={{ color: '#00d9ff', fontSize: 13, fontWeight: 700 }}>
            100% privado — seu PDF nunca sai do seu dispositivo
          </span>
          <span style={{ color: '#64748b', fontSize: 12, marginLeft: 6 }}>
            {mostrarPriv ? '▲ fechar' : '▼ saiba mais'}
          </span>
          <AnimatePresence>
            {mostrarPriv && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                  {[
                    'O arquivo é processado 100% no seu navegador (client-side)',
                    'Nenhum byte do seu PDF é enviado para servidor algum',
                    'Nenhum dado é armazenado ou gravado em nuvem',
                    'O PDF comprimido fica apenas na memória temporária do browser até você baixar',
                    'Após fechar esta janela, tudo é apagado automaticamente',
                    'Funciona offline — não precisa de internet após carregar a página',
                  ].map(t => (
                    <li key={t} style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span> {t}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Área de seleção de arquivo ────────────────────────────────────── */}
      {!arquivo ? (
        <motion.div
          whileHover={{ borderColor: 'rgba(108,99,255,0.5)' }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed rgba(108,99,255,0.3)',
            borderRadius: 16,
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(108,99,255,0.04)',
            transition: 'all 0.2s',
            marginBottom: 20,
          }}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f?.type === 'application/pdf') {
              setArquivo(f);
              setErro('');
              setResultado(null);
            } else {
              setErro('Apenas arquivos PDF são aceitos.');
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
            Clique para escolher seu PDF
          </p>
          <p style={{ color: '#475569', fontSize: 13 }}>
            ou arraste e solte aqui · Máx. 200 MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleArquivo}
          />
        </motion.div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arquivo.name}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{formatBytes(arquivo.size)}</p>
          </div>
          <button type="button" onClick={resetar} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 12, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>
            Trocar
          </button>
        </div>
      )}

      {erro && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
          ⚠️ {erro}
        </div>
      )}

      {/* ── Opções de qualidade ───────────────────────────────────────────── */}
      {arquivo && !processando && !resultado && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nível de compressão
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {(Object.entries(PRESETS) as [QualidadePreset, PresetConfig][]).map(([key, p]) => (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setPreset(key)}
                style={{
                  background: preset === key ? `${p.cor}18` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${preset === key ? p.cor + '60' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  gridColumn: key === 'custom' ? '1 / -1' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14 }}>{p.emoji}</span>
                  <span style={{ color: preset === key ? p.cor : '#e2e8f0', fontWeight: 800, fontSize: 14 }}>{p.label}</span>
                  {preset === key && <span style={{ marginLeft: 'auto', color: p.cor, fontSize: 10, fontWeight: 700 }}>✓ ATIVO</span>}
                </div>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{p.desc}</p>
              </motion.button>
            ))}
          </div>

          {/* Controles do modo personalizado */}
          <AnimatePresence>
            {preset === 'custom' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: 16 }}
              >
                <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 700 }}>Qualidade da imagem</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 14 }}>{customQ}%</span>
                    </div>
                    <input
                      type="range" min={5} max={100} value={customQ}
                      onChange={e => setCustomQ(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#6c63ff' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#475569', fontSize: 11 }}>5% — menor tamanho</span>
                      <span style={{ color: '#475569', fontSize: 11 }}>100% — melhor qualidade</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 700 }}>Resolução (DPI)</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 14 }}>{customDPI} DPI</span>
                    </div>
                    <input
                      type="range" min={36} max={200} step={4} value={customDPI}
                      onChange={e => setCustomDPI(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#6c63ff' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#475569', fontSize: 11 }}>36 DPI — mais comprimido</span>
                      <span style={{ color: '#475569', fontSize: 11 }}>200 DPI — mais nítido</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Estimativa */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>Estimativa real do tamanho final:</span>
              {calculandoEstimativa ? (
                <span style={{ color: '#475569', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #6c63ff', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  calculando...
                </span>
              ) : estimativa !== null ? (
                <span style={{ color: presetAtual.cor, fontWeight: 800, fontSize: 15 }}>
                  ≈ {formatBytes(estimativa)}
                  <span style={{ color: '#475569', fontSize: 11, fontWeight: 400, marginLeft: 6 }}>
                    ({Math.max(0, Math.round((1 - estimativa / arquivo.size) * 100))}% menor)
                  </span>
                </span>
              ) : (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={calcularEstimativa}
                  style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: 8, color: '#a78bfa', fontSize: 12, fontWeight: 700, padding: '5px 12px', cursor: 'pointer' }}
                >
                  🔍 Calcular
                </motion.button>
              )}
            </div>
            {estimativa === null && !calculandoEstimativa && (
              <p style={{ color: '#334155', fontSize: 11, margin: '6px 0 0' }}>
                Clique em "Calcular" para ver uma estimativa precisa baseada no seu PDF
              </p>
            )}
            {estimativaErro && (
              <div style={{ marginTop: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#fb7185', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
                ⚠️ {estimativaErro}
              </div>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={comprimir}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6c63ff, #00d9ff)',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              color: '#fff',
              fontWeight: 900,
              fontSize: 16,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            ⚡ Comprimir PDF
          </motion.button>
        </motion.div>
      )}

      {/* ── Processando ───────────────────────────────────────────────────── */}
      {processando && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⚙️</div>
          <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 6 }}>
            Comprimindo… página {Math.ceil((progresso / 100) * totalPaginas)} de {totalPaginas}
          </p>
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden', margin: '12px 0' }}>
            <motion.div
              animate={{ width: `${progresso}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', background: 'linear-gradient(90deg,#6c63ff,#00d9ff)', borderRadius: 8 }}
            />
          </div>
          <p style={{ color: '#475569', fontSize: 13, marginBottom: 20 }}>{progresso}% concluído — processando no seu dispositivo 🔒</p>

          {/* ── Banner LED estilo estádio ── */}
          <div style={{
            overflow: 'hidden',
            background: '#000',
            border: '2px solid #f0db4f',
            borderRadius: 8,
            padding: '8px 0',
            position: 'relative',
            boxShadow: '0 0 12px rgba(240,219,79,0.4), inset 0 0 8px rgba(0,0,0,0.8)',
          }}>
            {/* Dots decorativos nas bordas */}
            <div style={{ position: 'absolute', top: 3, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 6px', pointerEvents: 'none' }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
                  style={{ width: 4, height: 4, borderRadius: '50%', background: '#f0db4f', display: 'inline-block' }}
                />
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: 3, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 6px', pointerEvents: 'none' }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
                  style={{ width: 4, height: 4, borderRadius: '50%', background: '#f0db4f', display: 'inline-block' }}
                />
              ))}
            </div>

            {/* Texto correndo */}
            <div style={{ overflow: 'hidden', padding: '4px 0' }}>
              <motion.div
                animate={{ x: ['100%', '-200%'] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: 13,
                  letterSpacing: '0.12em',
                  color: '#f0db4f',
                  textShadow: '0 0 8px #f0db4f, 0 0 16px rgba(240,219,79,0.5)',
                  paddingLeft: '100%',
                }}
              >
                ⚽ AGUARDE — O TEMPO DEPENDE DO PROCESSADOR DO SEU APARELHO &nbsp;·&nbsp; ARQUIVOS MAIORES PODEM LEVAR MAIS TEMPO &nbsp;·&nbsp; NÃO FECHE ESTA TELA &nbsp;·&nbsp; PROCESSANDO COM SEGURANÇA NO SEU DISPOSITIVO 🔒 &nbsp;·&nbsp; ⚽ AGUARDE — O TEMPO DEPENDE DO PROCESSADOR DO SEU APARELHO &nbsp;·&nbsp;
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Resultado ─────────────────────────────────────────────────────── */}
      {resultado && !processando && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <p style={{ color: '#22c55e', fontWeight: 900, fontSize: 17, marginBottom: 14 }}>PDF comprimido com sucesso!</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
              <div>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Original</p>
                <p style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 16 }}>{formatBytes(resultado.originalSize)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: '#475569', fontSize: 20 }}>→</div>
              <div>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Comprimido</p>
                <p style={{ color: '#22c55e', fontWeight: 800, fontSize: 16 }}>{formatBytes(resultado.comprimidoSize)}</p>
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Redução</p>
                <p style={{ color: '#00d9ff', fontWeight: 800, fontSize: 16 }}>
                  {Math.max(0, Math.round((1 - resultado.comprimidoSize / resultado.originalSize) * 100))}%
                </p>
              </div>
            </div>

            {resultado.comprimidoSize >= resultado.originalSize && (
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#fbbf24', fontSize: 13 }}>
                ⚠️ O arquivo não reduziu — provavelmente já estava otimizado. Tente o modo <strong>Agressivo</strong> ou <strong>Máximo</strong>.
              </div>
            )}

            <p style={{ color: '#475569', fontSize: 12, marginBottom: 14 }}>
              💡 Abra o PDF antes de substituir o original para confirmar que está legível.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={baixar}
              style={{ flex: 1, background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}
            >
              ⬇️ Baixar PDF Comprimido
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={resetar}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 18px', color: '#94a3b8', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Novo
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ── Fechar ───────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onClose}
        style={{
          display: 'block',
          margin: '20px auto 0',
          background: 'none',
          border: 'none',
          color: '#475569',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        ✕ Fechar
      </button>
    </div>
  );
}
