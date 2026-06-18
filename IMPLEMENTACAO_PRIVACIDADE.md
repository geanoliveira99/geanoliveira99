# Guia de Implementação: Como Integrar Cookies e Privacidade no Código

---

## 📋 Checklist Rápido

- [ ] Arquivo `POLITICA_DE_PRIVACIDADE.md` criado ✅
- [ ] Arquivo `COOKIES_E_PRIVACIDADE.md` criado (documentação) ✅
- [ ] Adicionar link "Privacidade" no Footer
- [ ] (OPCIONAL) Criar página `/privacidade` dedicada
- [ ] (OPCIONAL) Adicionar CookieBanner para GDPR
- [ ] (RECOMENDADO) Adicionar aviso nos utilitários

---

## 1️⃣ Adicionar Link no Footer

**Local**: `src/components/Footer.tsx`

Procure por `navItems` e adicione:

```tsx
const navItems = [
  { label: 'Início',      href: '#hero'       },
  { label: 'Habilidades', href: '#skills'     },
  { label: 'Experiência', href: '#experience' },
  { label: 'Projetos',    href: '#projects'   },
  { label: 'Contato',     href: '#contact'    },
  // ⬇️ ADICIONAR ESTAS LINHAS:
  { label: 'Privacidade', href: '/privacidade' },
];
```

---

## 2️⃣ Criar Página de Privacidade (RECOMENDADO)

### Opção A: Sem React Router (Mais simples para seu projeto)

**Arquivo**: `src/pages/PrivacyPolicy.tsx`

```tsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function PrivacyPolicy() {
  const topRef = useRef(null);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sections = [
    { id: 'intro', title: '1. Introdução' },
    { id: 'dados', title: '2. Informações que Coletamos' },
    { id: 'uso', title: '3. Como Usamos' },
    { id: 'direitos', title: '4. Seus Direitos' },
    { id: 'contato', title: '5. Contato' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Política de Privacidade
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '2rem', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Conteúdo Principal */}
        <motion.div
          ref={topRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '1.05rem',
            lineHeight: '1.8',
          }}
        >
          {/* Seção Introdução */}
          <section id="intro" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              1. Introdução
            </h2>
            <p>
              Esta Política de Privacidade explica como o site de Gean Oliveira coleta, usa e protege informações sobre você.
            </p>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              <strong>Controlador de Dados:</strong> Gean Oliveira<br/>
              <strong>Email:</strong> <a href="mailto:geansnswatch@gmail.com" style={{ color: 'var(--primary)' }}>geansnswatch@gmail.com</a><br/>
              <strong>Telefone:</strong> +55 (68) 98110-8001
            </p>
          </section>

          {/* Seção Dados */}
          <section id="dados" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              2. Informações que Coletamos
            </h2>
            
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              2.1 Dados Armazenados Localmente
            </h3>
            <p>
              Armazenamos <strong>localmente no seu navegador</strong>:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Preferência de tema (modo escuro/claro)</li>
              <li>Nenhum dado pessoal é transmitido para servidor</li>
            </ul>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              2.2 Dados Fornecidos Voluntariamente
            </h3>
            <p>
              Você pode entrar em contato conosco através de links para:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Email</li>
              <li>WhatsApp</li>
              <li>Instagram / LinkedIn / GitHub</li>
            </ul>
          </section>

          {/* Seção Uso */}
          <section id="uso" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              3. Como Usamos Essas Informações
            </h2>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '1rem',
              border: '1px solid var(--border)',
            }}>
              <thead>
                <tr style={{ background: 'var(--bg2)' }}>
                  <th style={{ padding: '1rem', border: '1px solid var(--border)', textAlign: 'left' }}>Dado</th>
                  <th style={{ padding: '1rem', border: '1px solid var(--border)', textAlign: 'left' }}>Uso</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '1rem', border: '1px solid var(--border)' }}>Preferência de Tema</td>
                  <td style={{ padding: '1rem', border: '1px solid var(--border)' }}>Melhorar sua experiência</td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem', border: '1px solid var(--border)' }}>Dados de Contato</td>
                  <td style={{ padding: '1rem', border: '1px solid var(--border)' }}>Responder suas mensagens</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Seção Direitos */}
          <section id="direitos" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              4. Seus Direitos (LGPD)
            </h2>
            <p>
              Conforme a Lei Geral de Proteção de Dados Pessoais (LGPD), você tem direito a:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
              <li><strong>Direito de Acesso:</strong> Solicitar dados sobre você</li>
              <li><strong>Direito de Correção:</strong> Corrigir dados incorretos</li>
              <li><strong>Direito ao Esquecimento:</strong> Solicitar exclusão</li>
              <li><strong>Direito à Portabilidade:</strong> Receber dados em formato aberto</li>
            </ul>
            <p style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(108,99,255,0.1)', borderLeft: '4px solid var(--primary)', borderRadius: '4px' }}>
              Para exercer seus direitos, envie um email para <strong>geansnswatch@gmail.com</strong> com o título "Solicitação de Direitos LGPD".
            </p>
          </section>

          {/* Seção Contato */}
          <section id="contato" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              5. Contato
            </h2>
            <p>Para dúvidas sobre privacidade:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
              <li>📧 <a href="mailto:geansnswatch@gmail.com" style={{ color: 'var(--primary)' }}>geansnswatch@gmail.com</a></li>
              <li>📱 <a href="https://wa.me/5568981108001" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>WhatsApp</a></li>
            </ul>
          </section>
        </motion.div>

        {/* Sidebar: Índice */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            position: 'sticky',
            top: '2rem',
            height: 'fit-content',
            background: 'var(--bg2)',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Índice
          </h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(108,99,255,0.1)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </motion.div>
      </div>

      {/* Botão voltar ao topo */}
      <motion.button
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--primary)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronUp size={20} color="white" />
      </motion.button>
    </div>
  );
}
```

