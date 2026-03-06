import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ExternalLink, X, Smartphone } from 'lucide-react';

// SVG icons replacing emojis
const DashboardSVG = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#dashGrad)" />
    <rect x="8" y="22" width="6" height="12" rx="2" fill="white" opacity="0.9" />
    <rect x="17" y="14" width="6" height="20" rx="2" fill="white" opacity="0.9" />
    <rect x="26" y="8" width="6" height="26" rx="2" fill="white" opacity="0.9" />
    <polyline points="8,20 20,12 32,6" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    <defs>
      <linearGradient id="dashGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6c63ff" />
        <stop offset="100%" stopColor="#00d9ff" />
      </linearGradient>
    </defs>
  </svg>
);

const BalancaSVG = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#balGrad)" />
    <line x1="20" y1="8" x2="20" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="8" y1="14" x2="32" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="8" cy="14" r="4" fill="white" opacity="0.9" />
    <circle cx="32" cy="14" r="4" fill="white" opacity="0.9" />
    <rect x="15" y="30" width="10" height="3" rx="1.5" fill="white" opacity="0.9" />
    <defs>
      <linearGradient id="balGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0097b2" />
        <stop offset="100%" stopColor="#00d9ff" />
      </linearGradient>
    </defs>
  </svg>
);

const BusSVG = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#busGrad)" />
    <rect x="7" y="12" width="26" height="16" rx="3" fill="white" opacity="0.9" />
    <rect x="9" y="14" width="7" height="6" rx="1" fill="url(#busGrad)" />
    <rect x="18" y="14" width="7" height="6" rx="1" fill="url(#busGrad)" />
    <rect x="27" y="14" width="4" height="6" rx="1" fill="url(#busGrad)" />
    <rect x="7" y="26" width="26" height="3" rx="1" fill="white" opacity="0.5" />
    <circle cx="12" cy="31" r="2.5" fill="white" />
    <circle cx="28" cy="31" r="2.5" fill="white" />
    <rect x="5" y="18" width="2" height="6" rx="1" fill="white" opacity="0.7" />
    <rect x="33" y="18" width="2" height="6" rx="1" fill="white" opacity="0.7" />
    <defs>
      <linearGradient id="busGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="100%" stopColor="#ff9a00" />
      </linearGradient>
    </defs>
  </svg>
);

const PlayStoreSVG = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#playBg)" />
    {/* Play triangle */}
    <path d="M13 11 L13 29 L31 20 Z" fill="white" opacity="0.95" />
    {/* Colorful bottom sweep */}
    <path d="M13 26 L25 20 L31 20 L13 29 Z" fill="#fbbc04" opacity="0.9" />
    <path d="M13 11 L25 20 L13 20 Z" fill="#34a853" opacity="0.9" />
    <path d="M13 11 L13 14 L16 20 L13 20 Z" fill="#4285f4" opacity="0.9" />
    <defs>
      <linearGradient id="playBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#16213e" />
      </linearGradient>
    </defs>
  </svg>
);

interface Project {
  id: number;
  title: string;
  description: string;
  url: string;
  tags: string[];
  color: string;
  Icon: React.FC;
  noIframe?: boolean;
  externalLabel?: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: 'Dashboard Gean',
    description: 'Dashboard administrativo com KPIs e charts interativos.',
    url: 'https://dashboard-geanoliveira99.vercel.app/',
    tags: ['React', 'TypeScript', 'Tailwind'],
    color: '#6c63ff',
    Icon: DashboardSVG,
  },
  {
    id: 2,
    title: 'Balança de Produção',
    description: 'Controle de pesagens industriais e relatórios em tempo real.',
    url: 'https://geanoliveira99-balanca-producao.vercel.app/',
    tags: ['React', 'Node.js', 'Integração'],
    color: '#00d9ff',
    Icon: BalancaSVG,
  },
  {
    id: 3,
    title: 'Dporquitobus',
    description: 'Sistema de gestão para empresa de transportes.',
    url: 'http://dporquitobus.sgean.com/',
    tags: ['React', 'Node.js', 'Gestão'],
    color: '#ff6b6b',
    Icon: BusSVG,
    noIframe: true,
    externalLabel: 'Abrir no Navegador',
  },
  {
    id: 4,
    title: 'Dporquitobus App',
    description: 'Aplicativo Android para consulta de rotas e horários de ônibus, publicado na Google Play Store.',
    url: 'https://play.google.com/store/apps/details?id=space.gtasadreamer.domporquitobus',
    tags: ['Android', 'Google Play', 'Mobile'],
    color: '#34a853',
    Icon: PlayStoreSVG,
    noIframe: true,
    externalLabel: 'Ver na Google Play',
  },
];

function IPhoneModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(project.noIframe ?? false);

  useEffect(() => {
    if (project.noIframe) return;
    const t = setTimeout(() => { if (!loaded) setBlocked(true); }, 6000);
    return () => clearTimeout(t);
  }, [loaded, project.noIframe]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: 80, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.5, y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col items-center"
      >
        {/* Header above phone */}
        <div className="flex items-center justify-between w-full mb-4 px-2">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <project.Icon />
              {project.title}
            </h3>
            <p className="text-sm text-gray-400">{project.url}</p>
          </div>
          <div className="flex gap-2">
            <motion.a
              whileHover={{ scale: 1.1 }}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 text-white"
              style={{ background: project.color }}
            >
              <ExternalLink size={14} /> Abrir
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <X size={18} />
            </motion.button>
          </div>
        </div>

        {/* iPhone frame */}
        <div
          className="iphone-frame"
          style={{
            width: 'min(340px, 85vw)',
            height: 'min(660px, 80vh)',
            boxShadow: `0 0 0 2px #333, 0 40px 80px rgba(0,0,0,0.7), 0 0 60px ${project.color}44`,
          }}
        >
          {/* Notch */}
          <div className="iphone-notch" />
          {/* Screen */}
          <div className="w-full h-full pt-7 bg-white relative overflow-hidden">
            {!loaded && !blocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                style={{ background: '#0a0a0f' }}>
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: project.color, borderTopColor: 'transparent' }} />
                <span className="text-sm text-gray-400">Carregando projeto...</span>
              </div>
            )}
            {blocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center"
                style={{ background: project.noIframe ? `radial-gradient(circle at 50% 40%, ${project.color}22, #0a0a0f 70%)` : '#0a0a0f' }}>
                {project.noIframe ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="rounded-2xl p-3"
                      style={{ background: `${project.color}22`, border: `1.5px solid ${project.color}55` }}
                    >
                      <project.Icon />
                    </motion.div>
                    <div>
                      <p className="text-white font-bold text-base mb-1">{project.title}</p>
                      <p className="text-gray-400 text-sm leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                        {project.id === 4
                          ? 'Disponível na Google Play Store.\nBaixe o app gratuitamente!'
                          : 'Acesse diretamente no\nseu navegador.'}
                      </p>
                    </div>
                    <motion.a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 rounded-2xl text-sm font-bold text-white flex items-center gap-2 shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${project.color}, ${project.color}cc)`, boxShadow: `0 0 24px ${project.color}55` }}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink size={15} /> {project.externalLabel ?? 'Abrir'}
                    </motion.a>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 40 }}>🔒</span>
                    <span className="text-white font-bold text-base">Site bloqueado para incorporação</span>
                    <span className="text-gray-400 text-sm">Este site não permite ser exibido aqui.</span>
                    <a href={project.url} target="_blank" rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl text-sm font-bold text-white mt-2 flex items-center gap-2"
                      style={{ background: project.color }}>
                      <ExternalLink size={14} /> Abrir no navegador
                    </a>
                  </>
                )}
              </div>
            )}
            {!project.noIframe && (
              <iframe
                src={project.url}
                title={project.title}
                className="w-full h-full border-0"
                style={{ display: loaded && !blocked ? 'block' : 'none' }}
                onLoad={() => setLoaded(true)}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </div>
        </div>

        {/* Home bar */}
        <div className="w-24 h-1 rounded-full mt-3" style={{ background: 'rgba(255,255,255,0.3)' }} />
      </motion.div>
    </motion.div>
  );
}

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const headerRef = useRef(null);
  const isHeaderVisible = useInView(headerRef, { once: true });

  return (
    <section id="projects" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-grid opacity-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'rgba(0,217,255,0.12)', color: 'var(--secondary)', border: '1px solid rgba(0,217,255,0.3)' }}>
            Portfólio Real
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            Meus <span className="gradient-text">Projetos</span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Projetos reais em produção. Clique em qualquer projeto para ver rodando dentro de uma tela de iPhone interativa.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => setSelectedProject(project)}
              className="cursor-pointer rounded-2xl overflow-hidden relative group"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 50% 50%, ${project.color}18 0%, transparent 70%)` }}
              />

              {/* Preview area with iframe thumbnail */}
              <div className="relative overflow-hidden" style={{ height: '160px', background: '#000' }}>
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${project.color}22 0%, #000 100%)` }}
                />
                {/* Simulated browser preview */}
                <div className="absolute inset-2 rounded-lg overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ border: `1px solid ${project.color}44` }}>
                  <div className="w-full h-5 flex items-center gap-1 px-2"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <span className="w-2 h-2 rounded-full bg-red-500 opacity-80" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500 opacity-80" />
                    <span className="w-2 h-2 rounded-full bg-green-500 opacity-80" />
                    <span className="ml-2 text-[9px] opacity-50 truncate" style={{ color: 'white' }}>{project.url}</span>
                  </div>
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: `radial-gradient(circle, ${project.color}18 0%, transparent 70%)` }}>
                    <project.Icon />
                  </div>
                </div>
                {/* Click hint */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white"
                    style={{ background: project.color }}>
                    <Smartphone size={14} /> Ver no iPhone
                  </div>
                </motion.div>
              </div>

              {/* Card info */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <project.Icon />
                  <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{project.title}</h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>{project.description}</p>

                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: `${project.color}18`, color: project.color, border: `1px solid ${project.color}33` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* iPhone Modal */}
      <AnimatePresence>
        {selectedProject && (
          <IPhoneModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
