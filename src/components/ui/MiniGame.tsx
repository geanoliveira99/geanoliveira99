import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Play, RotateCcw, LogIn } from 'lucide-react';

function ScanLine({ delay = 0, duration = 2.4 }: { delay?: number; duration?: number }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: '-110%' }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: 2.8, ease: 'linear' }}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1,
        background: 'linear-gradient(90deg, transparent 0%, #00ff50 40%, #00ff50 60%, transparent 100%)',
        boxShadow: '0 0 6px 2px #00ff50, 0 0 16px 4px rgba(0,255,80,0.7)',
        pointerEvents: 'none', zIndex: 5,
      }}
    />
  );
}

function GameTitle({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const isLg = size === 'lg';
  return (
    <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
      <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', fontFamily: 'monospace', fontSize: isLg ? 23 : 18, fontWeight: 900, letterSpacing: isLg ? 5 : 4, color: '#00cfff', textShadow: '0 0 10px #00cfff, 0 0 24px rgba(0,207,255,0.35)', paddingBottom: 2 }}>
        GTASADREAMER
        <ScanLine delay={0.2} duration={2.0} />
      </div>
      <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', fontFamily: 'monospace', fontSize: isLg ? 13 : 10, fontWeight: 700, letterSpacing: isLg ? 16 : 12, color: '#7c6fff', textShadow: '0 0 10px #7c6fff, 0 0 22px rgba(124,111,255,0.35)', paddingLeft: isLg ? 6 : 4, marginTop: 1 }}>
        SPACE
        <ScanLine delay={1.4} duration={1.6} />
      </div>
    </div>
  );
}

interface Obstacle { id: number; x: number; y: number; width: number; height: number; type: 'meteor' | 'cloud'; rotation: number; }
interface BonusItem { id: number; x: number; y: number; }
interface AlienShip { id: number; x: number; y: number; width: number; height: number; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface Explosion { id: number; x: number; y: number; }
interface ScoreEntry { name: string; score: number; date: string; }
type ShipSkin = 'normal' | 'bonus' | 'elite';

const GAME_WIDTH = 320, GAME_HEIGHT = 520, PLANE_W = 52, PLANE_H = 52, PLANE_Y = GAME_HEIGHT - 110;
const TB_KEY = 'skyDodgeTable', NM_KEY = 'skyDodgeName';
const MAX_TABLE = 10, LIVES = 3, BONUS_EVERY = 150, ELITE_SCORE = 1000, BONUS_SECS = 10;
const BONUS_W = 38, BONUS_H = 38, ALIEN_W = 52, ALIEN_H = 40;
let oid = 0, pid = 0, eid = 0, bid = 0, aid = 0;

function loadTable(): ScoreEntry[] { try { return JSON.parse(localStorage.getItem(TB_KEY) || '[]'); } catch { return []; } }
function saveTable(t: ScoreEntry[]) { localStorage.setItem(TB_KEY, JSON.stringify(t.slice(0, MAX_TABLE))); }
function insertScore(name: string, score: number) { const t = loadTable(); t.push({ name, score, date: new Date().toLocaleDateString('pt-BR') }); t.sort((a, b) => b.score - a.score); saveTable(t); }

function useAudio(src: string, loop = false) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { const a = new Audio(src); a.loop = loop; a.volume = loop ? 0.35 : 0.7; ref.current = a; return () => { a.pause(); a.src = ''; }; }, [src, loop]);
  const play  = useCallback(() => { if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); } }, []);
  const stop  = useCallback(() => { if (ref.current) { ref.current.pause(); ref.current.currentTime = 0; } }, []);
  const pause = useCallback(() => { ref.current?.pause(); }, []);
  const setRate = useCallback((rate: number) => { if (ref.current) ref.current.playbackRate = rate; }, []);
  return { play, stop, pause, setRate };
}

type Screen = 'register' | 'idle' | 'playing' | 'dead' | 'table';

