import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Instagram, MessageCircle, Mail, MapPin, ExternalLink } from 'lucide-react';

const contactItems = [
  {
    icon: Instagram,
    label: 'Instagram',
    value: '@geanoliveira99',
    href: 'https://www.instagram.com/geanoliveira99/',
    color: '#E1306C',
    gradient: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)',
    description: 'Me siga para ver projetos e novidades',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+55 (68) 98110-8001',
    href: 'https://wa.me/5568981108001',
    color: '#25D366',
    gradient: 'linear-gradient(135deg, #128C7E, #25D366)',
    description: 'Disponível para conversas sobre projetos',
  },
  {
    icon: Mail,
    label: 'E-mail',
    value: 'geansnswatch@gmail.com',
    href: 'mailto:geansnswatch@gmail.com',
    color: '#EA4335',
    gradient: 'linear-gradient(135deg, #4285F4, #EA4335)',
    description: 'Para propostas e colaborações formais',
  },
];

// SVG icons for contact
const InstagramSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
    <defs>
      <linearGradient id="igGrad" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#igGrad)" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="url(#igGrad)" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="url(#igGrad)" />
  </svg>
);

const WhatsAppSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
    <circle cx="12" cy="12" r="10" fill="#25D366" />
    <path fill="white" d="M12 6.5a5.5 5.5 0 00-5.5 5.5c0 1.3.44 2.49 1.18 3.44L6.5 17.5l2.14-1.14A5.5 5.5 0 1012 6.5zm2.69 7.97c-.18.5-.88.89-1.4.97-.37.07-.84.03-1.28-.13-.23-.09-.53-.21-.91-.38-1.6-.68-2.65-2.26-2.73-2.37-.08-.1-.64-.84-.64-1.61s.4-1.14.55-1.3c.14-.15.3-.19.41-.19h.29c.09 0 .22-.04.34.26l.46 1.1c.04.09.06.2.01.29-.05.1-.07.16-.15.24l-.22.25c-.08.08-.17.17-.07.33.1.16.44.7.95 1.13.65.57 1.2.75 1.37.83.17.08.27.07.37-.04l.25-.3c.1-.13.2-.1.34-.06l1.08.48c.16.08.27.12.31.2.04.1.04.55-.14 1.05z"/>
  </svg>
);

const EmailSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
    <defs>
      <linearGradient id="emailGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="100%" stopColor="#EA4335" />
      </linearGradient>
    </defs>
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="url(#emailGrad)" strokeWidth="2" />
    <path d="M2 7l10 7 10-7" stroke="url(#emailGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const iconMap = {
  Instagram: InstagramSVG,
  WhatsApp: WhatsAppSVG,
  'E-mail': EmailSVG,
};

export default function Contact() {
  const headerRef = useRef(null);
  const isHeaderVisible = useInView(headerRef, { once: true });

  return (
    <section id="contact" className="py-24 px-4 relative overflow-hidden">
      {/* Aurora-like background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.12) 0%, transparent 60%)' }} />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'rgba(255,107,107,0.12)', color: 'var(--accent)', border: '1px solid rgba(255,107,107,0.3)' }}>
            Vamos Conversar
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            Entre em <span className="gradient-text">Contato</span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Estou disponível para projetos freelance, consultoria e parcerias. Entre em contato pelo canal que preferir!
          </p>

          <div className="flex items-center justify-center gap-2 mt-4" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={14} />
            <span className="text-sm">Acre, Brasil 🇧🇷</span>
          </div>
        </motion.div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {contactItems.map((item, i) => {
            const SVGIcon = iconMap[item.label as keyof typeof iconMap];
            return (
              <motion.a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                whileHover={{ y: -10, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl group transition-all duration-300 relative overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {/* Hover bg */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `${item.color}0a` }} />

                {/* Icon with animated ring */}
                <div className="relative mb-4">
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: item.gradient }}
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <SVGIcon />
                  </motion.div>
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: `2px solid ${item.color}` }}
                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>

                <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text)' }}>{item.label}</h3>
                <p className="text-sm font-medium mb-2 gradient-text">{item.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.description}</p>

                <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: item.color }}>
                  <ExternalLink size={12} />
                  <span>Abrir</span>
                </div>
              </motion.a>
            );
          })}
        </div>

      </div>
    </section>
  );
}
