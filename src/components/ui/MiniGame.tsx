import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Play, RotateCcw, LogIn } from 'lucide-react';

// ── Título animado com scan line verde ───────────────────────────
function ScanLine({ delay = 0, duration = 2.4 }: { delay?: number; duration?: number }) {
  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '600%' }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: 2.5, ease: 'linear' }}
      style={{
        position: 'absolute',
        top: '10%', bottom: '10%',
        left: 0,
        width: 2,
        borderRadius: 1,
        background: '#00ff50',
        boxShadow: '0 0 4px 2px #00ff50, 0 0 12px 4px rgba(0,255,80,0.6), 0 0 24px 6px rgba(0,255,80,0.25)',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}

function GameTitle({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const isLg = size === 'lg';
  return (
    <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
      {/* Linha 1: GTASADREAMER */}
      <div style={{
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
        fontFamily: 'monospace',
        fontSize: isLg ? 23 : 18,
        fontWeight: 900,
        letterSpacing: isLg ? 5 : 4,
        color: '#00cfff',
        textShadow: '0 0 10px #00cfff, 0 0 24px rgba(0,207,255,0.35)',
        paddingBottom: 2,
      }}>
        GTASADREAMER
        <ScanLine delay={0.2} duration={2.0} />
      </div>

      {/* Linha 2: SPACE */}
      <div style={{
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
        fontFamily: 'monospace',
        fontSize: isLg ? 13 : 10,
        fontWeight: 700,
        letterSpacing: isLg ? 16 : 12,
        color: '#7c6fff',
        textShadow: '0 0 10px #7c6fff, 0 0 22px rgba(124,111,255,0.35)',
        paddingLeft: isLg ? 6 : 4,
        marginTop: 1,
      }}>
        SPACE
        <ScanLine delay={1.4} duration={1.6} />
      </div>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────
interface Obstacle {
  id: number;
  x: number;       // % horizontal
  y: number;       // px from top
  width: number;
  height: number;
  type: 'meteor' | 'cloud';
  rotation: number;
}
interface Particle {
  id: number; x: number; y: number;
  vx: number; vy: number; life: number;
  color: string; size: number;
}
interface Explosion { id: number; x: number; y: number; }
interface ScoreEntry { name: string; score: number; date: string; }

// ── Constantes ───────────────────────────────────────────────────
const GAME_WIDTH  = 320;
const GAME_HEIGHT = 520;
const PLANE_W = 52;
const PLANE_H = 52;
const PLANE_Y = GAME_HEIGHT - 110;
const HS_KEY  = 'skyDodgeHS';
const TB_KEY  = 'skyDodgeTable';
const NM_KEY  = 'skyDodgeName';
const MAX_TABLE = 10;


let oid = 0, pid = 0, eid = 0;

// ── Helpers localStorage ─────────────────────────────────────────
function loadTable(): ScoreEntry[] {
  try { return JSON.parse(localStorage.getItem(TB_KEY) || '[]'); } catch { return []; }
}
function saveTable(t: ScoreEntry[]) {
  localStorage.setItem(TB_KEY, JSON.stringify(t.slice(0, MAX_TABLE)));
}
function insertScore(name: string, score: number) {
  const t = loadTable();
  t.push({ name, score, date: new Date().toLocaleDateString('pt-BR') });
  t.sort((a, b) => b.score - a.score);
  saveTable(t);
}

// ── Hook de áudio ─────────────────────────────────────────────────
function useAudio(src: string, loop = false) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio(src);
    a.loop = loop;
    a.volume = loop ? 0.35 : 0.7;
    ref.current = a;
    return () => { a.pause(); a.src = ''; };
  }, [src, loop]);
  const play  = useCallback(() => {
    if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); }
  }, []);
  const stop  = useCallback(() => {
    if (ref.current) { ref.current.pause(); ref.current.currentTime = 0; }
  }, []);
  const pause = useCallback(() => { ref.current?.pause(); }, []);
  return { play, stop, pause };
}

