import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';

const CompressorPDF   = lazy(() => import('./ui/CompressorPDF'));
const ConversorImagem = lazy(() => import('./ui/ConversorImagem'));
const RemoveFundo     = lazy(() => import('./ui/RemoveFundo'));

// ─── SVG Engrenagem ───────────────────────────────────────────────────────────
function SvgGear({ size = 22, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.4s', transform: spinning ? 'rotate(60deg)' : 'rotate(0deg)' }}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// ─── Utilitários disponíveis ──────────────────────────────────────────────────
type UtilKey = 'pdf' | 'imagem' | 'removefundo';

interface Util {
  key: UtilKey;
  emoji: string;
  label: string;
  desc: string;
  badge?: string;
}

const UTILS: Util[] = [
  {
    key: 'pdf',
    emoji: '📄',
    label: 'Compressor de PDF',
    desc: 'Reduza o tamanho do seu PDF direto no navegador, sem enviar para nenhum servidor.',
    badge: 'NOVO',
  },
  {
    key: 'imagem',
    emoji: '🖼️',
    label: 'Conversor de Imagens',
    desc: 'Converta PNG, JPG, WEBP, GIF, SVG e mais — para qualquer formato, incluindo PDF.',
    badge: 'NOVO',
  },
  {
    key: 'removefundo',
    emoji: '✂️',
    label: 'Remover Fundo',
    desc: 'IA remove o fundo da sua foto automaticamente — resultado em PNG transparente.',
    badge: 'NOVO',
  },
];

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Utilitarios() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [utilAtiva, setUtilAtiva] = useState<UtilKey | null>(null);
  const [spinning, setSpinning] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        fechar();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Bloqueia scroll do body quando modal aberto
  useEffect(() => {
    if (menuAberto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuAberto]);

  const abrirMenu = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 500);
    setMenuAberto(true);
  };

  const fechar = () => {
    setMenuAberto(false);
    setUtilAtiva(null);
  };

  return (
    <>
      {/* ── Botão flutuante ─────────────────────────────────────────────── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onClick={abrirMenu}
        title="Utilitários"
        style={{
          position: 'fixed',
          bottom: 60,
          right: 20,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(135deg, #1a1a3e, #0f0f2a)',
          border: '1px solid rgba(108,99,255,0.45)',
          borderRadius: 50,
          padding: '6px 14px 6px 10px',
          color: '#a78bfa',
          fontWeight: 600,
          fontSize: 12,
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(108,99,255,0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <SvgGear size={16} spinning={spinning} />
        <span>Utilitários</span>
      </motion.button>

      {/* ── Modal overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuAberto && (
          <motion.div
            ref={overlayRef}
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                width: '100%',
                maxWidth: 600,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#0d0d1f',
                border: '1px solid rgba(108,99,255,0.25)',
                borderRadius: 22,
                padding: '24px 22px',
                position: 'relative',
              }}
            >
              {/* Header do modal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ background: 'rgba(108,99,255,0.15)', borderRadius: 10, padding: '7px 9px', display: 'flex' }}>
                  <SvgGear size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontWeight: 900, fontSize: 18, color: '#f1f5f9' }}>
                    Utilitários
                  </h2>
                  <p style={{ margin: 0, color: '#475569', fontSize: 12 }}>
                    Ferramentas gratuitas que funcionam direto no seu navegador
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={fechar}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', fontSize: 16 }}
                >
                  ✕
                </motion.button>
              </div>

              {/* ── Lista de utilitários (home do menu) ─────────────────── */}
              <AnimatePresence mode="wait">
                {!utilAtiva && (
                  <motion.div key="lista" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {UTILS.map((u) => (
                        <motion.button
                          key={u.key}
                          type="button"
                          whileHover={{ scale: 1.02, borderColor: 'rgba(108,99,255,0.45)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setUtilAtiva(u.key)}
                          style={{
                            background: 'rgba(108,99,255,0.05)',
                            border: '1.5px solid rgba(108,99,255,0.2)',
                            borderRadius: 14,
                            padding: '16px 18px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ fontSize: 32, flexShrink: 0 }}>{u.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 15 }}>{u.label}</span>
                              {u.badge && (
                                <span style={{ background: 'rgba(0,217,255,0.15)', border: '1px solid rgba(0,217,255,0.3)', borderRadius: 6, color: '#00d9ff', fontSize: 10, fontWeight: 800, padding: '1px 7px', letterSpacing: '0.05em' }}>
                                  {u.badge}
                                </span>
                              )}
                            </div>
                            <p style={{ color: '#64748b', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{u.desc}</p>
                          </div>
                          <span style={{ color: '#475569', fontSize: 18, flexShrink: 0 }}>›</span>
                        </motion.button>
                      ))}

                      {/* Placeholder próximos utilitários */}
                      <div style={{ border: '1.5px dashed rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px', color: '#334155', fontSize: 13, textAlign: 'center' }}>
                        🔜 Em breve — mais ferramentas chegando...
                      </div>
                    </div>

                    {/* Rodapé do menu */}
                    <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ color: '#334155', fontSize: 12, margin: 0 }}>
                        🔒 Nenhuma ferramenta envia seus dados para servidores · Tudo funciona no seu dispositivo
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Tela do utilitário selecionado ──────────────────── */}
                {utilAtiva && (
                  <motion.div key="util" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                    <button
                      type="button"
                      onClick={() => setUtilAtiva(null)}
                      style={{ background: 'none', border: 'none', color: '#6c63ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      ← Voltar para Utilitários
                    </button>

                    <Suspense fallback={
                      <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #6c63ff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                        Carregando...
                      </div>
                    }>
                      {utilAtiva === 'pdf'         && <CompressorPDF   onClose={fechar} />}
                      {utilAtiva === 'imagem'      && <ConversorImagem  onClose={fechar} />}
                      {utilAtiva === 'removefundo' && <RemoveFundo       onClose={fechar} />}
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
