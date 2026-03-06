import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ReactSVG, NodeSVG, AndroidSVG, iOSSVG, VSCodeSVG, KotlinSVG,
  CapacitorSVG, GooglePlaySVG, XcodeSVG, SankhyaSVG, CopilotSVG,
  WebViewSVG, VisualStudioSVG,
} from './TechSVGs';

const techs = [
  { name: 'React', SVG: ReactSVG, level: 90, color: '#61DAFB', desc: 'Hooks, Context, Framer Motion, TypeScript, Vite, Tailwind' },
  { name: 'Node.js', SVG: NodeSVG, level: 82, color: '#8CC84B', desc: 'APIs REST, Express, integração com banco de dados e ERPs' },
  { name: 'Android', SVG: AndroidSVG, level: 88, color: '#a4c639', desc: 'Android Studio, Kotlin, APK assinado, Google Play Console' },
  { name: 'iOS / Xcode', SVG: XcodeSVG, level: 72, color: '#279EFF', desc: 'Xcode, Swift básico, publicação na App Store' },
  { name: 'Kotlin', SVG: KotlinSVG, level: 80, color: '#7F52FF', desc: 'Kotlin nativo, Jetpack, ciclo de vida Android' },
  { name: 'Capacitor', SVG: CapacitorSVG, level: 85, color: '#53B9FF', desc: 'Capacitor Android & iOS, plugins nativos, WebView' },
  { name: 'VS Code', SVG: VSCodeSVG, level: 95, color: '#007ACC', desc: 'Extensões, debugging, snippets, Dev Containers' },
  { name: 'GitHub Copilot', SVG: CopilotSVG, level: 88, color: '#e040fb', desc: 'Copilot Chat, inline suggestions, refactoring IA' },
  { name: 'Google Play', SVG: GooglePlaySVG, level: 85, color: '#00E676', desc: 'APK com chave assinada, Console, publicação e atualizações' },
  { name: 'WebView Apps', SVG: WebViewSVG, level: 90, color: '#FFD700', desc: 'Apps híbridos, WebView Android, bridge JS/Native' },
  { name: 'ERP Sankhya', SVG: SankhyaSVG, level: 78, color: '#FF6B35', desc: 'ERP Sankhya Navegador, customizações e integrações' },
  { name: 'Visual Studio', SVG: VisualStudioSVG, level: 75, color: '#9B4F96', desc: '.NET, C#, projetos enterprise e integrações Windows' },
  { name: 'iOS Nativo', SVG: iOSSVG, level: 68, color: '#0A84FF', desc: 'Desenvolvimento iOS com Xcode, simuladores e TestFlight' },
];

// Cinematic entry animation to play before revealing each card
const IntroAnimation = ({ name, SVG, color, onComplete }: { name: string; SVG: React.FC<{ size?: number }>; color: string; onComplete: () => void }) => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
      style={{ background: `radial-gradient(circle at center, ${color}22 0%, transparent 70%)`, zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.2, times: [0, 0.2, 0.8, 1] }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        initial={{ scale: 0.3, rotate: -180, opacity: 0 }}
        animate={{ scale: [0.3, 1.4, 1], rotate: [180, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <SVG size={72} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -5] }}
        transition={{ duration: 2, delay: 0.4 }}
        className="mt-3 font-bold text-lg"
        style={{ color }}
      >
        {name}
      </motion.p>
    </motion.div>
  );
};

const TechCard = ({ tech, index }: { tech: typeof techs[0]; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [showIntro, setShowIntro] = useState(true);
  const [introPlayed, setIntroPlayed] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="tech-card rounded-2xl p-5 cursor-pointer relative overflow-hidden gradient-border"
      style={{ minHeight: '160px' }}
    >
      {/* Intro cinematic animation */}
      <AnimatePresence>
        {isInView && showIntro && !introPlayed && (
          <IntroAnimation
            name={tech.name}
            SVG={tech.SVG}
            color={tech.color}
            onComplete={() => { setShowIntro(false); setIntroPlayed(true); }}
          />
        )}
      </AnimatePresence>

      {/* Card content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introPlayed || !isInView ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ visibility: introPlayed ? 'visible' : 'hidden' }}
      >
        <div className="flex items-start gap-4 mb-4">
          <tech.SVG size={48} />
          <div className="flex-1">
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{tech.name}</h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tech.desc}</p>
          </div>
        </div>

        {/* Skill bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Proficiência</span>
            <span style={{ color: tech.color, fontWeight: 700 }}>{tech.level}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${tech.color}, ${tech.color}88)`, boxShadow: `0 0 8px ${tech.color}66` }}
              initial={{ width: 0 }}
              animate={introPlayed ? { width: `${tech.level}%` } : {}}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Skills() {
  const headerRef = useRef(null);
  const isHeaderVisible = useInView(headerRef, { once: true });

  return (
    <section id="skills" className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-5"
        style={{ background: 'var(--primary)', filter: 'blur(80px)', transform: 'translate(-50%, -50%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-5"
        style={{ background: 'var(--secondary)', filter: 'blur(80px)', transform: 'translate(50%, 50%)' }} />

      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--primary)', border: '1px solid rgba(108,99,255,0.3)' }}>
            Stack Técnica
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            <span className="gradient-text">Habilidades</span> & Ferramentas
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Tecnologias que uso no dia a dia para criar experiências digitais inovadoras,
            desde apps mobile a sistemas web corporativos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {techs.map((tech, i) => (
            <TechCard key={tech.name} tech={tech} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
