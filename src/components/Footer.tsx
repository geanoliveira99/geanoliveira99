export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem 1rem' }}>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <span className="gradient-text font-semibold">React + TypeScript</span>
        {' '}© 2026 Gean Oliveira
      </p>
    </footer>
  );
}
