import { Github, Instagram, MessageCircle, Mail } from 'lucide-react';

const socials = [
  { icon: Github,        href: 'https://github.com/geanoliveira99',          label: 'GitHub'    },
  { icon: Instagram,     href: 'https://www.instagram.com/geanoliveira99/',   label: 'Instagram' },
  { icon: MessageCircle, href: 'https://wa.me/5568981108001',                 label: 'WhatsApp'  },
  { icon: Mail,          href: 'mailto:geansnswatch@gmail.com',               label: 'E-mail'    },
];

const navItems = [
  { label: 'Início',      href: '#hero'       },
  { label: 'Habilidades', href: '#skills'     },
  { label: 'Experiência', href: '#experience' },
  { label: 'Projetos',    href: '#projects'   },
  { label: 'Contato',     href: '#contact'    },
];

export default function Footer() {
  const handleNav = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg2)',
        padding: '3rem 1rem 2rem',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top row: brand + nav */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              <span className="text-white font-black text-sm">GO</span>
            </div>
            <div>
              <p className="font-black text-sm gradient-text">Gean Oliveira</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Dev React &amp; Mobile</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className="text-sm transition-colors duration-200 hover:text-[var(--primary)]"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.5rem' }} />

        {/* Bottom row: socials + copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social icons */}
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: 'rgba(108,99,255,0.12)',
                  border: '1px solid rgba(108,99,255,0.2)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <Icon size={14} />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Feito com{' '}
            <span className="gradient-text font-semibold">React + TypeScript</span>
            {' '}· © {new Date().getFullYear()} Gean Oliveira
          </p>
        </div>
      </div>
    </footer>
  );
}

