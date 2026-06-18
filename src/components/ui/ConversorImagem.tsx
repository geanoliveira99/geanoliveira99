import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type FormatoSaida = 'jpg' | 'png' | 'webp' | 'pdf';

interface ArquivoItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'aguardando' | 'convertendo' | 'pronto' | 'erro';
  erro?: string;
  resultUrl?: string;
  resultNome?: string;
  resultTamanho?: number;
}

const FORMATOS: { key: FormatoSaida; label: string; mime?: string; descricao: string; qualidade: boolean }[] = [
  { key: 'jpg',  label: 'JPG',  mime: 'image/jpeg', descricao: 'Ótimo para fotos · menor tamanho · sem transparência', qualidade: true  },
  { key: 'png',  label: 'PNG',  mime: 'image/png',  descricao: 'Sem perda de qualidade · suporta transparência',        qualidade: false },
  { key: 'webp', label: 'WEBP', mime: 'image/webp', descricao: 'Formato moderno · melhor compressão que JPG e PNG',     qualidade: true  },
  { key: 'pdf',  label: 'PDF',  mime: undefined,    descricao: 'Imagem embutida num documento PDF',                     qualidade: false },
];

const ACEITOS = 'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif,image/tiff,image/x-icon,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.avif,.tiff,.tif,.ico';

function formatarBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function gerarId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function trocaExtensao(nome: string, ext: string): string {
  const partes = nome.split('.');
  if (partes.length > 1) partes[partes.length - 1] = ext;
  else partes.push(ext);
  return partes.join('.');
}