// ── Componente principal ─────────────────────────────────────────
type Screen = 'register' | 'idle' | 'playing' | 'dead' | 'table';

export default function MiniGame({ onClose }: { onClose: () => void }) {
  const savedName = localStorage.getItem(NM_KEY) || '';
  const [screen,      setScreen]     = useState<Screen>(savedName ? 'idle' : 'register');
  const [playerName,  setPlayerName] = useState(savedName);
  const [nameInput,   setNameInput]  = useState(savedName);
  const [nameError,   setNameError]  = useState('');

  const [score,       setScore]      = useState(0);
  const [highScore,   setHighScore]  = useState(() => Number(localStorage.getItem(HS_KEY) || 0));
  const [planeX,      setPlaneX]     = useState(GAME_WIDTH / 2 - PLANE_W / 2);
  const [obstacles,   setObstacles]  = useState<Obstacle[]>([]);
  const [particles,   setParticles]  = useState<Particle[]>([]);
  const [explosions,  setExplosions] = useState<Explosion[]>([]);
  const [shake,       setShake]      = useState(false);
  const [table,       setTable]      = useState<ScoreEntry[]>(loadTable);
  const [isNewRecord, setIsNewRecord]= useState(false);

  const bgMusic = useAudio('/sounds/somDuranteJogo.mp3', true);
  const sndBoom = useAudio('/sounds/BombExplosion2segundos.mp3', false);

  const gameRef        = useRef<HTMLDivElement>(null);
  const screenRef      = useRef(screen);
  const scoreRef       = useRef(score);
  const planeXRef      = useRef(planeX);
  const obstaclesRef   = useRef(obstacles);
  const rafRef         = useRef<number>(0);
  const lastTimeRef    = useRef(0);
  const spawnTimerRef  = useRef(0);
  const scoreTimerRef  = useRef(0);
  const touchStartRef  = useRef<number | null>(null);

  useEffect(() => { screenRef.current    = screen;    }, [screen]);
  useEffect(() => { scoreRef.current     = score;     }, [score]);
  useEffect(() => { planeXRef.current    = planeX;    }, [planeX]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);

  // Música de fundo
  useEffect(() => {
    if (screen === 'playing') bgMusic.play();
    else bgMusic.pause();
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSpeed         = (s: number) => 2.8 + Math.floor(s / 100) * 0.9;
  const getSpawnInterval = (s: number) => Math.max(880 - Math.floor(s / 50) * 55, 320);
  const level = Math.floor(score / 100) + 1;

  // ── Spawn ────────────────────────────────────────────────────
  const spawnObstacle = useCallback(() => {
    const type: Obstacle['type'] = Math.random() > 0.45 ? 'meteor' : 'cloud';
    const w = type === 'meteor' ? 38 : 58;
    const h = type === 'meteor' ? 38 : 40;
    const margin = 8;
    const maxPct = 100 - (w / GAME_WIDTH) * 100 - (margin / GAME_WIDTH) * 100;
    const x = (margin / GAME_WIDTH) * 100 + Math.random() * maxPct;
    setObstacles(prev => [
      ...prev,
      { id: oid++, x, y: -h - 5, width: w, height: h, type, rotation: Math.random() * 360 },
    ]);
  }, []);

  // ── Explosão ─────────────────────────────────────────────────
  const triggerExplosion = useCallback((px: number, py: number) => {
    sndBoom.play();
    const colors = ['#ff4500', '#ff8c00', '#ffd700', '#ff0000', '#fff'];
    setParticles(
      Array.from({ length: 26 }).map(() => ({
        id: pid++,
        x: px + PLANE_W / 2, y: py + PLANE_H / 2,
        vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
      }))
    );
    setExplosions([
      { id: eid++, x: px - 12, y: py - 12 },
      { id: eid++, x: px + 18, y: py + 8  },
    ]);
  }, [sndBoom]);

  // ── Game loop ────────────────────────────────────────────────
  const loop = useCallback((time: number) => {
    if (screenRef.current !== 'playing') return;
    const delta = Math.min(time - lastTimeRef.current, 50);
    lastTimeRef.current = time;
    const speed = getSpeed(scoreRef.current);

    setObstacles(prev => {
      const next = prev
        .map(o => ({ ...o, y: o.y + speed, rotation: o.rotation + 0.8 }))
        .filter(o => o.y < GAME_HEIGHT + 60);
      obstaclesRef.current = next;
      return next;
    });

    scoreTimerRef.current += delta;
    if (scoreTimerRef.current >= 100) {
      scoreTimerRef.current = 0;
      setScore(s => s + 1);
    }

    spawnTimerRef.current += delta;
    if (spawnTimerRef.current >= getSpawnInterval(scoreRef.current)) {
      spawnTimerRef.current = 0;
      spawnObstacle();
    }

    // Colisão
    const px = planeXRef.current, py = PLANE_Y, hb = 13;
    for (const o of obstaclesRef.current) {
      const ox = (o.x / 100) * GAME_WIDTH;
      if (
        px + hb < ox + o.width - hb &&
        px + PLANE_W - hb > ox + hb &&
        py + hb < o.y + o.height - hb &&
        py + PLANE_H - hb > o.y + hb
      ) {
        triggerExplosion(px, py);
        setShake(true);
        setTimeout(() => setShake(false), 500);

        const finalScore = scoreRef.current;
        // Highscore pessoal do piloto atual (baseado na tabela)
        const t = loadTable();
        const personal = t.filter(e => e.name === (localStorage.getItem(NM_KEY) || ''));
        const prevPersonalHS = personal.length > 0 ? Math.max(...personal.map(e => e.score)) : 0;
        const newHS = Math.max(prevPersonalHS, finalScore);
        setHighScore(newHS);
        setIsNewRecord(finalScore > 0 && finalScore >= newHS && finalScore > prevPersonalHS);

        const name = localStorage.getItem(NM_KEY) || 'PILOTO';
        if (finalScore > 0) {
          insertScore(name, finalScore);
          setTable(loadTable());
        }
        setScreen('dead');
        return;
      }
    }

    setParticles(prev =>
      prev
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.18, life: p.life - 0.035 }))
        .filter(p => p.life > 0)
    );

    rafRef.current = requestAnimationFrame(loop);
  }, [spawnObstacle, triggerExplosion]);

  useEffect(() => {
    if (screen === 'playing') {
      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen, loop]);

  // ── Start ────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setObstacles([]); setParticles([]); setExplosions([]);
    setScore(0); setPlaneX(GAME_WIDTH / 2 - PLANE_W / 2);
    spawnTimerRef.current = 0; scoreTimerRef.current = 0;
    setScreen('playing');
  }, []);

  // ── Controles teclado ─────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screenRef.current !== 'playing') return;
      setPlaneX(x => {
        if (e.key === 'ArrowLeft')  return Math.max(0, x - 24);
        if (e.key === 'ArrowRight') return Math.min(GAME_WIDTH - PLANE_W, x + 24);
        return x;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (screenRef.current !== 'playing' || touchStartRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartRef.current;
    touchStartRef.current = e.touches[0].clientX;
    setPlaneX(x => Math.max(0, Math.min(GAME_WIDTH - PLANE_W, x + dx * 1.3)));
  }, []);

  const onTap = useCallback((e: React.MouseEvent) => {
    if (screenRef.current !== 'playing') return;
    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPlaneX(Math.max(0, Math.min(GAME_WIDTH - PLANE_W, e.clientX - rect.left - PLANE_W / 2)));
  }, []);

  // ── Cadastro de nome ──────────────────────────────────────────
  const submitName = () => {
    const n = nameInput.trim().toUpperCase();
    if (!n) { setNameError('Digite um nome!'); return; }
    if (n.length > 14) { setNameError('Máximo 14 letras!'); return; }
    setNameError('');
    setPlayerName(n);
    localStorage.setItem(NM_KEY, n);
    // Carrega o melhor score pessoal do piloto a partir da tabela
    const t = loadTable();
    const personal = t.filter(e => e.name === n);
    const personalHS = personal.length > 0 ? Math.max(...personal.map(e => e.score)) : 0;
    setHighScore(personalHS);
    setScreen('idle');
  };

  // ── Trocar jogador ────────────────────────────────────────────
  const switchPlayer = () => {
    bgMusic.pause();
    cancelAnimationFrame(rafRef.current);
    setObstacles([]); setParticles([]); setExplosions([]);
    setScore(0); setNameInput(''); setNameError('');
    // Limpa nome salvo para forçar novo cadastro
    localStorage.removeItem(NM_KEY);
    setPlayerName('');
    setHighScore(0);
    setScreen('register');
  };

  // ── JSX ───────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="game-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(2,2,14,0.97)', backdropFilter: 'blur(12px)' }}
      >
        {/* Fechar */}
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)' }}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        >
          <X size={16} style={{ color: '#ff6b6b' }} />
        </motion.button>

        {/* ═══ ARENA ═══ */}
        <motion.div
          ref={gameRef}
          animate={shake ? { x: [-7, 7, -5, 5, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
          onClick={onTap}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          className="relative overflow-hidden select-none"
          style={{
            width: GAME_WIDTH, height: GAME_HEIGHT, borderRadius: 20,
            background: 'linear-gradient(180deg,#000814 0%,#001f3f 50%,#002b5c 100%)',
            border: '1px solid rgba(0,150,255,0.25)',
            boxShadow: '0 0 50px rgba(0,100,255,0.15), inset 0 0 80px rgba(0,0,0,0.6)',
            cursor: screen === 'playing' ? 'crosshair' : 'default',
            touchAction: 'none',
          }}
        >
          {/* Estrelas */}
          {Array.from({ length: 45 }).map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: i % 6 === 0 ? 2 : 1, height: i % 6 === 0 ? 2 : 1,
              background: ['#fff', '#adf', '#ffd'][i % 3],
              left: `${(i * 19 + 7) % 100}%`, top: `${(i * 29 + 11) % 100}%`,
              opacity: 0.15 + (i % 5) * 0.07,
            }} />
          ))}

          {/* HUD */}
          {(screen === 'playing' || screen === 'dead') && (
            <div className="absolute top-3 left-0 right-0 flex justify-between px-4 z-10 pointer-events-none">
              <div style={{ fontFamily: 'monospace', color: '#00cfff', fontSize: 13, fontWeight: 700, textShadow: '0 0 8px #00cfff' }}>
                {String(score).padStart(5, '0')}
              </div>
              <div style={{ fontFamily: 'monospace', color: '#7c6fff', fontSize: 11, textShadow: '0 0 6px #7c6fff' }}>
                LV{level}
              </div>
              <div style={{ fontFamily: 'monospace', color: '#ffd700', fontSize: 11, textShadow: '0 0 6px #ffd700' }}>
                {String(highScore).padStart(5, '0')}
              </div>
            </div>
          )}

          {/* Obstáculos */}
          {obstacles.map(o => (
            <div key={o.id} className="absolute pointer-events-none"
              style={{ left: `${o.x}%`, top: o.y, width: o.width, height: o.height }}>
              <img
                src={`/GAME/${o.type === 'meteor' ? 'meteor' : 'cloud'}.svg`}
                alt=""
                style={{
                  width: '100%', height: '100%',
                  transform: `rotate(${o.rotation}deg)`,
                  filter: o.type === 'meteor'
                    ? 'drop-shadow(0 0 6px #ff6b00)'
                    : 'drop-shadow(0 0 4px #00cfff) brightness(1.3)',
                }}
              />
            </div>
          ))}

          {/* Foguete — cabeça pra CIMA (sem rotate) */}
          {screen !== 'dead' && screen !== 'register' && screen !== 'table' && (
            <motion.div
              className="absolute pointer-events-none"
              animate={{ x: planeX }}
              transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.5 }}
              style={{ top: PLANE_Y, width: PLANE_W, height: PLANE_H }}
            >
              <img
                src="/GAME/airplane.svg"
                alt="foguete"
                style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 8px #00d9ff)' }}
              />
              {screen === 'playing' && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    bottom: -10, left: '50%', transform: 'translateX(-50%)', width: 6,
                    background: 'linear-gradient(180deg,#ff6b6b,#ff9a00,transparent)', borderRadius: 4,
                  }}
                  animate={{ height: [10, 18, 8, 16, 10], opacity: [0.9, 1, 0.7, 1, 0.9] }}
                  transition={{ duration: 0.25, repeat: Infinity }}
                />
              )}
            </motion.div>
          )}

          {/* Partículas */}
          {particles.map(p => (
            <div key={p.id} className="absolute rounded-full pointer-events-none" style={{
              left: p.x, top: p.y, width: p.size, height: p.size,
              background: p.color, opacity: p.life,
              boxShadow: `0 0 ${p.size + 2}px ${p.color}`,
            }} />
          ))}

          {/* Duas nuvens de explosão */}
          {explosions.map((exp, i) => (
            <motion.div
              key={exp.id}
              className="absolute pointer-events-none"
              style={{ left: exp.x, top: exp.y, zIndex: 20 }}
              initial={{ scale: 0.2, opacity: 1, rotate: i === 0 ? 0 : 25 }}
              animate={{ scale: i === 0 ? 2.8 : 2.2, opacity: 0, rotate: i === 0 ? 15 : -20 }}
              transition={{ duration: i === 0 ? 0.7 : 0.55, ease: 'easeOut' }}
            >
              <img
                src={`/GAME/explosioncloud${i + 1}.svg`}
                alt=""
                style={{
                  width: 72, height: 72,
                  filter: `drop-shadow(0 0 12px ${i === 0 ? '#ff4500' : '#ffd700'}) hue-rotate(${i === 0 ? 0 : 20}deg) brightness(3)`,
                }}
              />
            </motion.div>
          ))}

          {/* ═══ TELA: CADASTRO ═══ */}
          {screen === 'register' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            >
              <motion.img
                src="/GAME/airplane.svg" alt="foguete"
                style={{ width: 72, height: 72, filter: 'drop-shadow(0 0 16px #00d9ff)' }}
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <GameTitle size="lg" />
              <div style={{ fontFamily: 'monospace', color: '#8899aa', fontSize: 10, textAlign: 'center', lineHeight: 1.8 }}>
                Antes de decolar,<br />qual é o seu nome de piloto?
              </div>

              <div className="w-full flex flex-col gap-2">
                <input
                  maxLength={14}
                  value={nameInput}
                  onChange={e => { setNameInput(e.target.value.toUpperCase()); setNameError(''); }}
                  onKeyDown={e => e.key === 'Enter' && submitName()}
                  placeholder="SEU NOME (máx 14)"
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    fontFamily: 'monospace', fontSize: 14, fontWeight: 700, letterSpacing: 3,
                    background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.35)',
                    color: '#00cfff', outline: 'none', textAlign: 'center', boxSizing: 'border-box',
                  }}
                />
                {nameError && (
                  <div style={{ fontFamily: 'monospace', color: '#ff6b6b', fontSize: 10, textAlign: 'center' }}>
                    {nameError}
                  </div>
                )}
                <div style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', fontSize: 9, textAlign: 'right' }}>
                  {nameInput.length}/14
                </div>
              </div>

              <motion.button
                onClick={submitName}
                className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm tracking-widest"
                style={{ background: 'linear-gradient(135deg,#5227ff,#00d9ff)', color: '#fff', fontFamily: 'monospace', boxShadow: '0 0 24px rgba(0,150,255,0.5)' }}
                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
              >
                <LogIn size={15} /> ENTRAR
              </motion.button>
            </motion.div>
          )}

          {/* ═══ TELA: IDLE ═══ */}
          {screen === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            >
              <motion.img
                src="/GAME/airplane.svg" alt="foguete"
                style={{ width: 78, height: 78, filter: 'drop-shadow(0 0 16px #00d9ff)' }}
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <GameTitle size="lg" />
              <div style={{ fontFamily: 'monospace', color: '#556677', fontSize: 10 }}>
                BEM-VINDO,{' '}
                <span style={{ color: '#ffd700', textShadow: '0 0 8px #ffd700' }}>{playerName}</span>!
              </div>
              <div style={{ fontFamily: 'monospace', color: '#8899aa', fontSize: 10, textAlign: 'center', lineHeight: 1.9, maxWidth: 230 }}>
                TOQUE ou ARRASTE para mover o foguete<br />
                Desvie de meteoros e nuvens!<br />
                <span style={{ color: '#ffd700' }}>A cada 100pts a velocidade aumenta ⚡</span>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={startGame}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm tracking-widest"
                  style={{ background: 'linear-gradient(135deg,#5227ff,#00d9ff)', color: '#fff', fontFamily: 'monospace', boxShadow: '0 0 24px rgba(0,150,255,0.5)' }}
                  whileHover={{ scale: 1.08, boxShadow: '0 0 36px rgba(0,150,255,0.8)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play size={14} /> JOGAR
                </motion.button>
                <motion.button
                  onClick={() => { setTable(loadTable()); setScreen('table'); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-black text-xs"
                  style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', fontFamily: 'monospace', border: '1px solid rgba(255,215,0,0.3)' }}
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
                >
                  <Trophy size={13} /> TOP
                </motion.button>
              </div>

              {highScore > 0 && (
                <div style={{ fontFamily: 'monospace', color: '#ffd700', fontSize: 10 }}>
                  🏆 SEU RECORDE: {String(highScore).padStart(5, '0')}
                </div>
              )}

              <motion.button
                onClick={switchPlayer}
                style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', fontSize: 9,
                  background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '5px 14px', cursor: 'pointer', marginTop: -8 }}
                whileHover={{ color: '#00cfff', borderColor: 'rgba(0,207,255,0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                👤 TROCAR PILOTO
              </motion.button>
            </motion.div>
          )}

          {/* ═══ TELA: GAME OVER ═══ */}
          {screen === 'dead' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 180 }}
            >
              <motion.img
                src="/GAME/game-over-svgrepo-com.svg" alt="game over"
                style={{ width: 105, height: 105, filter: 'drop-shadow(0 0 16px #ff4500) brightness(1.6) saturate(1.5)' }}
                initial={{ scale: 0.3, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
              />

              {isNewRecord && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.85, type: 'spring' }}
                  style={{ fontFamily: 'monospace', color: '#ffd700', fontSize: 13, textShadow: '0 0 14px #ffd700', fontWeight: 900 }}
                >
                  🏆 NOVO RECORDE!
                </motion.div>
              )}

              <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: 16 }}>
                SCORE:{' '}
                <span style={{ color: '#00cfff', textShadow: '0 0 10px #00cfff' }}>
                  {String(score).padStart(5, '0')}
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', color: '#556677', fontSize: 10 }}>
                MELHOR: {String(highScore).padStart(5, '0')} · {playerName}
              </div>

              <div className="flex gap-2 mt-1 flex-wrap justify-center">
                <motion.button
                  onClick={startGame}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-xs tracking-widest"
                  style={{ background: 'linear-gradient(135deg,#5227ff,#00d9ff)', color: '#fff', fontFamily: 'monospace' }}
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw size={12} /> DE NOVO
                </motion.button>
                <motion.button
                  onClick={() => { setTable(loadTable()); setScreen('table'); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs"
                  style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', fontFamily: 'monospace', border: '1px solid rgba(255,215,0,0.3)' }}
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
                >
                  <Trophy size={12} /> TOP 10
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl font-black text-xs"
                  style={{ background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', fontFamily: 'monospace', border: '1px solid rgba(255,107,107,0.35)' }}
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
                >
                  SAIR
                </motion.button>
              </div>

              <motion.button
                onClick={switchPlayer}
                style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', fontSize: 9,
                  background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '5px 14px', cursor: 'pointer' }}
                whileHover={{ color: '#00cfff', borderColor: 'rgba(0,207,255,0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                👤 TROCAR PILOTO
              </motion.button>
            </motion.div>
          )}

          {/* ═══ TELA: TABELA TOP 10 ═══ */}
          {screen === 'table' && (
            <motion.div
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 pt-5 pb-3"
                style={{ borderBottom: '1px solid rgba(0,200,255,0.15)' }}
              >
                <div
                  className="flex items-center gap-2"
                  style={{ fontFamily: 'monospace', color: '#ffd700', fontSize: 14, fontWeight: 900, textShadow: '0 0 10px #ffd700' }}
                >
                  <Trophy size={15} /> TOP 10 PILOTOS
                </div>
                <motion.button
                  onClick={() => setScreen(score > 0 ? 'dead' : 'idle')}
                  style={{ fontFamily: 'monospace', color: '#556677', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer' }}
                  whileHover={{ color: '#fff' }}
                >
                  ← VOLTAR
                </motion.button>
              </div>

              {/* Header colunas */}
              <div
                className="flex px-4 py-1.5"
                style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span style={{ width: 28 }}>#</span>
                <span style={{ flex: 1 }}>PILOTO</span>
                <span style={{ width: 64, textAlign: 'right' }}>SCORE</span>
                <span style={{ width: 60, textAlign: 'right' }}>DATA</span>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {table.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-full gap-3"
                    style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center' }}
                  >
                    <span style={{ fontSize: 32 }}>🚀</span>
                    Nenhum score ainda!
                    <span style={{ fontSize: 9 }}>Seja o primeiro piloto na lista</span>
                  </div>
                ) : (
                  table.map((entry, i) => {
                    const isPlayer = entry.name === playerName;
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    const isTop3 = i < 3;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center px-4 py-2.5"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isPlayer
                            ? 'rgba(0,207,255,0.07)'
                            : isTop3 ? 'rgba(255,215,0,0.03)' : 'transparent',
                        }}
                      >
                        <span style={{
                          width: 28, fontFamily: 'monospace',
                          fontSize: isTop3 ? 14 : 10,
                          color: isTop3 ? '#ffd700' : 'rgba(255,255,255,0.3)',
                        }}>
                          {medal}
                        </span>
                        <span style={{
                          flex: 1, fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                          color: isPlayer ? '#00cfff' : isTop3 ? '#fff' : 'rgba(255,255,255,0.6)',
                          textShadow: isPlayer ? '0 0 8px #00cfff' : 'none',
                        }}>
                          {entry.name}
                          {isPlayer && (
                            <span style={{ color: 'rgba(0,207,255,0.5)', fontSize: 8 }}> ◀YOU</span>
                          )}
                        </span>
                        <span style={{
                          width: 64, textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 900,
                          color: isTop3 ? '#ffd700' : '#aaa',
                          textShadow: isTop3 ? '0 0 6px #ffd700' : 'none',
                        }}>
                          {String(entry.score).padStart(5, '0')}
                        </span>
                        <span style={{
                          width: 60, textAlign: 'right', fontFamily: 'monospace',
                          fontSize: 8, color: 'rgba(255,255,255,0.25)',
                        }}>
                          {entry.date}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div
                className="flex justify-between items-center px-4 py-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <motion.button
                  onClick={() => { setScreen('register'); setNameInput(playerName); }}
                  style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', fontSize: 9, background: 'none', border: 'none', cursor: 'pointer' }}
                  whileHover={{ color: '#00cfff' }}
                >
                  ✏️ MUDAR NOME
                </motion.button>
                <motion.button
                  onClick={startGame}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs"
                  style={{ background: 'linear-gradient(135deg,#5227ff,#00d9ff)', color: '#fff', fontFamily: 'monospace' }}
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
                >
                  <Play size={11} /> JOGAR
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Rodapé de controles */}
          {screen === 'playing' && (
            <div
              className="absolute bottom-2 left-0 right-0 text-center pointer-events-none"
              style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.12)', fontSize: 8 }}
            >
              ← → TECLADO · TOQUE / ARRASTE NA TELA
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
