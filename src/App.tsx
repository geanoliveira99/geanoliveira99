import './index.css';
import { lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';

const DevLearn  = lazy(() => import('./pages/DevLearn'));
const Stats     = lazy(() => import('./components/Stats'));
const Skills    = lazy(() => import('./components/Skills'));
const Experience = lazy(() => import('./components/Experience'));
const Projects  = lazy(() => import('./components/Projects'));
const Contact   = lazy(() => import('./components/Contact'));
const Footer    = lazy(() => import('./components/Footer'));

const Loader = () => (
  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

function App() {
  // Roteamento simples sem react-router
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (path === '/develope' || path === '/develope/') {
    return (
      <Suspense fallback={<Loader />}>
        <DevLearn />
      </Suspense>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', overflowX: 'clip' }}>
      <Navbar />
      <main style={{ overflowX: 'clip' }}>
        <Hero />
        <Suspense fallback={<Loader />}>
          <Stats />
          <Skills />
          <Experience />
          <Projects />
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;