### Opção B: Usar arquivo .md diretamente

Se não quer criar componente React, coloque o arquivo `POLITICA_DE_PRIVACIDADE.md` em `public/` e faça link direto:

```tsx
// No Footer.tsx
{ label: 'Privacidade', href: '/POLITICA_DE_PRIVACIDADE.md', target: '_blank' }
```

---

## 3️⃣ Adicionar CookieBanner (GDPR - OPCIONAL)

Se quer cumprir GDPR rigorosamente:

**Arquivo**: `src/components/CookieBanner.tsx`

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    setAccepted(consent === 'accepted');
    setLoading(false);
  }, []);

  if (loading || accepted) return null;

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setAccepted(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg2)',
          borderTop: '1px solid var(--border)',
          padding: '1.5rem 2rem',
          zIndex: 9998,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              <strong>Dados Locais</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Este site usa localStorage para salvar sua preferência de tema.{' '}
              <a href="/POLITICA_DE_PRIVACIDADE.md" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                Leia nossa Política de Privacidade
              </a>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setAccepted(true)}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Rejeitar
            </button>
            <motion.button
              onClick={handleAccept}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
              }}
            >
              Aceitar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Adicione no `App.tsx`**:

```tsx
import CookieBanner from './components/CookieBanner';

function App() {
  // ... resto do código
  return (
    <div>
      <Navbar />
      {/* resto */}
      <CookieBanner /> {/* ← ADICIONAR AQUI */}
    </div>
  );
}
```

---

## 4️⃣ Adicionar Aviso nos Utilitários (RECOMENDADO)

Se usar IA do @imgly (Background Removal), adicione aviso:

**Arquivo**: `src/components/ui/RemoveFundo.tsx` (procure por este arquivo)

```tsx
// No início do componente, adicione um aviso:

<motion.div
  style={{
    background: 'rgba(255,165,0,0.1)',
    border: '1px solid rgba(255,165,0,0.3)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  }}
>
  <p style={{ fontSize: '0.9rem', margin: 0 }}>
    ⚠️ <strong>Privacidade:</strong> As imagens são processadas em servidor externo (imgly AI).
    Leia nossa <a href="/POLITICA_DE_PRIVACIDADE.md" style={{ color: 'inherit', textDecoration: 'underline' }}>
      Política de Privacidade
    </a>
  </p>
</motion.div>
```

---

## 5️⃣ Atualizar App.tsx (Roteamento)

Se criar página PrivacyPolicy separada, adicione:

```tsx
import { lazy } from 'react';
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  // Página de privacidade
  if (path === '/privacidade' || path === '/privacidade/') {
    return (
      <Suspense fallback={<Loader />}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  // Resto do site
  return (
    <div>
      {/* seu código existente */}
    </div>
  );
}
```

---

## 📋 Passo a Passo Final

1. ✅ **Arquivo `POLITICA_DE_PRIVACIDADE.md`** na raiz ← Já criado
2. ✅ **Arquivo `COOKIES_E_PRIVACIDADE.md`** para documentação ← Já criado
3. ⬜ **Adicionar link "Privacidade" no Footer**
   - Edite `src/components/Footer.tsx`
   - Adicione `{ label: 'Privacidade', href: '/privacidade' }`

4. ⬜ (RECOMENDADO) **Criar página `/privacidade` dedicada**
   - Crie `src/pages/PrivacyPolicy.tsx`
   - Use código acima como template
   - Atualize `App.tsx` para rotear

5. ⬜ (OPCIONAL) **Adicionar CookieBanner para GDPR**
   - Crie `src/components/CookieBanner.tsx`
   - Adicione no `App.tsx`

6. ⬜ **Verificar @imgly**
   - Confirme se Background Removal envia dados para servidor
   - Se sim: adicione aviso no componente

---

## 🚀 Teste Rápido

Após implementar:

1. Abra site no navegador
2. Abra DevTools (F12)
3. Application → LocalStorage
4. Verifique se `theme` e `cookieConsent` aparecem

✅ Se aparecerem, está funcionando!

---

## 📞 Dúvidas?

- **Dúvida sobre LGPD**: Consulte https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd
- **Dúvida sobre GDPR**: Consulte https://gdpr-info.eu/
- **Dúvida técnica**: Revise este arquivo

---

✅ **Próximo passo**: Escolha qual implementação fazer (passo 3 é obrigatória).
