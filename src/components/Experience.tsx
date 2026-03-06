import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ReactSVG, NodeSVG, AndroidSVG, iOSSVG, KotlinSVG,
  CapacitorSVG, GooglePlaySVG, SankhyaSVG, CopilotSVG,
} from './TechSVGs';

const OracleSVG = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#oraGrad)" />
    <ellipse cx="20" cy="14" rx="12" ry="5" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
    <line x1="8" y1="14" x2="8" y2="26" stroke="white" strokeWidth="2" opacity="0.9"/>
    <line x1="32" y1="14" x2="32" y2="26" stroke="white" strokeWidth="2" opacity="0.9"/>
    <ellipse cx="20" cy="26" rx="12" ry="5" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
    <ellipse cx="20" cy="20" rx="12" ry="5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5"/>
    <defs>
      <linearGradient id="oraGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c0392b" />
        <stop offset="100%" stopColor="#ff6b35" />
      </linearGradient>
    </defs>
  </svg>
);

const MySQLSVG = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#mysqlGrad)" />
    <ellipse cx="20" cy="13" rx="11" ry="4.5" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
    <line x1="9" y1="13" x2="9" y2="27" stroke="white" strokeWidth="2" opacity="0.9"/>
    <line x1="31" y1="13" x2="31" y2="27" stroke="white" strokeWidth="2" opacity="0.9"/>
    <ellipse cx="20" cy="27" rx="11" ry="4.5" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
    <ellipse cx="20" cy="20" rx="11" ry="4.5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5"/>
    <defs>
      <linearGradient id="mysqlGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00618e" />
        <stop offset="100%" stopColor="#00a1d6" />
      </linearGradient>
    </defs>
  </svg>
);

const experiences = [
  {
    SVG: ReactSVG,
    title: 'React Developer',
    period: '2023 – Atual',
    color: '#61DAFB',
    items: [
      'Desenvolvimento de SPAs e dashboards com hooks modernos',
      'Framer Motion, Tailwind CSS, Context API e React Query',
      'Deploy em Vercel com CI/CD integrado',
      'Componentes reutilizáveis com TypeScript',
    ],
  },
  {
    SVG: NodeSVG,
    title: 'Node.js Backend',
    period: '2023 – Atual',
    color: '#8CC84B',
    items: [
      'APIs REST e middleware com Express.js',
      'Integração com bancos SQL e NoSQL',
      'Autenticação JWT e OAuth',
      'Deploy em servidores VPS e cloud',
    ],
  },
  {
    SVG: AndroidSVG,
    title: 'Android Developer',
    period: '2020 – Atual',
    color: '#a4c639',
    items: [
      'Android Studio com Kotlin nativo',
      'APK assinado com chave de conta Google Console',
      'Publicação e atualizações na Google Play Store',
      'Apps WebView e apps Capacitor',
    ],
  },
  {
    SVG: iOSSVG,
    title: 'iOS Developer',
    period: '2024 – Atual',
    color: '#0A84FF',
    items: [
      'Xcode e simuladores iOS/iPadOS',
      'Capacitor para build iOS de apps web',
      'TestFlight para testes beta',
      'Preparação para App Store',
    ],
  },
  {
    SVG: KotlinSVG,
    title: 'Kotlin Nativo',
    period: '2020 – Atual',
    color: '#7F52FF',
    items: [
      'Apps Kotlin com ciclo de vida Android',
      'Jetpack Compose básico',
      'Room Database e ViewModel',
      'Integração com APIs externas',
    ],
  },
  {
    SVG: CapacitorSVG,
    title: 'Capacitor / WebView',
    period: '2023 – Atual',
    color: '#53B9FF',
    items: [
      'Apps híbridos com Capacitor para Android e iOS',
      'Bridge JS/Native para funcionalidades nativas',
      'Plugins customizados para câmera, GPS, notificações',
      'Build e signing para ambas as plataformas',
    ],
  },
  {
    SVG: GooglePlaySVG,
    title: 'Google Play Console',
    period: '2020 – Atual',
    color: '#00E676',
    items: [
      'Geração e gestão de chave de assinatura APK/AAB',
      'Upload, review e publicação de apps',
      'Gerenciamento de versões e rollouts',
      'Tracks Alpha, Beta e Produção',
    ],
  },
  {
    SVG: SankhyaSVG,
    title: 'ERP Sankhya',
    period: '2019 – Atual',
    color: '#FF6B35',
    items: [
      'Customizações no Sankhya Navegador',
      'Telas personalizadas e relatórios',
      'Integração via API Sankhya',
      'Suporte a usuários e implantação',
    ],
  },
  {
    SVG: CopilotSVG,
    title: 'GitHub Copilot',
    period: '2024 – Atual',
    color: '#e040fb',
    items: [
      'Uso diário do Copilot inline no VS Code',
      'Copilot Chat para revisão e debugging',
      'Geração de testes automatizados com IA',
      'Refactoring e documentação assistidos por IA',
    ],
  },
  {
    SVG: OracleSVG,
    title: 'Oracle SQL',
    period: '2019 – Atual',
    color: '#e74c3c',
    items: [
      'Queries complexas com joins, subqueries e CTEs',
      'Procedures e functions PL/SQL',
      'Otimização de índices e performance',
      'Integração com ERP Sankhya via banco Oracle',
    ],
  },
  {
    SVG: MySQLSVG,
    title: 'MySQL',
    period: '2020 – Atual',
    color: '#00a1d6',
    items: [
      'Modelagem e normalização de tabelas',
      'Queries otimizadas com índices e explain',
      'Stored procedures e triggers',
      'Integração com APIs Node.js via Sequelize',
    ],
  },
];

