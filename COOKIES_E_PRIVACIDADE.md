# Análise: Cookies e Política de Privacidade

## 📋 Resumo Executivo

**SIM, você precisa de uma Política de Privacidade** e **declarar o uso de localStorage**.

---

## 🔍 Análise do Seu Site

### Dados Encontrados

#### 1. **LocalStorage (Identificado)**
- **Localização**: `src/context/ThemeContext.tsx`
- **Dados armazenados**: Nenhum — o tema agora é fixo em `dark` (sem `localStorage`)
- **Chave**: N/A
- **Classificação**: Não há armazenamento persistente pelo site

#### 2. **Informações de Contato (Não sensível)**
- Links diretos para: Instagram, WhatsApp, E-mail, LinkedIn, GitHub
- Nenhum dado é coletado — são apenas links de saída

#### 3. **Utilitários (Processamento Local)**
- Compressor de PDF
- Conversor de Imagens  
- Remover Fundo (IA)
- **Importante**: Parecem processar dados localmente no navegador, mas **verifique** se a IA de "Remover Fundo" envia dados para servidor

#### 4. **Rastreamento: NÃO ENCONTRADO**
- ✅ Sem Google Analytics
- ✅ Sem Facebook Pixel
- ✅ Sem outras ferramentas de rastreamento externo

---

## ⚖️ Legislação Aplicável

### 🇧🇷 **LGPD - Lei Geral de Proteção de Dados (Brasil)**
**APLICA-SE** — Seu site tem:
- Email e telefone do Brasil (Acre, +55 68)
- Público em português
- Armazenamento de dados (localStorage)

**Obrigações principais:**
- ✅ Avisar claramente sobre uso de localStorage
- ✅ Respeitar consentimento implícito (ou explícito para funcionalidades não essenciais)
- ✅ Direitos do titular: acesso, correção, exclusão dos dados

### 🇪🇺 **GDPR - General Data Protection Regulation (Europa)**
**PODE APLICAR-SE** se:
- Você tiver visitantes de EU
- O site for acessível a cidadãos da UE

**Obrigações principais:**
- ✅ Banner de cookies **obrigatório**
- ✅ Consentimento **explícito** antes de qualquer armazenamento
- ✅ Cookie policy dedicada

### 🇺🇸 **CCPA - California Consumer Privacy Act (EUA)**
**PODE APLICAR-SE** se:
- Você coletar dados de residentes da Califórnia

---

## 📝 O Que Você Precisa Criar

### 1. **Política de Privacidade** (OBRIGATÓRIO)

Deve conter:
- ✅ Quais dados são coletados (localStorage: preferência de tema)
- ✅ Como são usados
- ✅ Quanto tempo são mantidos
- ✅ Se há compartilhamento com terceiros
- ✅ Direitos dos usuários (LGPD: acesso, correção, exclusão)
- ✅ Informações de contato para privacidade
- ✅ Para GDPR: política de cookies detalhada

### 2. **Banner de Cookies** (RECOMENDADO)
Se você quer cumprir GDPR rigorosamente:
- Banner no footer ou topo
- "Este site usa localStorage para salvar sua preferência de tema"
- Botão de aceitar/rejeitar

### 3. **Aviso sobre Utilitários** (IMPORTANTE)
**ANTES de implementar qualquer coisa:**
- ✅ Verifique se o componente "Remover Fundo" (@imgly/background-removal) envia dados para servidor
- Se enviar: precisa declarar isso e obter consentimento
- Se local: apenas declare no aviso

---

## 🚀 Implementação Passo a Passo

### PASSO 1: Verificar Dependências Externas

```bash
# Verifique se @imgly/background-removal envia dados para servidor
# Acesse: https://www.imgly.io/privacy
# Procure por: data transmission, server, API calls
```

**Resultado esperado:**
- Se enviar dados → adicionar isso na Política de Privacidade
- Se local → apenas mencionar no aviso

---

### PASSO 2: Criar Arquivo `POLITICA_PRIVACIDADE.md`

Crie na raiz: `POLITICA_PRIVACIDADE.md`

**Conteúdo básico para seu site:**

```markdown
# Política de Privacidade

## 1. Dados Coletados

### LocalStorage
- **Preferência de Tema**: Armazenamos sua preferência de tema (claro/escuro)
- **Duração**: Até que você limpe o cache do navegador
- **Uso**: Melhorar sua experiência ao revisitar o site

### Informações de Contato
- Fornecidos voluntariamente pelo usuário ao clicar em links
- E-mail, WhatsApp, Instagram, etc.

## 2. Segurança
- Não compartilhamos dados com terceiros
- Não usamos analytics externo
- Seus dados (localStorage) ficam apenas no seu navegador

## 3. Seus Direitos (LGPD)
Você tem direito a:
- Acessar seus dados
- Corrigir dados incorretos
- Solicitar exclusão (limpar cache do navegador)
- Cópia portável

## 4. Contato para Privacidade
📧 geansnswatch@gmail.com
📱 +55 (68) 98110-8001

## 5. Últimas Alterações
Versão: 1.0
Data: [DATA ATUAL]
```

