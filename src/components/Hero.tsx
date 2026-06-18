import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import AuroraShader from './ui/AuroraShader';
import GlobeComponent from './ui/Globe';

const roles = [
  'Desenvolvedor React',
  'Dev Mobile Android & iOS',
  'Node.js Developer',
  'Especialista em Apps Kotlin',
  'Capacitor / WebView Expert',
];

// Ângulos iniciais — 90° de distância entre cada label
const ORBIT_LABELS = [
  { label: 'React',   startDeg: 0   },
  { label: 'Node.js', startDeg: 90  },
  { label: 'Kotlin',  startDeg: 180 },
  { label: 'iOS',     startDeg: 270 },
];
const ORBIT_SPEED = 0.4; // graus por frame (~14s por volta a 60fps)

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const auroraColors = useMemo(() => ['#2a1060', '#003355', '#3a0030'] as [string, string, string], []);

  // Refs para os divs de cada label — animamos via DOM direto (sem re-render)
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const globeWrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const anglesRef = useRef(ORBIT_LABELS.map(l => l.startDeg));

  const animate = useCallback(() => {
    const wrapper = globeWrapperRef.current;
    if (!wrapper) { rafRef.current = requestAnimationFrame(animate); return; }
    const r = wrapper.offsetWidth / 2 + 16; // raio = metade do globo + 16px de margem
    const cx = 0; // já estamos centralizados via top/left 50%
    const cy = 0;

    ORBIT_LABELS.forEach((_, i) => {
      anglesRef.current[i] = (anglesRef.current[i] + ORBIT_SPEED) % 360;
      const rad = (anglesRef.current[i] * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      const el = labelRefs.current[i];
      if (el) {
        el.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
      }
    });

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const current = roles[roleIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (typing) {
      if (displayed.length < current.length) {
        timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60);
      } else {
        timeout = setTimeout(() => setTyping(false), 1800);
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
      } else {
        setRoleIndex((i) => (i + 1) % roles.length);
        setTyping(true);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, typing, roleIndex]);

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {!isMobile && (
          <AuroraShader colorStops={auroraColors} amplitude={0.45} blend={0.12} speed={0.35} />
        )}
        {isMobile && (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d0820 0%, #0a0a0f 40%, #001628 100%)' }} />
        )}
      </div>
      <div className="absolute inset-0 dot-grid opacity-20" style={{ zIndex: 1 }} />

      {/* Marquee */}
      <div
        className="relative w-full overflow-hidden flex-shrink-0"
        style={{ zIndex: 10, marginTop: '64px', height: 80, background: '#0a0a0f' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full h-full overflow-hidden"
        >
          <div className="hero-marquee-track">
            {[...Array(4)].map((_, i) => (
              <img
                key={i}
                src="/linguagensprogramacao.png"
                alt=""
                aria-hidden="true"
                style={{ height: '64px', width: 'auto', flexShrink: 0, display: 'block', userSelect: 'none', pointerEvents: 'none', marginRight: '32px' }}
              />
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-24" style={{ background: 'linear-gradient(to right, #0a0a0f, transparent)', pointerEvents: 'none' }} />
          <div className="absolute inset-y-0 right-0 w-24" style={{ background: 'linear-gradient(to left, #0a0a0f, transparent)', pointerEvents: 'none' }} />
          <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to bottom, transparent, rgba(10,10,15,0.95))', pointerEvents: 'none' }} />
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-8 pb-24 flex flex-col items-center gap-6">

        {/* Badge + título */}
        <div className="w-full text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-medium"
              style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--primary)', border: '1px solid rgba(108,99,255,0.3)' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Disponível para projetos
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl sm:text-3xl font-bold mb-4 h-10 flex items-center justify-center gap-1"
            style={{ color: 'var(--secondary)' }}
          >
            <span>{displayed}</span>
            <span className="inline-block w-0.5 h-7 bg-current" style={{ animation: 'blink 1s step-end infinite' }} />
          </motion.div>
        </div>

        {/* Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center"
          style={{ width: '100%' }}
        >
          <div
            ref={globeWrapperRef}
            style={{ position: 'relative', width: 'clamp(280px, 50vw, 480px)', height: 'clamp(280px, 50vw, 480px)', flexShrink: 0 }}
          >
            <div style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 60px rgba(108,99,255,0.5))' }}>
              <GlobeComponent
                className="w-full h-full"
                dark={1}
                baseColor="#6c63ff"
                markerColor="#00d9ff"
                glowColor="#5227FF"
                mapBrightness={4}
              />
            </div>

            {/* Labels — posicionados via rAF com trigonometria, sem CSS @keyframes */}
            {ORBIT_LABELS.map(({ label }, i) => (
              <div
                key={label}
                ref={el => { labelRefs.current[i] = el; }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  pointerEvents: 'none',
                  zIndex: 20,
                  willChange: 'transform',
                  whiteSpace: 'nowrap',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'rgba(22,22,30,0.82)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(108,99,255,0.45)',
                  boxShadow: '0 0 10px rgba(108,99,255,0.35)',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        onClick={() => document.querySelector('#skills')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="text-xs font-medium">Scroll</span>
        <div style={{ animation: 'scrollBounce 1.5s ease-in-out infinite' }}>
          <ChevronDown size={20} />
        </div>
      </motion.button>
    </section>
  );
}