const VISIBLE = 3;

export default function Experience() {
  const headerRef = useRef(null);
  const isHeaderVisible = useInView(headerRef, { once: true });
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(experiences.length - VISIBLE, c + 1));

  return (
    <section id="experience" className="py-24 px-4 relative overflow-hidden">
      {/* BG glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
        style={{ background: 'var(--primary)', filter: 'blur(120px)' }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'rgba(255,107,107,0.12)', color: 'var(--accent)', border: '1px solid rgba(255,107,107,0.3)' }}>
            Jornada Profissional
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            Minha <span className="gradient-text">Experiência</span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Anos desenvolvendo soluções reais com impacto direto nos negócios dos clientes.
          </p>
        </motion.div>

        {/* Blur Slider */}
        <div className="relative overflow-hidden">
          {/* Desktop: sliding cards */}
          <div className="hidden md:block overflow-hidden">
            <motion.div
              className="flex gap-5"
              animate={{ x: `-${current * (100 / experiences.length)}%` }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ width: `${(experiences.length / VISIBLE) * 100}%` }}
            >
              {experiences.map((exp, i) => (
                <div key={exp.title} style={{ flex: `0 0 ${100 / experiences.length}%` }}>
                  <ExperienceCard exp={exp} index={i} visible={current} total={VISIBLE} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mobile: vertical stack */}
          <div className="md:hidden flex flex-col gap-5">
            {experiences.map((exp, i) => (
              <div key={exp.title} className="w-full">
                <ExperienceCard exp={exp} index={i} visible={0} total={1} />
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={prev}
              disabled={current === 0}
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all disabled:opacity-30"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >←</motion.button>

            <div className="flex gap-2">
              {experiences.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setCurrent(Math.min(i, experiences.length - VISIBLE))}
                  className="rounded-full transition-all"
                  animate={{
                    width: i >= current && i < current + VISIBLE ? 24 : 8,
                    background: i >= current && i < current + VISIBLE ? 'var(--primary)' : 'var(--border)',
                  }}
                  style={{ height: 8 }}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={next}
              disabled={current >= experiences.length - VISIBLE}
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all disabled:opacity-30"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >→</motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({ exp, index, visible, total }: {
  exp: typeof experiences[0];
  index: number;
  visible: number;
  total: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const isActive = index >= visible && index < visible + total;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40, filter: 'blur(12px)' }}
      animate={isInView ? { opacity: isActive ? 1 : 0.5, x: 0, filter: 'blur(0px)', scale: isActive ? 1 : 0.97 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 rounded-2xl p-6 gradient-border"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        width: '100%',
        minWidth: 0,
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${exp.color}18`, border: `1px solid ${exp.color}33` }}>
          <exp.SVG size={36} />
        </div>
        <div>
          <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{exp.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${exp.color}22`, color: exp.color }}>
            {exp.period}
          </span>
        </div>
      </div>
      <ul className="space-y-2">
        {exp.items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: exp.color, marginTop: '2px', flexShrink: 0 }}>▸</span>
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
