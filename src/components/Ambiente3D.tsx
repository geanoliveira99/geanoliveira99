import { Suspense, useRef, useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { motion } from 'framer-motion';

type Vector3Tuple = [number, number, number];

type ModelConfig = {
  id: string;
  path: string;
  cameraPosition: Vector3Tuple;
  fov: number;
  minDistance: number;
  maxDistance: number;
  scale?: Vector3Tuple;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
};

const MODELS: ModelConfig[] = [
  {
    id: 'onibus-espacial-nasa',
    path: '/modelos3D/ONIBUS ESPACIAL NASA.glb',
    cameraPosition: [0, 0.5, 5],
    fov: 40,
    minDistance: 2,
    maxDistance: 12,
  },
  {
    id: 'gean-fullstack',
    path: '/modelos3D/geanoliveira99-fullstack.glb',
    cameraPosition: [0, 0.6, 6],
    fov: 38,
    minDistance: 2,
    maxDistance: 14,
  },
];

const ModelViewport = memo(function ModelViewport({ model, delay = 0 }: {
  model: ModelConfig;
  delay?: number;
}) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: '-60px', threshold: 0.05 },
    );

    obs.observe(el);
    return () => {
      obs.disconnect();
    };
  }, []);

  return (
    <motion.div
      ref={viewerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.7, delay }}
      style={{
        position: 'relative',
        width: '100%', maxWidth: 700,
        height: 'clamp(400px, 65vw, 600px)',
        margin: '0 auto 40px',
        borderRadius: 24, overflow: 'hidden',
        border: '1px solid rgba(108,99,255,0.25)',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(108,99,255,0.12) 0%, #080812 70%)',
        boxShadow: '0 0 60px rgba(108,99,255,0.15), 0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Placeholder visual leve: apenas um gradiente bonito e ícone.
          O modelo GLTF só será carregado quando o usuário clicar em "Abrir". */}
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(108,99,255,0.2) 0%, rgba(8,8,18,0.8) 80%)',
      }}>
        <div style={{ fontSize: 64, opacity: 0.7 }}>🎬</div>
        <div style={{ color: 'rgba(167,139,250,0.6)', fontSize: 14, fontWeight: 500 }}>
          Clique em "Abrir" para visualizar em 3D
        </div>
      </div>

      {/* Botão para abrir modal de visualização em alta qualidade */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 12 }}>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}
        >Abrir</button>
      </div>

      {modalOpen && createPortal(
        <ModalViewer model={model} onClose={() => setModalOpen(false)} />,
        document.body
      )}
    </motion.div>
  );
});

function ModelLoader({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  return (
    <Bounds fit clip margin={1.2}>
      <Center>
        <primitive object={scene} dispose={null} />
      </Center>
    </Bounds>
  );
}

function ModalViewer({ model, onClose }: { model: ModelConfig; onClose: () => void }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  
  useEffect(() => {
    // Prevenir scroll quando modal está aberta
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '90vw', height: '88vh', maxWidth: 1200, maxHeight: 800, borderRadius: 12, overflow: 'hidden', background: 'black', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>✕ Fechar</button>
        <Canvas camera={{ position: model.cameraPosition, fov: model.fov }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 10, 5]} intensity={1.6} />
          <directionalLight position={[-4, 4, -3]} intensity={0.6} color="#a78bfa" />
          <pointLight position={[0, 8, 2]} intensity={1.0} color="#00d9ff" distance={20} />
          <hemisphereLight args={['#1a1040', '#080812', 0.5]} />
          <Suspense fallback={null}>
            <ModelLoader path={model.path} />
          </Suspense>
          <OrbitControls ref={controlsRef} enablePan enableRotate enableZoom enableDamping dampingFactor={0.08} autoRotate={false} />
        </Canvas>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: '🎨', title: 'Colorido & Realista', desc: 'Materiais PBR com texturas e reflexos' },
  { icon: '🖱️', title: 'Totalmente Interativo', desc: 'Gira, dá zoom e explora em 360°' },
  { icon: '📱', title: 'Mobile First', desc: 'Funciona perfeitamente no celular' },
  { icon: '⚡', title: 'Leve & Rápido', desc: 'Otimizado para web com WebGL' },
] as const;

const FeatureCards = memo(function FeatureCards({ inView }: { inView: boolean }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16, maxWidth: 700, margin: '0 auto 40px',
    }}>
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(108,99,255,0.2)',
            borderRadius: 14, padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}
        >
          <span style={{ fontSize: 24 }}>{f.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{f.title}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</span>
        </motion.div>
      ))}
    </div>
  );
});

export default function Ambiente3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: '-60px', threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ambiente3d"
      style={{ padding: '80px 0 60px', background: 'var(--bg)', overflow: 'hidden' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

        {/* ── Título ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 18px', borderRadius: 999,
            background: 'rgba(108,99,255,0.12)',
            border: '1px solid rgba(108,99,255,0.3)', marginBottom: 16,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="7,1 9,5.5 14,6.2 10.5,9.6 11.4,14 7,11.5 2.6,14 3.5,9.6 0,6.2 5,5.5" fill="#a78bfa" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 1 }}>NOVO SERVIÇO</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 16,
            background: 'linear-gradient(135deg, #6c63ff 0%, #00d9ff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Ambiente 3D
          </h2>

          <p style={{
            fontSize: 'clamp(14px, 2vw, 16px)', color: 'var(--text-muted)',
            maxWidth: 600, margin: '0 auto', lineHeight: 1.8,
          }}>
            Integro <strong style={{ color: '#a78bfa' }}>modelos 3D interativos</strong> diretamente no seu site ou app.
            Você fornece o modelo pronto (
            <code style={{ background: 'rgba(108,99,255,0.15)', color: '#00d9ff', padding: '1px 6px', borderRadius: 4, fontSize: 13 }}>.glb</code>
            {' '}ou{' '}
            <code style={{ background: 'rgba(108,99,255,0.15)', color: '#00d9ff', padding: '1px 6px', borderRadius: 4, fontSize: 13 }}>.gltf</code>
            ) e eu cuido de toda a implementação.
          </p>
        </motion.div>

        {/* ── Viewers 3D ── */}
        {MODELS.map((model, index) => (
          <ModelViewport key={model.id} model={model} delay={0.2 + index * 0.08} />
        ))}

        {/* ── Cards de features ── */}
        <FeatureCards inView={inView} />
      </div>
    </section>
  );
}