// Converte File → canvas → blob na formato desejado
async function converterArquivo(
  file: File,
  formato: FormatoSaida,
  qualidade: number,
): Promise<{ blob: Blob; nome: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth  || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas não suportado')); return; }

      // Fundo branco para formatos sem transparência (jpg/pdf)
      if (formato === 'jpg' || formato === 'pdf') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      if (formato === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', qualidade);
        const orientacao = canvas.width > canvas.height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({ orientation: orientacao, unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        const pdfBlob = pdf.output('blob');
        resolve({ blob: pdfBlob, nome: trocaExtensao(file.name, 'pdf') });
        return;
      }

      const fmt = FORMATOS.find(f => f.key === formato)!;
      const mime = fmt.mime!;
      const q = fmt.qualidade ? qualidade : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Falha ao gerar imagem — tente outro formato')); return; }
          resolve({ blob, nome: trocaExtensao(file.name, formato) });
        },
        mime,
        q,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem'));
    };

    // SVG precisa de src especial
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      img.src = url;
    }
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ConversorImagem({ onClose: _onClose }: { onClose: () => void }) {
  const [arquivos, setArquivos] = useState<ArquivoItem[]>([]);
  const [formato, setFormato]   = useState<FormatoSaida>('jpg');
  const [qualidade, setQualidade] = useState(0.85);
  const [convertendo, setConvertendo] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatoAtual = FORMATOS.find(f => f.key === formato)!;

  // ── Adicionar arquivos ──────────────────────────────────────────────────────
  const adicionarArquivos = useCallback((fileList: FileList | File[]) => {
    const novos: ArquivoItem[] = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
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
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(a => a.id !== id);
    });
  };

  const limpar = () => {
    arquivos.forEach(a => URL.revokeObjectURL(a.previewUrl));
    setArquivos([]);
    setProgresso(0);
  };

  // ── Conversão ───────────────────────────────────────────────────────────────
  const converter = async () => {
    if (!arquivos.length || convertendo) return;
    setConvertendo(true);
    setProgresso(0);

    const total = arquivos.length;

    for (let i = 0; i < total; i++) {
      const item = arquivos[i];

      // Marca como convertendo
      setArquivos(prev => prev.map(a =>
        a.id === item.id ? { ...a, status: 'convertendo' } : a
      ));

      try {
        const { blob, nome } = await converterArquivo(item.file, formato, qualidade);
        const resultUrl = URL.createObjectURL(blob);

        setArquivos(prev => prev.map(a =>
          a.id === item.id
            ? { ...a, status: 'pronto', resultUrl, resultNome: nome, resultTamanho: blob.size }
            : a
        ));
      } catch (err) {
        setArquivos(prev => prev.map(a =>
          a.id === item.id
            ? { ...a, status: 'erro', erro: (err as Error).message }
            : a
        ));
      }

      setProgresso(Math.round(((i + 1) / total) * 100));
    }

    setConvertendo(false);
  };

  // ── Download ────────────────────────────────────────────────────────────────
  const baixar = (item: ArquivoItem) => {
    if (!item.resultUrl || !item.resultNome) return;
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = item.resultNome;
    a.click();
  };

  const baixarTodos = () => {
    const prontos = arquivos.filter(a => a.status === 'pronto');
    prontos.forEach((a, i) => {
      setTimeout(() => baixar(a), i * 300);
    });
  };

  const prontos = arquivos.filter(a => a.status === 'pronto').length;
  const jaConverteu = prontos > 0 && !convertendo;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: '#e2e8f0' }}>

      {/* Título */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          🖼️ Conversor de Imagens
        </h3>
        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 12 }}>
          Converta para JPG, PNG, WEBP, BMP ou PDF · funciona direto no navegador
        </p>
      </div>

      {/* ── Seletor de formato ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Converter para:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FORMATOS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setFormato(f.key); setArquivos(prev => prev.map(a => ({ ...a, status: 'aguardando', resultUrl: undefined, resultNome: undefined }))); }}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                border: formato === f.key ? '2px solid #6c63ff' : '1.5px solid rgba(255,255,255,0.08)',
                background: formato === f.key ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: formato === f.key ? '#a78bfa' : '#64748b',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 11 }}>
          {formatoAtual.descricao}
        </p>
      </div>

      {/* ── Qualidade (só para JPG/WEBP) ──────────────────────────────────── */}
      <AnimatePresence>
        {formatoAtual.qualidade && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 16 }}
          >
            <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Qualidade</span>
              <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: 13 }}>
                {Math.round(qualidade * 100)}%
              </span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(qualidade * 100)}
              onChange={e => setQualidade(Number(e.target.value) / 100)}
              style={{ width: '100%', accentColor: '#6c63ff', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#334155', marginTop: 2 }}>
              <span>Menor arquivo</span>
              <span>Máxima qualidade</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Zona de drop ──────────────────────────────────────────────────── */}
      {!jaConverteu && (
        <div
          onDragOver={e => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${arrastando ? '#6c63ff' : 'rgba(108,99,255,0.25)'}`,
            borderRadius: 14,
            padding: '28px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: arrastando ? 'rgba(108,99,255,0.08)' : 'rgba(108,99,255,0.03)',
            transition: 'all 0.2s',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
          <p style={{ margin: 0, color: '#94a3b8', fontWeight: 700, fontSize: 14 }}>
            {arrastando ? 'Solte as imagens aqui!' : 'Clique ou arraste imagens'}
          </p>
          <p style={{ margin: '4px 0 0', color: '#334155', fontSize: 11 }}>
            PNG · JPG · WEBP · GIF · BMP · SVG · AVIF · TIFF · ICO
          </p>
          <p style={{ margin: '4px 0 0', color: '#334155', fontSize: 11 }}>
            Múltiplos arquivos permitidos
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

      {/* ── Lista de arquivos ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {arquivos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

            {/* Cabeçalho da lista */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                {arquivos.length} {arquivos.length === 1 ? 'imagem' : 'imagens'} selecionada{arquivos.length !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {!jaConverteu && (
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
                  style={{ background: 'none', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 7, padding: '3px 10px', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Cards de arquivos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
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
                      item.status === 'pronto' ? 'rgba(34,197,94,0.35)' :
                      item.status === 'erro'   ? 'rgba(239,68,68,0.35)' :
                      item.status === 'convertendo' ? 'rgba(108,99,255,0.4)' :
                      'rgba(255,255,255,0.07)'
                    }`,
                    borderRadius: 12,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {/* Thumbnail */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 7, flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.file.name}
                    </p>
                    <p style={{ margin: '2px 0 0', color: '#475569', fontSize: 11 }}>
                      {formatarBytes(item.file.size)}
                      {item.status === 'pronto' && item.resultTamanho !== undefined && (
                        <span style={{ color: '#22c55e', marginLeft: 6 }}>
                          → {formatarBytes(item.resultTamanho)}
                        </span>
                      )}
                    </p>
                    {item.status === 'erro' && (
                      <p style={{ margin: '2px 0 0', color: '#f87171', fontSize: 10 }}>⚠ {item.erro}</p>
                    )}
                    {item.status === 'convertendo' && (
                      <p style={{ margin: '2px 0 0', color: '#a78bfa', fontSize: 10 }}>Convertendo...</p>
                    )}
                  </div>

                  {/* Ação */}
                  {item.status === 'pronto' && (
                    <button
                      type="button"
                      onClick={() => baixar(item)}
                      title="Baixar"
                      style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
                    >
                      ⬇
                    </button>
                  )}
                  {item.status === 'convertendo' && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #6c63ff', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  )}
                  {(item.status === 'aguardando' || item.status === 'erro') && (
                    <button
                      type="button"
                      onClick={() => remover(item.id)}
                      title="Remover"
                      style={{ background: 'none', border: 'none', color: '#475569', fontSize: 16, cursor: 'pointer', padding: '4px', flexShrink: 0, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* ── Barra de progresso ─────────────────────────────────────── */}
            <AnimatePresence>
              {convertendo && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#6c63ff', fontWeight: 700 }}>Convertendo...</span>
                    <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700 }}>{progresso}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${progresso}%` }}
                      transition={{ duration: 0.3 }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #6c63ff, #a78bfa)', borderRadius: 99 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Botões de ação ─────────────────────────────────────────── */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!jaConverteu && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={converter}
                  disabled={convertendo || arquivos.length === 0}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: '13px',
                    background: convertendo ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #a78bfa)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: convertendo ? 'not-allowed' : 'pointer',
                    opacity: arquivos.length === 0 ? 0.4 : 1,
                  }}
                >
                  {convertendo ? '⏳ Convertendo...' : `⚡ Converter para ${formato.toUpperCase()}`}
                </motion.button>
              )}

              {jaConverteu && (
                <>
                  {prontos > 1 && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={baixarTodos}
                      style={{
                        flex: 1,
                        minWidth: 140,
                        padding: '13px',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border: 'none',
                        borderRadius: 12,
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      ⬇ Baixar todos ({prontos})
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { limpar(); }}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      padding: '13px',
                      background: 'rgba(108,99,255,0.12)',
                      border: '1.5px solid rgba(108,99,255,0.3)',
                      borderRadius: 12,
                      color: '#a78bfa',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    🔄 Nova conversão
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rodapé privacidade */}
      <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
        <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center' }}>
          🔒 Suas imagens <strong style={{ color: '#475569' }}>nunca saem do seu aparelho</strong> · Tudo processado localmente
        </p>
      </div>
    </div>
  );
}
