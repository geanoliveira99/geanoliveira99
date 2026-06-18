import { Github, Instagram, MessageCircle, Mail, Linkedin } from 'lucide-react';

const socials = [
  { icon: Linkedin,      href: 'https://www.linkedin.com/in/geanoliveira99/', label: 'LinkedIn'  },
  { icon: Github,        href: 'https://github.com/geanoliveira99',           label: 'GitHub'    },
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

const legalLinks = [
  { label: 'Privacidade',   href: 'https://github.com/geanoliveira99/politicas/blob/main/POLITICA_DE_PRIVACIDADE.md' },
  { label: 'Cookies',       href: 'https://github.com/geanoliveira99/politicas/blob/main/POLITICA_DE_COOKIES.md' },
  { label: 'Termos de Uso', href: 'https://github.com/geanoliveira99/politicas/blob/main/TERMOS_DE_USO.md' },
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
        padding: '3rem 2rem 2rem',
      }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        {/* Top row: brand + nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <p className="font-black text-sm gradient-text">Gean Oliveira</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Dev React &amp; Mobile</p>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem 1.25rem' }}>
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

        {/* Legal links */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            {legalLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs transition-colors duration-200"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.5rem' }} />

        {/* Bottom row: socials + copyright */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Social icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label={label}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(108,99,255,0.12)',
                  border: '1px solid rgba(108,99,255,0.2)',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
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