---

### PASSO 3: Criar Componente de Banner (OPCIONAL - para GDPR)

Se quiser cumprir GDPR: crie componente `CookieBanner.tsx`

```tsx
import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    setAccepted(consent === 'accepted');
  }, []);

  if (accepted) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0,0,0,0.9)',
      padding: '1rem',
      textAlign: 'center',
      zIndex: 9999,
      borderTop: '1px solid rgba(108,99,255,0.3)',
    }}>
      <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
        Este site usa localStorage para salvar sua preferência de tema.
        <a href="/POLITICA_PRIVACIDADE.md" style={{ color: '#6c63ff', marginLeft: '0.5rem' }}>
          Leia nossa Política de Privacidade
        </a>
      </p>
      <button
        onClick={() => {
          localStorage.setItem('cookieConsent', 'accepted');
          setAccepted(true);
        }}
        style={{
          background: '#6c63ff',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Entendi
      </button>
    </div>
  );
}
```

**Adicione ao `App.tsx`:**
```tsx
import CookieBanner from './components/CookieBanner';

// Dentro do return:
<CookieBanner />
```

---

### PASSO 4: Criar Página `/privacidade` (OPCIONAL)

Crie componente `PrivacyPolicy.tsx` em `src/pages/` para página dedicada.

---

## 📊 Checklist de Conformidade

### LGPD (Brasil) ✓
- [ ] Política de Privacidade criada
- [ ] Explica coleta de localStorage
- [ ] Fornece direitos do usuário
- [ ] Email de contato para privacidade
- [ ] Identifica controlador de dados (seu nome/email)

### GDPR (Europa - Se aplicável) ✓
- [ ] Banner de consentimento
- [ ] Cookie Policy
- [ ] Opção de rejeitar (não apenas aceitar)
- [ ] Fácil acesso à política

### CCPA (Califórnia - Se aplicável) ✓
- [ ] Aviso de privacidade
- [ ] Direitos do consumidor
- [ ] Método para exercer direitos

---

## ⚠️ Pontos Críticos

### 1. Verifique `@imgly/background-removal`
```bash
npm info @imgly/background-removal
# Procure por: "data handling", "privacy"
```

Se usar API externa:
```markdown
## Serviços de Terceiros
- **Remove Background (imgly)**: Processa imagens em servidor externo
  - Privacidade: [link da privacidade do imgly]
  - Você é responsável por informar ao usuário
```

### 2. localStorage vs Cookies
- **localStorage**: Persistente, não enviado automaticamente ao servidor
- **Cookies**: Podem ser HTTP-only, enviados em cada requisição

Seu site usa localStorage ✓ (melhor para privacidade)

### 3. Dados de Terceiros
Verifique se há:
- [ ] Google Fonts (não coleta dados, apenas serve fontes)
- [ ] Qualquer CDN externo
- [ ] APIs de geolocalização
- [ ] Fingerprinting

Seu site: ✅ Google Fonts (OK - não coleta dados)

---

## 📋 Próximos Passos Recomendados

1. **Imediato**: Criar arquivo `POLITICA_PRIVACIDADE.md`
2. **Recomendado**: Adicionar link na página (Footer)
3. **GDPR**: Se tiver visitantes EU → adicionar CookieBanner
4. **Verificação**: Confirmar se @imgly envia dados para servidor

---

## 🔗 Referências Úteis

- **LGPD**: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd
- **GDPR**: https://gdpr-info.eu/
- **CCPA**: https://oag.ca.gov/privacy/ccpa
- **Cookie Policy Generator**: https://www.termly.io/products/cookie-policy-generator/

---

## 📞 Dúvidas Frequentes

**P: Preciso de banner se uso apenas localStorage?**
R: LGPD = não obrigatório (melhor prática)
   GDPR = sim, obrigatório banner

**P: Usuário pode rejeitar o tema escuro/claro?**
R: Sim! Adicione opção de não salvar a preferência (usar padrão do browser)

**P: Quanto tempo manter localStorage?**
R: Indefinidamente (usuário controla, pode limpar cache)

**P: Preciso de consentimento por cookie?**
R: localStorage não é cookie técnicamente, mas boas práticas = sim

---

✅ **Status**: Seu site é relativamente simples e seguro em termos de privacidade.
Maior risco: se @imgly enviar dados para servidor.

Próximo passo: Execute o checklist acima e implemente a Política de Privacidade! 🚀