export default function MiniGame({ onClose }: { onClose: () => void }) {
  const savedName = localStorage.getItem(NM_KEY) || '';
  const [screen,       setScreen]      = useState<Screen>(savedName ? 'idle' : 'register');
  const [playerName,   setPlayerName]  = useState(savedName);
  const [nameInput,    setNameInput]   = useState(savedName);
  const [nameError,    setNameError]   = useState('');
  const [score,        setScore]       = useState(0);
  const [highScore,    setHighScore]   = useState(() => { const t = loadTable().filter(e => e.name === savedName); return t.length > 0 ? Math.max(...t.map(e => e.score)) : 0; });
  const [planeX,       setPlaneX]      = useState(GAME_WIDTH / 2 - PLANE_W / 2);
  const [lives,        setLives]       = useState(LIVES);
  const [obstacles,    setObstacles]   = useState<Obstacle[]>([]);
  const [bonusItems,   setBonusItems]  = useState<BonusItem[]>([]);
  const [aliens,       setAliens]      = useState<AlienShip[]>([]);
  const [particles,    setParticles]   = useState<Particle[]>([]);
  const [explosions,   setExplosions]  = useState<Explosion[]>([]);
  const [shake,        setShake]       = useState(false);
  const [table,        setTable]       = useState<ScoreEntry[]>(loadTable);
  const [isNewRecord,  setIsNewRecord] = useState(false);
  const [bonusActive,  setBonusActive] = useState(false);
  const [bonusTimeLeft,setBonusTimeLeft]=useState(0);
  const [shipSkin,     setShipSkin]    = useState<ShipSkin>('normal');
  const [invincible,   setInvincible]  = useState(false);

  const bgMusic = useAudio('/sounds/somDuranteJogo.mp3', true);
  const sndBoom = useAudio('/sounds/BombExplosion2segundos.mp3', false);

  const gameRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef(screen), scoreRef = useRef(score), livesRef = useRef(lives), planeXRef = useRef(planeX);
  const obstaclesRef = useRef(obstacles), bonusItemsRef = useRef(bonusItems), aliensRef = useRef(aliens);
  const bonusActiveRef = useRef(bonusActive), bonusTimerMs = useRef(0), lastBonusScore = useRef(-1);
  const invincRef = useRef(false), rafRef = useRef<number>(0), lastTimeRef = useRef(0);
  const spawnTimerRef = useRef(0), scoreTimerRef = useRef(0), alienTimerRef = useRef(0);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { planeXRef.current = planeX; }, [planeX]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { bonusItemsRef.current = bonusItems; }, [bonusItems]);
  useEffect(() => { aliensRef.current = aliens; }, [aliens]);
  useEffect(() => { bonusActiveRef.current = bonusActive; }, [bonusActive]);
  useEffect(() => { invincRef.current = invincible; }, [invincible]);

  useEffect(() => { if (screen === 'playing') bgMusic.play(); else bgMusic.pause(); }, [screen]); // eslint-disable-line

  // Acelera música no boost ⚡
  useEffect(() => {
    bgMusic.setRate(bonusActive ? 1.45 : 1.0);
  }, [bonusActive]); // eslint-disable-line

  useEffect(() => {
    if (bonusActive) setShipSkin('bonus');
    else if (score >= ELITE_SCORE) setShipSkin('elite');
    else setShipSkin('normal');
  }, [bonusActive, score]);

  const getShipSrc = (skin: ShipSkin) => skin === 'bonus' ? '/GAME/spaceShuttleBONUS.svg' : skin === 'elite' ? '/GAME/space1000bonus.svg' : '/GAME/airplane.svg';
  const getSpeed = (s: number) => 2.8 + Math.floor(s / 100) * 0.9;
  const getSpawnInterval = (s: number) => Math.max(880 - Math.floor(s / 50) * 55, 320);
  const level = Math.floor(score / 100) + 1;

  const spawnObstacle = useCallback(() => {
    const type: Obstacle['type'] = Math.random() > 0.45 ? 'meteor' : 'cloud';
    const w = type === 'meteor' ? 38 : 58, h = type === 'meteor' ? 38 : 40, margin = 8;
    const maxPct = 100 - (w / GAME_WIDTH) * 100 - (margin / GAME_WIDTH) * 100;
    const x = (margin / GAME_WIDTH) * 100 + Math.random() * maxPct;
    setObstacles(prev => [...prev, { id: oid++, x, y: -h - 5, width: w, height: h, type, rotation: Math.random() * 360 }]);
  }, []);

  const spawnBonus = useCallback(() => {
    const margin = 20, x = margin + Math.random() * (GAME_WIDTH - BONUS_W - margin * 2);
    setBonusItems(prev => [...prev, { id: bid++, x, y: -BONUS_H - 5 }]);
  }, []);

  const spawnAlien = useCallback(() => {
    const margin = 8, x = margin + Math.random() * (GAME_WIDTH - ALIEN_W - margin * 2);
    setAliens(prev => [...prev, { id: aid++, x, y: -ALIEN_H - 5, width: ALIEN_W, height: ALIEN_H }]);
  }, []);

  const triggerExplosion = useCallback((px: number, py: number, big = true) => {
    sndBoom.play();
    const colors = ['#ff4500','#ff8c00','#ffd700','#ff0000','#fff'];
    setParticles(prev => [...prev, ...Array.from({ length: big ? 26 : 12 }).map(() => ({ id: pid++, x: px + PLANE_W / 2, y: py + PLANE_H / 2, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9, life: 1, color: colors[Math.floor(Math.random() * colors.length)], size: 3 + Math.random() * 5 }))]);
    if (big) setExplosions([{ id: eid++, x: px - 12, y: py - 12 }, { id: eid++, x: px + 18, y: py + 8 }]);
    else setExplosions([{ id: eid++, x: px - 8, y: py - 8 }]);
  }, [sndBoom]);

  const takeDamage = useCallback((px: number, py: number, finalScore: number) => {
    const newLives = livesRef.current - 1;
    if (newLives <= 0) {
      triggerExplosion(px, py, true);
      setShake(true); setTimeout(() => setShake(false), 500); setLives(0);
      const t = loadTable(), personal = t.filter(e => e.name === (localStorage.getItem(NM_KEY) || ''));
      const prevHS = personal.length > 0 ? Math.max(...personal.map(e => e.score)) : 0;
      const newHS = Math.max(prevHS, finalScore);
      setHighScore(newHS); setIsNewRecord(finalScore > 0 && finalScore >= newHS && finalScore > prevHS);
      const name = localStorage.getItem(NM_KEY) || 'PILOTO';
      if (finalScore > 0) { insertScore(name, finalScore); setTable(loadTable()); }
      setScreen('dead');
    } else {
      triggerExplosion(px, py, false);
      setShake(true); setTimeout(() => setShake(false), 400);
      setLives(newLives); livesRef.current = newLives;
      setInvincible(true); invincRef.current = true;
      setTimeout(() => { setInvincible(false); invincRef.current = false; }, 1500);
      setObstacles([]); obstaclesRef.current = [];
      setAliens([]); aliensRef.current = [];
    }
  }, [triggerExplosion]);

  const loop = useCallback((time: number) => {
    if (screenRef.current !== 'playing') return;
    const delta = Math.min(time - lastTimeRef.current, 50);
    lastTimeRef.current = time;
    const speed = getSpeed(scoreRef.current);

    setObstacles(prev => { const next = prev.map(o => ({ ...o, y: o.y + speed, rotation: o.rotation + 0.8 })).filter(o => o.y < GAME_HEIGHT + 60); obstaclesRef.current = next; return next; });
    setBonusItems(prev => { const next = prev.map(b => ({ ...b, y: b.y + speed * 0.7 })).filter(b => b.y < GAME_HEIGHT + 60); bonusItemsRef.current = next; return next; });
    setAliens(prev => { const next = prev.map(a => ({ ...a, y: a.y + speed * 1.1 })).filter(a => a.y < GAME_HEIGHT + 60); aliensRef.current = next; return next; });

    scoreTimerRef.current += delta;
    if (scoreTimerRef.current >= 100) { scoreTimerRef.current = 0; setScore(s => s + 1); }

    spawnTimerRef.current += delta;
    if (spawnTimerRef.current >= getSpawnInterval(scoreRef.current)) { spawnTimerRef.current = 0; spawnObstacle(); }

    if (scoreRef.current > 50) {
      alienTimerRef.current += delta;
      const alienInterval = Math.max(8000 - Math.floor(scoreRef.current / 100) * 500, 4000);
      if (alienTimerRef.current >= alienInterval) { alienTimerRef.current = 0; spawnAlien(); }
    }

    const bonusThreshold = Math.floor(scoreRef.current / BONUS_EVERY);
    if (bonusThreshold > lastBonusScore.current && !bonusActiveRef.current) { lastBonusScore.current = bonusThreshold; spawnBonus(); }

    if (bonusActiveRef.current) {
      bonusTimerMs.current -= delta;
      if (bonusTimerMs.current <= 0) { bonusTimerMs.current = 0; setBonusActive(false); bonusActiveRef.current = false; setBonusTimeLeft(0); }
      else setBonusTimeLeft(Math.ceil(bonusTimerMs.current / 1000));
    }

    const px = planeXRef.current, py = PLANE_Y, hb = 13;

    // Colisão obstáculos — ignorada com bônus ativo ou invencível
    if (!invincRef.current && !bonusActiveRef.current) {
      for (const o of obstaclesRef.current) {
        const ox = (o.x / 100) * GAME_WIDTH;
        if (px + hb < ox + o.width - hb && px + PLANE_W - hb > ox + hb && py + hb < o.y + o.height - hb && py + PLANE_H - hb > o.y + hb) {
          takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
      }
    }

    const remaining: BonusItem[] = []; let collected = false;
    for (const b of bonusItemsRef.current) {
      if (!collected && px + hb < b.x + BONUS_W - 4 && px + PLANE_W - hb > b.x + 4 && py + hb < b.y + BONUS_H - 4 && py + PLANE_H - hb > b.y + 4) {
        collected = true;
        setBonusActive(true); bonusActiveRef.current = true; bonusTimerMs.current = BONUS_SECS * 1000; setBonusTimeLeft(BONUS_SECS);
        // Força spawn do alien logo no início do boost ⚡
        alienTimerRef.current = 9999;
        setParticles(prev => [...prev, ...Array.from({ length: 18 }).map(() => ({ id: pid++, x: b.x + BONUS_W / 2, y: b.y + BONUS_H / 2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 1, color: ['#ffd700','#fff700','#ffaa00','#fff'][Math.floor(Math.random() * 4)], size: 3 + Math.random() * 4 }))]);
      } else remaining.push(b);
    }
    if (collected) { setBonusItems(remaining); bonusItemsRef.current = remaining; }

    if (!invincRef.current) {
      for (const a of aliensRef.current) {
        if (px + hb < a.x + a.width - hb && px + PLANE_W - hb > a.x + hb && py + hb < a.y + a.height - hb && py + PLANE_H - hb > a.y + hb) {
          if (bonusActiveRef.current) { setBonusActive(false); bonusActiveRef.current = false; bonusTimerMs.current = 0; setBonusTimeLeft(0); }
          setAliens(prev => prev.filter(x => x.id !== a.id)); aliensRef.current = aliensRef.current.filter(x => x.id !== a.id);
          takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
      }
    }

    setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.18, life: p.life - 0.035 })).filter(p => p.life > 0));
    rafRef.current = requestAnimationFrame(loop);
  }, [spawnObstacle, spawnBonus, spawnAlien, triggerExplosion, takeDamage]);

  useEffect(() => {
    if (screen === 'playing') { lastTimeRef.current = performance.now(); rafRef.current = requestAnimationFrame(loop); }
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen, loop]);

  const startGame = useCallback(() => {
    setObstacles([]); setParticles([]); setExplosions([]); setBonusItems([]); setAliens([]);
    setScore(0); setPlaneX(GAME_WIDTH / 2 - PLANE_W / 2); setLives(LIVES);
    setBonusActive(false); setBonusTimeLeft(0); setIsNewRecord(false); setShipSkin('normal');
    setInvincible(false); invincRef.current = false;
    bonusActiveRef.current = false; bonusTimerMs.current = 0; lastBonusScore.current = -1;
    alienTimerRef.current = 0; spawnTimerRef.current = 0; scoreTimerRef.current = 0;
    setScreen('playing');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screenRef.current !== 'playing') return;
      setPlaneX(x => { if (e.key === 'ArrowLeft') return Math.max(0, x - 24); if (e.key === 'ArrowRight') return Math.min(GAME_WIDTH - PLANE_W, x + 24); return x; });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientX; }, []);
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

  const submitName = () => {
    const n = nameInput.trim().toUpperCase();
    if (!n) { setNameError('Digite um nome!'); return; }
    if (n.length > 14) { setNameError('Maximo 14 letras!'); return; }
    setNameError(''); setPlayerName(n); localStorage.setItem(NM_KEY, n);
    const t = loadTable().filter(e => e.name === n);
    setHighScore(t.length > 0 ? Math.max(...t.map(e => e.score)) : 0);
    setScreen('idle');
  };

  const switchPlayer = () => {
    bgMusic.pause(); cancelAnimationFrame(rafRef.current);
    setObstacles([]); setParticles([]); setExplosions([]); setBonusItems([]); setAliens([]);
    setScore(0); setNameInput(''); setNameError('');
    localStorage.removeItem(NM_KEY); setPlayerName(''); setHighScore(0);
    setLives(LIVES); setBonusActive(false); setBonusTimeLeft(0);
    setScreen('register');
  };

  const shipSrc = getShipSrc(shipSkin);

  return (
    <AnimatePresence>
      <motion.div key="game-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(2,2,14,0.97)', backdropFilter: 'blur(12px)' }}>
        <motion.button onClick={onClose} className="absolute top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)' }}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <X size={16} style={{ color: '#ff6b6b' }} />
        </motion.button>

        <motion.div ref={gameRef} animate={shake ? { x: [-7,7,-5,5,-3,3,0] } : {}} transition={{ duration: 0.4 }}
          onClick={onTap} onTouchStart={onTouchStart} onTouchMove={onTouchMove}
          className="relative overflow-hidden select-none"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT, borderRadius: 20,
            background: 'linear-gradient(180deg,#000814 0%,#001f3f 50%,#002b5c 100%)',
            border: `1px solid ${bonusActive ? 'rgba(255,215,0,0.5)' : 'rgba(0,150,255,0.25)'}`,
            boxShadow: bonusActive ? '0 0 50px rgba(255,215,0,0.25), inset 0 0 80px rgba(0,0,0,0.6)' : '0 0 50px rgba(0,100,255,0.15), inset 0 0 80px rgba(0,0,0,0.6)',
            cursor: screen === 'playing' ? 'crosshair' : 'default', touchAction: 'none', transition: 'border-color 0.3s, box-shadow 0.3s' }}>

          {Array.from({ length: 45 }).map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{ width: i%6===0?2:1, height: i%6===0?2:1, background: ['#fff','#adf','#ffd'][i%3], left:`${(i*19+7)%100}%`, top:`${(i*29+11)%100}%`, opacity: 0.15+(i%5)*0.07 }} />
          ))}

          {(screen === 'playing' || screen === 'dead') && (
            <div className="absolute top-3 left-0 right-0 flex justify-between items-center px-4 z-10 pointer-events-none">
              <div style={{ fontFamily:'monospace', color:'#00cfff', fontSize:13, fontWeight:700, textShadow:'0 0 8px #00cfff' }}>{String(score).padStart(5,'0')}</div>
              <div className="flex gap-1 items-center">
                {Array.from({ length: LIVES }).map((_,i) => (
                  <span key={i} style={{ fontSize:11, opacity: i<lives?1:0.18, filter: i<lives?'drop-shadow(0 0 4px #ff4444)':'none' }}>❤️</span>
                ))}
              </div>
              <div style={{ fontFamily:'monospace', color:'#ffd700', fontSize:11, textShadow:'0 0 6px #ffd700' }}>{String(highScore).padStart(5,'0')}</div>
            </div>
          )}

          {screen === 'playing' && bonusActive && (
            <motion.div className="absolute z-10 pointer-events-none" style={{ top:28, left:0, right:0, display:'flex', justifyContent:'center' }} initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
              <div style={{ fontFamily:'monospace', fontSize:10, fontWeight:900, color:'#ffd700', textShadow:'0 0 10px #ffd700', background:'rgba(255,215,0,0.12)', border:'1px solid rgba(255,215,0,0.4)', borderRadius:8, padding:'2px 10px', letterSpacing:2 }}>
                ⚡ BOOST {bonusTimeLeft}s
              </div>
            </motion.div>
          )}
          {screen === 'playing' && !bonusActive && (
            <div className="absolute z-10 pointer-events-none" style={{ top:28, left:0, right:0, display:'flex', justifyContent:'center' }}>
              <div style={{ fontFamily:'monospace', color:'#7c6fff', fontSize:10, textShadow:'0 0 6px #7c6fff' }}>LV{level}</div>
            </div>
          )}

          {obstacles.map(o => (
            <div key={o.id} className="absolute pointer-events-none" style={{ left:`${o.x}%`, top:o.y, width:o.width, height:o.height }}>
              <img src={`/GAME/${o.type==='meteor'?'meteor':'cloud'}.svg`} alt="" style={{ width:'100%', height:'100%', transform:`rotate(${o.rotation}deg)`, filter: o.type==='meteor'?'drop-shadow(0 0 6px #ff6b00)':'drop-shadow(0 0 4px #00cfff) brightness(1.3)' }} />
            </div>
          ))}

          {bonusItems.map(b => (
            <motion.div key={b.id} className="absolute pointer-events-none" style={{ left:b.x, top:b.y, width:BONUS_W, height:BONUS_H, zIndex:8 }}
              animate={{ rotate:[0,360], scale:[1,1.18,1] }} transition={{ rotate:{duration:2,repeat:Infinity,ease:'linear'}, scale:{duration:0.8,repeat:Infinity} }}>
              <img src="/GAME/BONUS.svg" alt="bonus" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 10px #ffd700) drop-shadow(0 0 24px #ffaa00) brightness(1.5)' }} />
            </motion.div>
          ))}

          {aliens.map(a => (
            <motion.div key={a.id} className="absolute pointer-events-none" style={{ left:a.x, top:a.y, width:a.width, height:a.height, zIndex:8 }}
              animate={{ x:[0,10,-10,0] }} transition={{ duration:1.2, repeat:Infinity, ease:'easeInOut' }}>
              <img src="/GAME/ALIEN.svg" alt="alien" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 8px #00ff80) drop-shadow(0 0 20px #00cc60) brightness(1.2)' }} />
            </motion.div>
          ))}

          {screen !== 'dead' && screen !== 'register' && screen !== 'table' && screen !== 'idle' && (
            <motion.div className="absolute pointer-events-none"
              animate={{ x:planeX, opacity: invincible?[1,0.25,1,0.25,1,0.25,1]:1 }}
              transition={{ x:{type:'spring',stiffness:420,damping:30,mass:0.5}, opacity: invincible?{duration:0.3,repeat:5}:{} }}
              style={{ top:PLANE_Y, width:PLANE_W, height:PLANE_H }}>
              <motion.img src={shipSrc} alt="nave"
                style={{ width:'100%', height:'100%', filter: bonusActive?'drop-shadow(0 0 14px #ffd700) drop-shadow(0 0 28px #ffaa00) brightness(1.25)':shipSkin==='elite'?'drop-shadow(0 0 14px #ff00ff) drop-shadow(0 0 28px #aa00ff) brightness(1.25)':'drop-shadow(0 0 8px #00d9ff)' }}
                animate={bonusActive?{scale:[1,1.07,1]}:{}} transition={{ duration:0.4, repeat:Infinity }} />
              {screen === 'playing' && (
                <motion.div className="absolute rounded-full"
                  style={{ bottom:-10, left:'50%', transform:'translateX(-50%)', width:bonusActive?10:6, background:bonusActive?'linear-gradient(180deg,#ffd700,#ff6b00,transparent)':'linear-gradient(180deg,#ff6b6b,#ff9a00,transparent)', borderRadius:4 }}
                  animate={{ height:bonusActive?[16,28,12,24,16]:[10,18,8,16,10], opacity:[0.9,1,0.7,1,0.9] }}
                  transition={{ duration:0.25, repeat:Infinity }} />
              )}
            </motion.div>
          )}

          {particles.map(p => (
            <div key={p.id} className="absolute rounded-full pointer-events-none" style={{ left:p.x, top:p.y, width:p.size, height:p.size, background:p.color, opacity:p.life, boxShadow:`0 0 ${p.size+2}px ${p.color}` }} />
          ))}

          {explosions.map((exp,i) => (
            <motion.div key={exp.id} className="absolute pointer-events-none" style={{ left:exp.x, top:exp.y, zIndex:20 }}
              initial={{ scale:0.2, opacity:1, rotate:i===0?0:25 }} animate={{ scale:i===0?2.8:2.2, opacity:0, rotate:i===0?15:-20 }}
              transition={{ duration:i===0?0.7:0.55, ease:'easeOut' }}>
              <img src={`/GAME/explosioncloud${(i%2)+1}.svg`} alt="" style={{ width:72, height:72, filter:`drop-shadow(0 0 12px ${i===0?'#ff4500':'#ffd700'}) hue-rotate(${i===0?0:20}deg) brightness(3)` }} />
            </motion.div>
          ))}

          {screen === 'register' && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
              <motion.img src="/GAME/airplane.svg" alt="foguete" style={{ width:72, height:72, filter:'drop-shadow(0 0 16px #00d9ff)' }}
                animate={{ y:[-6,6,-6] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }} />
              <GameTitle size="lg" />
              <div style={{ fontFamily:'monospace', color:'#8899aa', fontSize:10, textAlign:'center', lineHeight:1.8 }}>
                Antes de decolar,<br />qual e o seu nome de piloto?
              </div>
              <div className="w-full flex flex-col gap-2">
                <input maxLength={14} value={nameInput} onChange={e => { setNameInput(e.target.value.toUpperCase()); setNameError(''); }}
                  onKeyDown={e => e.key==='Enter' && submitName()} placeholder="SEU NOME (max 14)" autoFocus
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, fontFamily:'monospace', fontSize:14, fontWeight:700, letterSpacing:3, background:'rgba(0,200,255,0.08)', border:'1px solid rgba(0,200,255,0.35)', color:'#00cfff', outline:'none', textAlign:'center', boxSizing:'border-box' }} />
                {nameError && <div style={{ fontFamily:'monospace', color:'#ff6b6b', fontSize:10, textAlign:'center' }}>{nameError}</div>}
                <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.2)', fontSize:9, textAlign:'right' }}>{nameInput.length}/14</div>
              </div>
              <motion.button onClick={submitName} className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm tracking-widest"
                style={{ background:'linear-gradient(135deg,#5227ff,#00d9ff)', color:'#fff', fontFamily:'monospace', boxShadow:'0 0 24px rgba(0,150,255,0.5)' }}
                whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}>
                <LogIn size={15} /> ENTRAR
              </motion.button>
            </motion.div>
          )}

          {screen === 'idle' && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-start gap-3 pt-7 pb-3 px-4 overflow-y-auto"
              style={{ scrollbarWidth:'none' }}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
              <motion.img src="/GAME/airplane.svg" alt="foguete" style={{ width:62, height:62, flexShrink:0, filter:'drop-shadow(0 0 16px #00d9ff)' }}
                animate={{ y:[-6,6,-6] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }} />
              <GameTitle size="lg" />
              <div style={{ fontFamily:'monospace', color:'#556677', fontSize:10 }}>
                BEM-VINDO, <span style={{ color:'#ffd700', textShadow:'0 0 8px #ffd700' }}>{playerName}</span>!
              </div>

              {/* ── CAMPO SOBRE ── */}
              <div style={{ width:'100%', background:'rgba(0,150,255,0.07)', border:'1px solid rgba(0,150,255,0.2)', borderRadius:14, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontFamily:'monospace', color:'#00cfff', fontSize:10, fontWeight:900, letterSpacing:2, textAlign:'center', textShadow:'0 0 8px #00cfff' }}>
                  📖 COMO JOGAR
                </div>

                {/* Naves */}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:2 }}>NAVES</div>
                  {[
                    { src:'/GAME/airplane.svg',         filter:'drop-shadow(0 0 6px #00d9ff)',                          label:'NORMAL',   desc:'Nave padrão. Desvie de tudo!',           color:'#00d9ff' },
                    { src:'/GAME/spaceShuttleBONUS.svg', filter:'drop-shadow(0 0 6px #ffd700) brightness(1.3)',          label:'BOOST',    desc:'Ativa ao pegar ⚡BONUS. Obstáculos não te machucam por 10s!', color:'#ffd700' },
                    { src:'/GAME/space1000bonus.svg',    filter:'drop-shadow(0 0 6px #ff00ff) drop-shadow(0 0 12px #aa00ff) brightness(1.3)', label:'LENDÁRIA', desc:'Desbloqueada ao atingir 1000pts!', color:'#ff00ff' },
                  ].map(n => (
                    <div key={n.label} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'6px 10px', border:`1px solid ${n.color}22` }}>
                      <img src={n.src} alt={n.label} style={{ width:30, height:30, flexShrink:0, filter:n.filter }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:n.color, letterSpacing:1 }}>{n.label}</div>
                        <div style={{ fontFamily:'monospace', fontSize:8, color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>{n.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Itens */}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:2 }}>ITENS & INIMIGOS</div>
                  {[
                    { src:'/GAME/BONUS.svg',   filter:'drop-shadow(0 0 8px #ffd700) brightness(1.5)', label:'⚡ BONUS',   desc:'Aparece a cada 150pts. Coleta para ativar BOOST 10s!',   color:'#ffd700' },
                    { src:'/GAME/ALIEN.svg',   filter:'drop-shadow(0 0 8px #00ff80) brightness(1.2)', label:'👾 ALIEN',   desc:'Aparece durante o BOOST para te desafiar. Cancela o boost e tira 1 vida!', color:'#00ff80' },
                    { src:'/GAME/meteor.svg',  filter:'drop-shadow(0 0 5px #ff6b00)',                 label:'☄️ METEOR',  desc:'Obstáculo principal. Causa 1 de dano.',                  color:'#ff6b00' },
                    { src:'/GAME/cloud.svg',   filter:'drop-shadow(0 0 5px #00cfff) brightness(1.2)', label:'☁️ NUVEM',  desc:'Obstáculo secundário. Causa 1 de dano.',                 color:'#00cfff' },
                  ].map(n => (
                    <div key={n.label} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'6px 10px', border:`1px solid ${n.color}22` }}>
                      <img src={n.src} alt={n.label} style={{ width:28, height:28, flexShrink:0, filter:n.filter }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:n.color, letterSpacing:1 }}>{n.label}</div>
                        <div style={{ fontFamily:'monospace', fontSize:8, color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>{n.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vidas */}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:2 }}>VIDAS</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,60,60,0.06)', borderRadius:10, padding:'8px 10px', border:'1px solid rgba(255,80,80,0.2)' }}>
                    <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                      {['❤️','❤️','❤️'].map((h,i) => <span key={i} style={{ fontSize:16 }}>{h}</span>)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:'#ff6b6b', letterSpacing:1 }}>3 VIDAS</div>
                      <div style={{ fontFamily:'monospace', fontSize:8, color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>Você aguenta 3 colisões. Na 3ª — game over! Após levar dano fica invencível por 1.5s.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3" style={{ flexShrink:0 }}>
                <motion.button onClick={startGame} className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm tracking-widest"
                  style={{ background:'linear-gradient(135deg,#5227ff,#00d9ff)', color:'#fff', fontFamily:'monospace', boxShadow:'0 0 24px rgba(0,150,255,0.5)' }}
                  whileHover={{ scale:1.08, boxShadow:'0 0 36px rgba(0,150,255,0.8)' }} whileTap={{ scale:0.95 }}>
                  <Play size={14} /> JOGAR
                </motion.button>
                <motion.button onClick={() => { setTable(loadTable()); setScreen('table'); }} className="flex items-center gap-2 px-4 py-3 rounded-xl font-black text-xs"
                  style={{ background:'rgba(255,215,0,0.1)', color:'#ffd700', fontFamily:'monospace', border:'1px solid rgba(255,215,0,0.3)' }}
                  whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}>
                  <Trophy size={13} /> TOP
                </motion.button>
              </div>
              {highScore > 0 && <div style={{ fontFamily:'monospace', color:'#ffd700', fontSize:10, flexShrink:0 }}>🏆 SEU RECORDE: {String(highScore).padStart(5,'0')}</div>}
              <motion.button onClick={switchPlayer}
                style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.3)', fontSize:9, background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 14px', cursor:'pointer', flexShrink:0 }}
                whileHover={{ color:'#00cfff', borderColor:'rgba(0,207,255,0.4)' }} whileTap={{ scale:0.95 }}>
                👤 TROCAR PILOTO
              </motion.button>
            </motion.div>
          )}

          {screen === 'dead' && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
              transition={{ delay:0.55, type:'spring', stiffness:180 }}>
              <motion.img src="/GAME/game-over-svgrepo-com.svg" alt="game over"
                style={{ width:105, height:105, filter:'drop-shadow(0 0 16px #ff4500) brightness(1.6) saturate(1.5)' }}
                initial={{ scale:0.3, rotate:-15 }} animate={{ scale:1, rotate:0 }}
                transition={{ delay:0.6, type:'spring', stiffness:200 }} />
              {isNewRecord && (
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.85, type:'spring' }}
                  style={{ fontFamily:'monospace', color:'#ffd700', fontSize:13, textShadow:'0 0 14px #ffd700', fontWeight:900 }}>
                  🏆 NOVO RECORDE!
                </motion.div>
              )}
              <div style={{ fontFamily:'monospace', color:'#fff', fontSize:16 }}>
                SCORE: <span style={{ color:'#00cfff', textShadow:'0 0 10px #00cfff' }}>{String(score).padStart(5,'0')}</span>
              </div>
              <div style={{ fontFamily:'monospace', color:'#556677', fontSize:10 }}>MELHOR: {String(highScore).padStart(5,'0')} · {playerName}</div>
              <div className="flex gap-2 mt-1 flex-wrap justify-center">
                <motion.button onClick={startGame} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-xs tracking-widest"
                  style={{ background:'linear-gradient(135deg,#5227ff,#00d9ff)', color:'#fff', fontFamily:'monospace' }}
                  whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}>
                  <RotateCcw size={12} /> DE NOVO
                </motion.button>
                <motion.button onClick={() => { setTable(loadTable()); setScreen('table'); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs"
                  style={{ background:'rgba(255,215,0,0.1)', color:'#ffd700', fontFamily:'monospace', border:'1px solid rgba(255,215,0,0.3)' }}
                  whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}>
                  <Trophy size={12} /> TOP 10
                </motion.button>
                <motion.button onClick={onClose} className="px-4 py-2.5 rounded-xl font-black text-xs"
                  style={{ background:'rgba(255,107,107,0.12)', color:'#ff6b6b', fontFamily:'monospace', border:'1px solid rgba(255,107,107,0.35)' }}
                  whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}>
                  SAIR
                </motion.button>
              </div>
              <motion.button onClick={switchPlayer}
                style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.3)', fontSize:9, background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 14px', cursor:'pointer' }}
                whileHover={{ color:'#00cfff', borderColor:'rgba(0,207,255,0.4)' }} whileTap={{ scale:0.95 }}>
                👤 TROCAR PILOTO
              </motion.button>
            </motion.div>
          )}

          {screen === 'table' && (
            <motion.div className="absolute inset-0 flex flex-col"
              initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }}
              transition={{ type:'spring', stiffness:200 }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom:'1px solid rgba(0,200,255,0.15)' }}>
                <div className="flex items-center gap-2" style={{ fontFamily:'monospace', color:'#ffd700', fontSize:14, fontWeight:900, textShadow:'0 0 10px #ffd700' }}>
                  <Trophy size={15} /> TOP 10 PILOTOS
                </div>
                <motion.button onClick={() => setScreen(score > 0 ? 'dead' : 'idle')}
                  style={{ fontFamily:'monospace', color:'#556677', fontSize:10, background:'none', border:'none', cursor:'pointer' }}
                  whileHover={{ color:'#fff' }}>← VOLTAR</motion.button>
              </div>
              <div className="flex px-4 py-1.5" style={{ fontFamily:'monospace', fontSize:9, color:'rgba(255,255,255,0.25)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ width:28 }}>#</span><span style={{ flex:1 }}>PILOTO</span>
                <span style={{ width:64, textAlign:'right' }}>SCORE</span><span style={{ width:60, textAlign:'right' }}>DATA</span>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:'none' }}>
                {table.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3" style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.25)', fontSize:11, textAlign:'center' }}>
                    <span style={{ fontSize:32 }}>🚀</span>Nenhum score ainda!<span style={{ fontSize:9 }}>Seja o primeiro piloto na lista</span>
                  </div>
                ) : table.map((entry,i) => {
                  const isPlayer = entry.name === playerName;
                  const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
                  const isTop3 = i < 3;
                  return (
                    <motion.div key={i} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                      className="flex items-center px-4 py-2.5"
                      style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background:isPlayer?'rgba(0,207,255,0.07)':isTop3?'rgba(255,215,0,0.03)':'transparent' }}>
                      <span style={{ width:28, fontFamily:'monospace', fontSize:isTop3?14:10, color:isTop3?'#ffd700':'rgba(255,255,255,0.3)' }}>{medal}</span>
                      <span style={{ flex:1, fontFamily:'monospace', fontSize:11, fontWeight:700, color:isPlayer?'#00cfff':isTop3?'#fff':'rgba(255,255,255,0.6)', textShadow:isPlayer?'0 0 8px #00cfff':'none' }}>
                        {entry.name}{isPlayer && <span style={{ color:'rgba(0,207,255,0.5)', fontSize:8 }}> ◀YOU</span>}
                      </span>
                      <span style={{ width:64, textAlign:'right', fontFamily:'monospace', fontSize:12, fontWeight:900, color:isTop3?'#ffd700':'#aaa', textShadow:isTop3?'0 0 6px #ffd700':'none' }}>{String(entry.score).padStart(5,'0')}</span>
                      <span style={{ width:60, textAlign:'right', fontFamily:'monospace', fontSize:8, color:'rgba(255,255,255,0.25)' }}>{entry.date}</span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center px-4 py-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <motion.button onClick={() => { setScreen('register'); setNameInput(playerName); }}
                  style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.25)', fontSize:9, background:'none', border:'none', cursor:'pointer' }}
                  whileHover={{ color:'#00cfff' }}>✏️ MUDAR NOME</motion.button>
                <motion.button onClick={startGame} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs"
                  style={{ background:'linear-gradient(135deg,#5227ff,#00d9ff)', color:'#fff', fontFamily:'monospace' }}
                  whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}>
                  <Play size={11} /> JOGAR
                </motion.button>
              </div>
            </motion.div>
          )}

          {screen === 'playing' && (
            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none"
              style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.12)', fontSize:8 }}>
              ← → TECLADO · TOQUE / ARRASTE NA TELA
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
