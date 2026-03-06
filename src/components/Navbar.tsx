import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Instagram, MessageCircle, Mail, X, Github } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import MiniGame from './ui/MiniGame';

// SVGs animados por seção
function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="var(--secondary)" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke="var(--secondary)" strokeWidth="1.5" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="var(--secondary)" strokeWidth="1.5" />
      <line x1="3" y1="8" x2="21" y2="8" stroke="var(--secondary)" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="3" y1="16" x2="21" y2="16" stroke="var(--secondary)" strokeWidth="1" strokeDasharray="3 2" />
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="6s" repeatCount="indefinite" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="var(--primary)" stroke="var(--primary)" strokeWidth="0.5">
        <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="scale" values="1 1;1.08 1.08;1 1" additive="sum" dur="0.8s" repeatCount="indefinite" />
      </polygon>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="var(--accent)" opacity="0.35">
        <animate attributeName="opacity" values="0.35;0.7;0.35" dur="0.8s" repeatCount="indefinite" />
      </polygon>
    </svg>
  );
}

function IconRocket() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 16 6 16 12C16 14.5 14.5 16 12 17C9.5 16 8 14.5 8 12C8 6 12 2 12 2Z" fill="var(--primary)" stroke="var(--primary)" strokeWidth="0.5" />
      <path d="M8 12 L5 16 L8 15 Z" fill="var(--accent)" />
      <path d="M16 12 L19 16 L16 15 Z" fill="var(--accent)" />
      <circle cx="12" cy="11" r="1.8" fill="var(--secondary)" opacity="0.9" />
      <g>
        <path d="M11 17 L10.5 21 L12 19.5 L13.5 21 L13 17" fill="var(--accent)">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.4s" repeatCount="indefinite" />
        </path>
      </g>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.5;0 0" dur="1.2s" repeatCount="indefinite" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="16" rx="2" stroke="var(--secondary)" strokeWidth="1.5" />
      <line x1="2" y1="7" x2="22" y2="7" stroke="var(--secondary)" strokeWidth="1.5" />
      <circle cx="5" cy="5" r="0.8" fill="var(--accent)" />
      <circle cx="8" cy="5" r="0.8" fill="var(--primary)" />
      <circle cx="11" cy="5" r="0.8" fill="var(--secondary)" />
      <path d="M7 12 L5 14 L7 16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />
      </path>
      <path d="M17 12 L19 14 L17 16" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
      </path>
      <line x1="10" y1="16" x2="14" y2="12" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" begin="0.4s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

const navLinks = [
  { label: 'Início',      href: '#hero',       Icon: IconGlobe  },
  { label: 'Habilidades', href: '#skills',      Icon: IconBolt   },
  { label: 'Experiência', href: '#experience',  Icon: IconRocket },
  { label: 'Projetos',    href: '#projects',    Icon: IconCode   },
];

// Orbital dots menu button
function OrbitMenuButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label="Menu"
      className="relative w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden"
      style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.35)' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.88 }}
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div key="orbit" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 0.18 }} className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-1.5 h-1.5 rounded-full" style={{ background: 'var(--secondary)', boxShadow: '0 0 6px var(--secondary)' }} />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} className="absolute w-8 h-8" style={{ willChange: 'transform' }}>
              {[{ deg: 0, color: 'var(--primary)' }, { deg: 120, color: 'var(--secondary)' }, { deg: 240, color: 'var(--accent)' }].map(({ deg, color }) => (
                <div key={deg} className="absolute w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}`, top: '50%', left: '50%', marginTop: '-4px', marginLeft: '-4px', transform: `rotate(${deg}deg) translateY(-13px)` }} />
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="close" initial={{ opacity: 0, rotate: -90, scale: 0.4 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.4 }} transition={{ duration: 0.18 }}>
            <X size={18} style={{ color: 'var(--accent)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLink = (href: string) => {
    setIsOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'shadow-lg shadow-black/40'
            : ''
        }`}
        style={{
          background: scrolled
            ? 'rgba(10, 10, 20, 0.92)'
            : 'rgba(10, 10, 20, 0.75)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          borderBottom: '1px solid rgba(108,99,255,0.25)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleLink('#hero')}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center neon-border"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
              >
                <span className="text-white font-black text-sm">GO</span>
              </div>
              {/* Liquid glass name — always visible */}
              <span
                className="font-black text-base tracking-tight"
                style={{
                  background: 'rgba(108,99,255,0.18)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  border: '1px solid rgba(108,99,255,0.45)',
                  borderRadius: '12px',
                  padding: '4px 12px',
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  textShadow: '0 0 12px rgba(108,99,255,0.7)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 12px rgba(108,99,255,0.25)',
                }}
              >
                Gean Oliveira
              </span>
            </motion.div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <motion.button
                  key={link.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLink(link.href)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:text-[var(--primary)]"
                  style={{ color: '#e2e8f0' }}
                >
                  <link.Icon />
                  {link.label}
                </motion.button>
              ))}
            </nav>

            {/* Contact icons + theme toggle */}
            <div className="flex items-center gap-2">
              {/* Quick contact */}
              <div className="flex items-center gap-1">
                <motion.a
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  href="https://github.com/geanoliveira99"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--primary)' }}
                  title="GitHub"
                >
                  <Github size={15} />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  href="https://www.instagram.com/geanoliveira99/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--primary)' }}
                  title="Instagram"
                >
                  <Instagram size={15} />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.15, rotate: -5 }}
                  href="https://wa.me/5568981108001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{ background: 'rgba(0,217,255,0.12)', color: 'var(--secondary)' }}
                  title="WhatsApp"
                >
                  <MessageCircle size={15} />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  href="mailto:geansnswatch@gmail.com"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{ background: 'rgba(255,107,107,0.12)', color: 'var(--accent)' }}
                  title="Email"
                >
                  <Mail size={15} />
                </motion.a>
              </div>

              {/* Theme toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', border: 'none' }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </motion.button>

              {/* Hamburger */}
              <OrbitMenuButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen && <MiniGame onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
