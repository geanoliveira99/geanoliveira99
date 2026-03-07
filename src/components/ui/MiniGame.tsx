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
interface Projectile { id: number; x: number; y: number; vy: number; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface Explosion { id: number; x: number; y: number; }
interface ScoreEntry { name: string; score: number; date: string; }
type ShipSkin = 'normal' | 'bonus' | 'elite';
type PlanetType = 'neptune' | 'saturn' | 'jupiter';
type DeathCause = 'blackhole' | 'jupiter' | 'saturn' | 'neptune' | 'alien' | 'projectile' | 'obstacle';
interface Planet { id: number; x: number; y: number; width: number; height: number; type: PlanetType; }
interface BlackHole { id: number; x: number; y: number; }
interface MoonItem { id: number; x: number; y: number; }
type Difficulty = 'normal' | 'apollo' | 'interestelar';

const GAME_WIDTH = 320, GAME_HEIGHT = 520, PLANE_W = 52, PLANE_H = 52, PLANE_Y = GAME_HEIGHT - 110;
const TB_KEY = 'skyDodgeTable', NM_KEY = 'skyDodgeName';
const MAX_TABLE = 10, LIVES = 3, MAX_LIVES = 7, BONUS_EVERY = 150, ELITE_SCORE = 1000, BONUS_SECS = 10;
const BONUS_STREAK_NEEDED = 4; // 4 bonus consecutivos = +1 vida
const BONUS_W = 38, BONUS_H = 38, ALIEN_W = 52, ALIEN_H = 40;
const PROJ_W = 22, PROJ_H = 22, PROJ_SCORE_START = 300;
const PLANET_SCORE_START = 100;
const PLANET_SIZES: Record<PlanetType, { w: number; h: number }> = {
  neptune: { w: 54, h: 54 },
  saturn:  { w: 72, h: 52 },
  jupiter: { w: 64, h: 64 },
};
const BH_W = 82, BH_H = 82, BH_EVERY = 75;
const MOON_W = 90, MOON_H = 90, MOON_EVERY = 500; // Lua a cada 500pts — MISSÃO LUNAR!
const FREEZE_SECS = 5; // segundos que o freeze dura
let oid = 0, pid = 0, eid = 0, bid = 0, aid = 0, prid = 0, plid = 0, bhid = 0, mnid = 0;

function loadTable(): ScoreEntry[] { try { return JSON.parse(localStorage.getItem(TB_KEY) || '[]'); } catch { return []; } }
function saveTable(t: ScoreEntry[]) { localStorage.setItem(TB_KEY, JSON.stringify(t.slice(0, MAX_TABLE))); }
function insertScore(name: string, score: number) { const t = loadTable(); t.push({ name, score, date: new Date().toLocaleDateString('pt-BR') }); t.sort((a, b) => b.score - a.score); saveTable(t); }

function useAudio(src: string, loop = false) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio(src); a.loop = loop; a.volume = loop ? 0.35 : 0.7; ref.current = a;
    return () => { a.pause(); a.src = ''; };
  }, [src, loop]);
  const play  = useCallback(() => { if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); } }, []);
  const stop  = useCallback(() => { if (ref.current) { ref.current.pause(); ref.current.currentTime = 0; } }, []);
  // Fade suave: fadeTo(targetVol, durationMs)
  const fadeTo = useCallback((targetVol: number, ms = 400) => {
    const a = ref.current; if (!a) return;
    const steps = 20, stepTime = ms / steps, delta = (targetVol - a.volume) / steps;
    let i = 0;
    const t = setInterval(() => {
      i++; a.volume = Math.max(0, Math.min(1, a.volume + delta));
      if (i >= steps) { a.volume = targetVol; clearInterval(t); if (targetVol === 0) a.pause(); }
    }, stepTime);
  }, []);
  const fadeIn  = useCallback((targetVol = 0.35, ms = 400) => {
    const a = ref.current; if (!a) return;
    a.volume = 0; a.play().catch(() => {}); fadeTo(targetVol, ms);
  }, [fadeTo]);
  return { play, stop, fadeTo, fadeIn };
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
  const [projectiles,  setProjectiles] = useState<Projectile[]>([]);
  const [planets,      setPlanets]     = useState<Planet[]>([]);
  const [blackHoles,   setBlackHoles]  = useState<BlackHole[]>([]);
  const [moonItems,    setMoonItems]   = useState<MoonItem[]>([]);
  const [showGuide,    setShowGuide]   = useState(false);
  const [bonusStreak,  setBonusStreak] = useState(0);
  const [extraLifeAnim,setExtraLifeAnim] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const [freezeTimeLeft,setFreezeTimeLeft] = useState(0);
  const [moonCollectAnim, setMoonCollectAnim] = useState(false);
  const [rpgStep,      setRpgStep]     = useState<number | null>(null); // null = fechado
  const [difficulty,   setDifficulty]  = useState<Difficulty>('normal');
  const [moonRpgActive, setMoonRpgActive] = useState(false);
  const rpgShownRef = useRef(false);       // evita duplo trigger no mesmo game over
  const gameOverCountRef = useRef(0);      // conta quantos game overs o usuário teve
  const deathCauseRef = useRef<DeathCause>('obstacle'); // causa da morte atual
  const difficultyRef = useRef<Difficulty>('normal');

  const bgMusic       = useAudio('/sounds/somDuranteJogo.mp3',     true);
  const sndBonusMusic = useAudio('/sounds/gamebonusanimado.mp3',   true);
  const sndBoom       = useAudio('/sounds/BombExplosion2segundos.mp3', false);
  const sndGameOver   = useAudio('/sounds/game-over.mp3',          false);
  const sndVidaExtra  = useAudio('/sounds/VIDA-EXTRA.mp3',         false);
  const sndGravidadeLuna = useAudio('/sounds/gravidadeluna.mp3',   false);

  const gameRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef(screen), scoreRef = useRef(score), livesRef = useRef(lives), planeXRef = useRef(planeX);
  const obstaclesRef = useRef(obstacles), bonusItemsRef = useRef(bonusItems), aliensRef = useRef(aliens);
  const bonusActiveRef = useRef(bonusActive), bonusTimerMs = useRef(0), lastBonusScore = useRef(-1);
  const invincRef = useRef(false), rafRef = useRef<number>(0), lastTimeRef = useRef(0);
  const spawnTimerRef = useRef(0), scoreTimerRef = useRef(0), alienTimerRef = useRef(0), projTimerRef = useRef(0);
  const projectilesRef = useRef(projectiles);
  const planetsRef = useRef(planets), blackHolesRef = useRef(blackHoles);
  const moonItemsRef = useRef(moonItems);
  const lastPlanetScore = useRef(-1), lastBHScore = useRef(-1), lastMoonScore = useRef(-1);
  const bonusStreakRef = useRef(0);
  const freezeActiveRef = useRef(false);
  const freezeTimerMs = useRef(0);
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
  useEffect(() => { projectilesRef.current = projectiles; }, [projectiles]);
  useEffect(() => { planetsRef.current = planets; }, [planets]);
  useEffect(() => { blackHolesRef.current = blackHoles; }, [blackHoles]);
  useEffect(() => { moonItemsRef.current = moonItems; }, [moonItems]);
  useEffect(() => { bonusStreakRef.current = bonusStreak; }, [bonusStreak]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // Música principal: fade in ao entrar em playing, fade out ao sair
  useEffect(() => {
    if (screen === 'playing') bgMusic.fadeIn(0.35, 500);
    else bgMusic.fadeTo(0, 500);
  }, [screen]); // eslint-disable-line

  // Música do boost: fade in ao ativar, fade out ao desativar
  useEffect(() => {
    if (bonusActive) {
      bgMusic.fadeTo(0, 350);
      sndBonusMusic.fadeIn(0.45, 350);
    } else {
      sndBonusMusic.fadeTo(0, 350);
      if (screen === 'playing') bgMusic.fadeIn(0.35, 400);
    }
  }, [bonusActive]); // eslint-disable-line

  useEffect(() => {
    if (bonusActive) setShipSkin('bonus');
    else if (score >= ELITE_SCORE) setShipSkin('elite');
    else setShipSkin('normal');
  }, [bonusActive, score]);

  const getShipSrc = (skin: ShipSkin) => skin === 'bonus' ? '/GAME/spaceShuttleBONUS.svg' : skin === 'elite' ? '/GAME/space1000bonus.svg' : '/GAME/airplane.svg';
  const getDiffOffset = (d: Difficulty) => d === 'interestelar' ? 300 : d === 'apollo' ? 150 : 0;
  const getSpeed = (s: number, d?: Difficulty) => 2.8 + Math.floor((s + getDiffOffset(d ?? difficultyRef.current)) / 100) * 0.9;
  const getSpawnInterval = (s: number, d?: Difficulty) => Math.max(880 - Math.floor((s + getDiffOffset(d ?? difficultyRef.current)) / 50) * 55, 320);
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

  // Projétil: spawna em x aleatório no TOPO e desce reto em alta velocidade
  const spawnProjectile = useCallback(() => {
    const margin = 10;
    const x = margin + Math.random() * (GAME_WIDTH - PROJ_W - margin * 2);
    // velocidade base 7, cresce levemente com score
    const vy = 7 + Math.floor(scoreRef.current / 200) * 1.2;
    setProjectiles(prev => [...prev, { id: prid++, x, y: -PROJ_H - 5, vy }]);
  }, []);

  // Planeta: spawn a cada 100pts, alterna entre neptune/saturn/jupiter
  // neptune=25%, saturn=37.5%, jupiter=37.5% — os gigantes aparecem mais!
  const spawnPlanet = useCallback(() => {
    const r = Math.random();
    const type: PlanetType = r < 0.25 ? 'neptune' : r < 0.625 ? 'saturn' : 'jupiter';
    const { w, h } = PLANET_SIZES[type];
    const margin = 8;
    const x = margin + Math.random() * (GAME_WIDTH - w - margin * 2);
    setPlanets(prev => [...prev, { id: plid++, x, y: -h - 5, width: w, height: h, type }]);
  }, []);

  // Buraco Negro: spawn a cada 75pts — mata instantaneamente, sem perdão
  const spawnBlackHole = useCallback(() => {
    const margin = 8;
    const x = margin + Math.random() * (GAME_WIDTH - BH_W - margin * 2);
    setBlackHoles(prev => [...prev, { id: bhid++, x, y: -BH_H - 5 }]);
  }, []);

  // 🌕 Lua — aparece a cada 500pts, coletável, dá +2 vidas e FREEZE 5s
  const spawnMoon = useCallback(() => {
    const margin = 12;
    const x = margin + Math.random() * (GAME_WIDTH - MOON_W - margin * 2);
    setMoonItems(prev => [...prev, { id: mnid++, x, y: -MOON_H - 5 }]);
  }, []);

  const triggerExplosion = useCallback((px: number, py: number, big = true) => {
    sndBoom.play();
    const colors = ['#ff4500','#ff8c00','#ffd700','#ff0000','#fff'];
    setParticles(prev => [...prev, ...Array.from({ length: big ? 26 : 12 }).map(() => ({ id: pid++, x: px + PLANE_W / 2, y: py + PLANE_H / 2, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9, life: 1, color: colors[Math.floor(Math.random() * colors.length)], size: 3 + Math.random() * 5 }))]);
    if (big) setExplosions([{ id: eid++, x: px - 12, y: py - 12 }, { id: eid++, x: px + 18, y: py + 8 }]);
    else setExplosions([{ id: eid++, x: px - 8, y: py - 8 }]);
  }, [sndBoom]);

  const takeDamage = useCallback((px: number, py: number, finalScore: number, dmg = 1) => {
    const newLives = livesRef.current - dmg;
    if (newLives <= 0) {
      triggerExplosion(px, py, true);
      bgMusic.fadeTo(0, 600);
      sndBonusMusic.fadeTo(0, 300);
      sndGameOver.play();
      setShake(true); setTimeout(() => setShake(false), 500); setLives(0);
      setBonusStreak(0); bonusStreakRef.current = 0; setExtraLifeAnim(false);
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
      setProjectiles([]); projectilesRef.current = [];
      setPlanets([]); planetsRef.current = [];
      setBlackHoles([]); blackHolesRef.current = [];
      setMoonItems([]); moonItemsRef.current = [];
      // Reseta timers de spawn para evitar burst imediato de obstáculos
      spawnTimerRef.current = 0; projTimerRef.current = 0; alienTimerRef.current = 0;
      setBonusStreak(0); bonusStreakRef.current = 0;
    }
  }, [triggerExplosion, bgMusic, sndBonusMusic, sndGameOver]);

  const loop = useCallback((time: number) => {
    if (screenRef.current !== 'playing') return;
    const delta = Math.min(time - lastTimeRef.current, 50);
    lastTimeRef.current = time;
    const speed = getSpeed(scoreRef.current);

    setObstacles(prev => { const next = prev.map(o => ({ ...o, y: o.y + (freezeActiveRef.current ? 0 : speed) })).filter(o => o.y < GAME_HEIGHT + 60); obstaclesRef.current = next; return next; });
    setBonusItems(prev => { const next = prev.map(b => ({ ...b, y: b.y + (freezeActiveRef.current ? 0 : speed * 0.7) })).filter(b => b.y < GAME_HEIGHT + 60); bonusItemsRef.current = next; return next; });
    setAliens(prev => { const next = prev.map(a => ({ ...a, y: a.y + (freezeActiveRef.current ? 0 : speed * 1.1) })).filter(a => a.y < GAME_HEIGHT + 60); aliensRef.current = next; return next; });
    setProjectiles(prev => { const next = prev.map(p => ({ ...p, y: p.y + (freezeActiveRef.current ? 0 : p.vy) })).filter(p => p.y < GAME_HEIGHT + 40); projectilesRef.current = next; return next; });
    setPlanets(prev => { const next = prev.map(pl => ({ ...pl, y: pl.y + (freezeActiveRef.current ? 0 : speed * 0.85) })).filter(pl => pl.y < GAME_HEIGHT + 80); planetsRef.current = next; return next; });
    setBlackHoles(prev => { const next = prev.map(bh => ({ ...bh, y: bh.y + (freezeActiveRef.current ? 0 : speed * 0.65) })).filter(bh => bh.y < GAME_HEIGHT + 90); blackHolesRef.current = next; return next; });
    // Lua desce sempre (não é obstáculo, não é afetada pelo freeze)
    setMoonItems(prev => { const next = prev.map(m => ({ ...m, y: m.y + speed * 0.45 })).filter(m => m.y < GAME_HEIGHT + 100); moonItemsRef.current = next; return next; });

    scoreTimerRef.current += delta;
    if (scoreTimerRef.current >= 100) { scoreTimerRef.current = 0; setScore(s => s + 1); }

    spawnTimerRef.current += delta;
    if (spawnTimerRef.current >= getSpawnInterval(scoreRef.current)) { spawnTimerRef.current = 0; spawnObstacle(); }

    if (scoreRef.current > 50) {
      alienTimerRef.current += delta;
      const alienInterval = Math.max(8000 - Math.floor(scoreRef.current / 100) * 500, 4000);
      if (alienTimerRef.current >= alienInterval) { alienTimerRef.current = 0; spawnAlien(); }
    }

    // Projéteis a partir de 300pts — intervalo diminui com score
    if (scoreRef.current >= PROJ_SCORE_START) {
      projTimerRef.current += delta;
      const projInterval = Math.max(3200 - Math.floor((scoreRef.current - PROJ_SCORE_START) / 100) * 300, 1200);
      if (projTimerRef.current >= projInterval) { projTimerRef.current = 0; spawnProjectile(); }
    }

    // Planetas a cada 100pts — obstáculos de elite
    const planetThreshold = Math.floor(scoreRef.current / PLANET_SCORE_START);
    if (scoreRef.current >= PLANET_SCORE_START && planetThreshold > lastPlanetScore.current) {
      lastPlanetScore.current = planetThreshold; spawnPlanet();
    }

    // Buraco Negro a cada 75pts — MORTE INSTANTÂNEA
    const bhThreshold = Math.floor(scoreRef.current / BH_EVERY);
    if (scoreRef.current >= BH_EVERY && bhThreshold > lastBHScore.current) {
      lastBHScore.current = bhThreshold; spawnBlackHole();
    }

    // 🌕 Lua a cada 500pts
    const moonThreshold = Math.floor(scoreRef.current / MOON_EVERY);
    if (scoreRef.current >= MOON_EVERY && moonThreshold > lastMoonScore.current) {
      lastMoonScore.current = moonThreshold; spawnMoon();
    }

    const bonusThreshold = Math.floor(scoreRef.current / BONUS_EVERY);
    if (bonusThreshold > lastBonusScore.current && !bonusActiveRef.current) { lastBonusScore.current = bonusThreshold; spawnBonus(); }

    if (bonusActiveRef.current) {
      bonusTimerMs.current -= delta;
      if (bonusTimerMs.current <= 0) { bonusTimerMs.current = 0; setBonusActive(false); bonusActiveRef.current = false; setBonusTimeLeft(0); }
      else setBonusTimeLeft(Math.ceil(bonusTimerMs.current / 1000));
    }

    // ❄️ Freeze timer — conta regressiva do congelamento
    if (freezeActiveRef.current) {
      freezeTimerMs.current -= delta;
      if (freezeTimerMs.current <= 0) {
        freezeTimerMs.current = 0;
        freezeActiveRef.current = false;
        setFreezeActive(false);
        setFreezeTimeLeft(0);
        // 🧹 Limpa TODOS os obstáculos ao terminar o freeze para evitar burst
        setObstacles([]); obstaclesRef.current = [];
        setAliens([]); aliensRef.current = [];
        setProjectiles([]); projectilesRef.current = [];
        setPlanets([]); planetsRef.current = [];
        setBlackHoles([]); blackHolesRef.current = [];
        // Reseta spawn timer para dar um respiro antes do próximo obstáculo
        spawnTimerRef.current = 0;
        alienTimerRef.current = 0;
        projTimerRef.current = 0;
        // Fecha popup lunar e para som
        setMoonRpgActive(false);
        sndGravidadeLuna.stop();
      } else {
        setFreezeTimeLeft(Math.ceil(freezeTimerMs.current / 1000));
      }
    }

    const px = planeXRef.current, py = PLANE_Y, hb = 13;

    // Colisão obstáculos — ignorada com bônus ativo ou invencível
    if (!invincRef.current && !bonusActiveRef.current) {
      for (const o of obstaclesRef.current) {
        const ox = (o.x / 100) * GAME_WIDTH;
        if (px + hb < ox + o.width - hb && px + PLANE_W - hb > ox + hb && py + hb < o.y + o.height - hb && py + PLANE_H - hb > o.y + hb) {
          deathCauseRef.current = 'obstacle';
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
        // Streak de bonus: 4 seguidos = +1 vida (máx 7)
        const newStreak = bonusStreakRef.current + 1;
        if (newStreak >= BONUS_STREAK_NEEDED) {
          bonusStreakRef.current = 0; setBonusStreak(0);
          const currentLives = livesRef.current;
          const gained = Math.min(currentLives + 1, MAX_LIVES);
          if (gained > currentLives) {
            livesRef.current = gained;
            setLives(gained);
            sndVidaExtra.play();
            setExtraLifeAnim(true);
            setTimeout(() => setExtraLifeAnim(false), 2200);
          }
        } else {
          bonusStreakRef.current = newStreak; setBonusStreak(newStreak);
        }
        setParticles(prev => [...prev, ...Array.from({ length: 18 }).map(() => ({ id: pid++, x: b.x + BONUS_W / 2, y: b.y + BONUS_H / 2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 1, color: ['#ffd700','#fff700','#ffaa00','#fff'][Math.floor(Math.random() * 4)], size: 3 + Math.random() * 4 }))]);
      } else remaining.push(b);
    }
    if (collected) { setBonusItems(remaining); bonusItemsRef.current = remaining; }

    if (!invincRef.current) {
      for (const a of aliensRef.current) {
        if (px + hb < a.x + a.width - hb && px + PLANE_W - hb > a.x + hb && py + hb < a.y + a.height - hb && py + PLANE_H - hb > a.y + hb) {
          if (bonusActiveRef.current) { setBonusActive(false); bonusActiveRef.current = false; bonusTimerMs.current = 0; setBonusTimeLeft(0); }
          setAliens(prev => prev.filter(x => x.id !== a.id)); aliensRef.current = aliensRef.current.filter(x => x.id !== a.id);
          deathCauseRef.current = 'alien';
          takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
      }
    }

    // Colisão projéteis — ignorada com bônus ativo ou invencível
    if (!invincRef.current && !bonusActiveRef.current) {
      for (const pr of projectilesRef.current) {
        const hbp = 6;
        if (px + hbp < pr.x + PROJ_W - hbp && px + PLANE_W - hbp > pr.x + hbp && py + hbp < pr.y + PROJ_H - hbp && py + PLANE_H - hbp > pr.y + hbp) {
          setProjectiles(prev => prev.filter(x => x.id !== pr.id)); projectilesRef.current = projectilesRef.current.filter(x => x.id !== pr.id);
          deathCauseRef.current = 'projectile';
          takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
      }
    }

    // Colisão planetas — Jupiter e Saturn tiram 2 vidas! Neptune tira 1.
    if (!invincRef.current && !bonusActiveRef.current) {
      for (const pl of planetsRef.current) {
        const hbp = 10;
        if (px + hbp < pl.x + pl.width - hbp && px + PLANE_W - hbp > pl.x + hbp && py + hbp < pl.y + pl.height - hbp && py + PLANE_H - hbp > pl.y + hbp) {
          setPlanets(prev => prev.filter(x => x.id !== pl.id)); planetsRef.current = planetsRef.current.filter(x => x.id !== pl.id);
          const dmg = (pl.type === 'jupiter' || pl.type === 'saturn') ? 2 : 1;
          deathCauseRef.current = pl.type as DeathCause;
          takeDamage(px, py, scoreRef.current, dmg);
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
      }
    }

    // 🌕 Colisão Lua — COLETÁVEL! +2 vidas + FREEZE 5s em todos os obstáculos
    for (const mn of moonItemsRef.current) {
      const hbm = 8;
      if (px + hbm < mn.x + MOON_W - hbm && px + PLANE_W - hbm > mn.x + hbm && py + hbm < mn.y + MOON_H - hbm && py + PLANE_H - hbm > mn.y + hbm) {
        setMoonItems([]); moonItemsRef.current = [];
        // +2 vidas (máx 7)
        const currentLives = livesRef.current;
        const gained = Math.min(currentLives + 2, MAX_LIVES);
        livesRef.current = gained; setLives(gained);
        // FREEZE — congela todos os obstáculos por FREEZE_SECS
        freezeActiveRef.current = true; setFreezeActive(true);
        freezeTimerMs.current = FREEZE_SECS * 1000; setFreezeTimeLeft(FREEZE_SECS);
        // Animação de coleta + popup RPG lunar + som
        setMoonCollectAnim(true);
        setTimeout(() => setMoonCollectAnim(false), 2800);
        setMoonRpgActive(true);
        sndGravidadeLuna.play();
        // Partículas brancas/prata em abundância
        setParticles(prev => [...prev, ...Array.from({ length: 28 }).map(() => ({
          id: pid++, x: mn.x + MOON_W / 2, y: mn.y + MOON_H / 2,
          vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
          life: 1, color: ['#ffffff','#ccddff','#aabbff','#e0f0ff'][Math.floor(Math.random() * 4)],
          size: 3 + Math.random() * 5,
        }))]);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
    }

    // Colisão Buraco Negro — MORTE INSTANTÂNEA: ignora bônus, invencibilidade e vidas!
    for (const bh of blackHolesRef.current) {
      const hbBH = 14;
      if (px + hbBH < bh.x + BH_W - hbBH && px + PLANE_W - hbBH > bh.x + hbBH && py + hbBH < bh.y + BH_H - hbBH && py + PLANE_H - hbBH > bh.y + hbBH) {
        // Força lives para 1 antes de takeDamage → garante game over
        livesRef.current = 1; setLives(1);
        setBonusActive(false); bonusActiveRef.current = false; bonusTimerMs.current = 0;
        invincRef.current = false; setInvincible(false);
        setBlackHoles([]); blackHolesRef.current = [];
        deathCauseRef.current = 'blackhole';
        takeDamage(px, py, scoreRef.current);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
    }

    setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.18, life: p.life - 0.035 })).filter(p => p.life > 0));
    rafRef.current = requestAnimationFrame(loop);
  }, [spawnObstacle, spawnBonus, spawnAlien, spawnProjectile, spawnPlanet, spawnBlackHole, spawnMoon, triggerExplosion, takeDamage, sndVidaExtra, sndGravidadeLuna]);

  useEffect(() => {
    if (screen === 'playing') { lastTimeRef.current = performance.now(); rafRef.current = requestAnimationFrame(loop); }
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen, loop]);

  const startGame = useCallback(() => {
    setObstacles([]); setParticles([]); setExplosions([]); setBonusItems([]); setAliens([]); setProjectiles([]);
    setPlanets([]); setBlackHoles([]); setMoonItems([]); moonItemsRef.current = [];
    setScore(0); setPlaneX(GAME_WIDTH / 2 - PLANE_W / 2); setLives(LIVES);
    setBonusActive(false); setBonusTimeLeft(0); setIsNewRecord(false); setShipSkin('normal');
    setInvincible(false); invincRef.current = false;
    bonusActiveRef.current = false; bonusTimerMs.current = 0; lastBonusScore.current = -1;
    alienTimerRef.current = 0; spawnTimerRef.current = 0; scoreTimerRef.current = 0; projTimerRef.current = 0;
    projectilesRef.current = []; planetsRef.current = []; blackHolesRef.current = [];
    lastPlanetScore.current = -1; lastBHScore.current = -1; lastMoonScore.current = -1;
    freezeActiveRef.current = false; freezeTimerMs.current = 0;
    setFreezeActive(false); setFreezeTimeLeft(0); setMoonCollectAnim(false);
    setBonusStreak(0); bonusStreakRef.current = 0; setExtraLifeAnim(false);
    rpgShownRef.current = false; setRpgStep(null);
    setMoonRpgActive(false);
    setScreen('playing');  }, []);

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
    bgMusic.fadeTo(0, 300); sndBonusMusic.fadeTo(0, 300); cancelAnimationFrame(rafRef.current);
    setObstacles([]); setParticles([]); setExplosions([]); setBonusItems([]); setAliens([]);
    setScore(0); setNameInput(''); setNameError('');
    localStorage.removeItem(NM_KEY); setPlayerName(''); setHighScore(0);
    setLives(LIVES); setBonusActive(false); setBonusTimeLeft(0);
    setScreen('register');
  };

  const shipSrc = getShipSrc(shipSkin);

  // ─── Diálogos RPG — organizados por causa da morte ───────────────────────────

  // Grupos para morte por BURACO NEGRO (rotativo entre si)
  const RPG_BLACKHOLE_GROUPS = [
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Piloto... você foi tragado por um Buraco Negro. Isso não é metáfora — é física. A gravidade dele dobra o espaço-tempo em volta, nada que entra sai.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'E o pior: bônus, invencibilidade, escudo — NADA funciona contra ele. Um buraco negro real tem até 10 bilhões de massas solares. O nosso campo simulado usa a mesma regra.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'TÁTICA: quando o halo branco-amarelo aparecer na tela, mude de rota IMEDIATAMENTE. Ele se move mais devagar — use isso a seu favor. Nunca confie no bônus contra ele.' },
    ],
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Buraco Negro de novo? Houston registrou. Esses objetos emitem radiação Hawking — são quentes por fora e absolutamente letais por dentro. Nisso o jogo é fiel à ciência.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'O halo pulsante dourado é o Horizonte de Eventos — a linha de não-retorno. Cruzou? Acabou. Não tem como escapar depois que entrou na zona de colisão.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Memorize o lado da tela onde ele surgiu e fuja pro lado oposto. É o único protocolo válido contra um Buraco Negro. Sem exceções. Decola com cuidado.' },
    ],
  ];

  // Grupos para morte por JÚPITER ou SATURNO (rotativo entre si)
  const RPG_GIANT_GROUPS = [
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Atingido por um gigante gasoso. Júpiter e Saturno são os maiores planetas do sistema — DANO DUPLO garantido. Com 2 corações ou menos, é fim de missão.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Júpiter: laranja-avermelhado, 318 vezes a massa da Terra. Saturno: amarelado com anel, único planeta menos denso que a água. Ambos letais em colisão.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'ESTRATÉGIA: acumule corações via streak de 4 BONUS seguidos. Com 5+ corações, você sobrevive ao dano duplo. É a única margem de segurança contra esses gigantes.' },
    ],
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'De novo os gigantes. Piloto, Saturno tem 146 luas e anéis de gelo — belíssimo de longe, devastador de perto. Júpiter tem a Grande Mancha Vermelha: tempestade de 400 anos.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Eles se movem mais devagar que meteoros, mas o dano duplo compensa. Identifique cedo, desvie cedo. Não tente passar "entre" eles e a borda — margem zero.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Cada 4 BONUS seguidos = +1 vida (máx 7). Essa é a chave. Mais corações = mais margem pra sobreviver Júpiter e Saturno. Avante.' },
    ],
  ];

  // Grupos gerais — para mortes por meteoro, nuvem, alien, projétil, Netuno
  const RPG_GENERAL_GROUPS = [
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Astronauta... missão comprometida. Recebemos o sinal de ejeção. Você foi atingido. Mas a NASA não abandona seus pilotos.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'ALERTA: Júpiter e Saturno causam DANO DUPLO. Buraco Negro = morte instantânea. Netuno (azul) é normal — 1 coração apenas, como meteoros e aliens.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'DICA: colete 4x⚡BONUS seguidos — aquela pilha dourada no HUD — e a base manda VIDA EXTRA. Agora decola. Houston aguarda.' },
    ],
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Piloto, análise do campo: Netuno é o planeta mais ventoso do sistema solar — 2.100 km/h. No jogo ele só tira 1 coração. Use-o como treino de reflexo.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Hierarquia de ameaças: Buraco Negro (instant kill) > Júpiter/Saturno (dano duplo) > aliens/projéteis/meteoros/Netuno (1 coração). Priorize o desvio pelo risco.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'O streak de bônus requer 4 coletas SEM tomar dano. Se levar um golpe, a pilha zera. Planeje as rotas para pegar bônus sem se expor. Houston acredita em você.' },
    ],
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Debrief rápido: a cada 150 pontos um BONUS aparece. A cada 75 pontos pode aparecer um Buraco Negro. A cada 100 pontos surge um planeta.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Os aliens disparam projéteis a partir de 300 pontos. Quanto mais você pontua, mais rápido o campo fica. Ritmo e antecipação são mais importantes que velocidade de reação.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Você tem até 7 corações se manter o streak. Com 7 corações você sobrevive a 3 colisões com gigantes seguidas. Esse é o estado ideal de missão. Força, piloto.' },
    ],
  ];

  // Seleciona o grupo correto baseado na causa da morte + contagem de game overs
  const cause = deathCauseRef.current;
  let RPG_LINES: { speaker: string; avatar: string; text: string }[];
  if (cause === 'blackhole') {
    const bhCount = gameOverCountRef.current; // já incrementado
    RPG_LINES = RPG_BLACKHOLE_GROUPS[(bhCount - 1) % RPG_BLACKHOLE_GROUPS.length];
  } else if (cause === 'jupiter' || cause === 'saturn') {
    const giantCount = gameOverCountRef.current;
    RPG_LINES = RPG_GIANT_GROUPS[(giantCount - 1) % RPG_GIANT_GROUPS.length];
  } else {
    // neptune, alien, projectile, obstacle — grupos gerais
    const genCount = gameOverCountRef.current;
    RPG_LINES = RPG_GENERAL_GROUPS[(genCount - 1) % RPG_GENERAL_GROUPS.length];
  }

  // Abre o diálogo RPG em todo game over
  useEffect(() => {
    if (screen === 'dead' && !rpgShownRef.current) {
      rpgShownRef.current = true;
      gameOverCountRef.current += 1;
      setTimeout(() => setRpgStep(0), 1100);
    }
  }, [screen]); // eslint-disable-line

  const advanceRpg = () => {
    setRpgStep(prev => {
      if (prev === null) return null;
      if (prev >= RPG_LINES.length - 1) return null;
      return prev + 1;
    });
  };

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
              <div className="flex gap-1 items-center flex-wrap justify-center" style={{ maxWidth:100 }}>
                {Array.from({ length: lives }).map((_,i) => (
                  <motion.span key={i}
                    initial={i === lives - 1 && extraLifeAnim ? { scale: 2.2, opacity: 0 } : false}
                    animate={i === lives - 1 && extraLifeAnim ? { scale: 1, opacity: 1 } : {}}
                    transition={{ type:'spring', stiffness:260, damping:14 }}
                    style={{ fontSize:11, filter:'drop-shadow(0 0 4px #ff4444)' }}>❤️</motion.span>
                ))}
              </div>
              <div style={{ fontFamily:'monospace', color:'#ffd700', fontSize:11, textShadow:'0 0 6px #ffd700' }}>{String(highScore).padStart(5,'0')}</div>
            </div>
          )}

          {/* Barra streak 3D — posição independente, abaixo do LV */}
          {screen === 'playing' && (
            <div className="absolute z-10 pointer-events-none"
              style={{ top:52, left:0, right:0, display:'flex', justifyContent:'center' }}>
              <div style={{ display:'flex', gap:3, alignItems:'flex-end' }}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const filled = i < bonusStreak;
                  return (
                    <motion.div key={i}
                      animate={filled ? { boxShadow:['0 0 4px #ffd700','0 0 10px #ffaa00','0 0 4px #ffd700'] } : {}}
                      transition={{ duration:1.1, repeat:Infinity, ease:'easeInOut' }}
                      style={{
                        width: 9, height: 13 + i * 2, borderRadius: 2,
                        background: filled
                          ? 'linear-gradient(180deg, #fff7aa 0%, #ffd700 35%, #ff9900 75%, #cc6600 100%)'
                          : 'rgba(255,255,255,0.08)',
                        border: filled ? '1px solid rgba(255,200,0,0.7)' : '1px solid rgba(255,255,255,0.12)',
                        boxShadow: filled ? '0 0 6px #ffd700, inset 0 1px 0 rgba(255,255,255,0.4)' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        position: 'relative',
                      }}>
                      {filled && <div style={{ position:'absolute', top:1, left:1, right:1, height:3, borderRadius:1, background:'rgba(255,255,255,0.45)' }} />}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Animação +1 vida extra */}
          <AnimatePresence>
            {extraLifeAnim && (
              <motion.div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
                {/* flash de fundo */}
                <motion.div className="absolute inset-0"
                  initial={{ opacity:0.35 }} animate={{ opacity:0 }} transition={{ duration:1.2 }}
                  style={{ background:'radial-gradient(circle at 50% 50%, rgba(255,100,100,0.5) 0%, transparent 70%)' }} />
                <motion.div
                  initial={{ scale:0.4, y:20, opacity:0 }}
                  animate={{ scale:[0.4,1.4,1], y:[20,-10,0], opacity:[0,1,1] }}
                  exit={{ y:-40, opacity:0, scale:0.8 }}
                  transition={{ duration:0.55, times:[0,0.5,1], ease:'easeOut' }}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:46, lineHeight:1, filter:'drop-shadow(0 0 18px #ff6666) drop-shadow(0 0 32px #ff0000)' }}>❤️</div>
                  <div style={{ fontFamily:'monospace', fontWeight:900, fontSize:18, color:'#ff6b6b', textShadow:'0 0 14px #ff4444, 0 0 28px #ff0000', letterSpacing:3 }}>+1 VIDA!</div>
                  <div style={{ fontFamily:'monospace', fontSize:9, color:'rgba(255,150,150,0.7)', letterSpacing:2 }}>4 BONUS SEGUIDOS</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {screen === 'playing' && bonusActive && (
            <motion.div className="absolute z-10 pointer-events-none" style={{ top:28, left:0, right:0, display:'flex', justifyContent:'center' }} initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
              <div style={{ fontFamily:'monospace', fontSize:10, fontWeight:900, color:'#ffd700', textShadow:'0 0 10px #ffd700', background:'rgba(255,215,0,0.12)', border:'1px solid rgba(255,215,0,0.4)', borderRadius:8, padding:'2px 10px', letterSpacing:2 }}>
                ⚡ BOOST {bonusTimeLeft}s
              </div>
            </motion.div>
          )}
          {screen === 'playing' && !bonusActive && (
            <div className="absolute z-10 pointer-events-none" style={{ top:28, left:0, right:0, display:'flex', justifyContent:'center' }}>
              <div style={{ fontFamily:'monospace', color:'#7c6fff', fontSize:10, textShadow:'0 0 6px #7c6fff', display:'flex', gap:6, alignItems:'center' }}>
                LV{level}
                {difficulty !== 'normal' && (
                  <img
                    src={difficulty === 'apollo' ? '/GAME/nivel-apollo.svg' : '/GAME/nivel-interstelar.svg'}
                    alt={difficulty}
                    style={{ width:14, height:14, objectFit:'contain', filter: difficulty === 'interestelar' ? 'drop-shadow(0 0 4px #ff3333)' : 'drop-shadow(0 0 4px #ffd700)' }}
                  />
                )}
              </div>
            </div>
          )}

          {obstacles.map(o => (
            <div key={o.id} className="absolute pointer-events-none" style={{ left:`${o.x}%`, top:o.y, width:o.width, height:o.height }}>
              <img src={`/GAME/${o.type==='meteor'?'meteor':'cloud'}.svg`} alt="" style={{ width:'100%', height:'100%', filter: o.type==='meteor'?'drop-shadow(0 0 6px #ff6b00)':'drop-shadow(0 0 4px #00cfff) brightness(1.3)' }} />
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

          {projectiles.map(pr => (
            <motion.div key={pr.id} className="absolute pointer-events-none" style={{ left:pr.x, top:pr.y, width:PROJ_W, height:PROJ_H, zIndex:7 }}
              animate={{ scale:[1, 1.2, 1], opacity:[1, 0.8, 1] }} transition={{ duration:0.4, repeat:Infinity, ease:'easeInOut' }}>
              <img src="/GAME/ALIEN.svg" alt="tiro" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 6px #cc00ff) drop-shadow(0 0 14px #7700ff) hue-rotate(200deg) brightness(1.6) saturate(2)' }} />
            </motion.div>
          ))}

          {/* Planetas — obstáculos elite a cada 100pts */}
          {planets.map(pl => {
            const filters: Record<PlanetType, string> = {
              neptune: 'drop-shadow(0 0 10px #4488ff) drop-shadow(0 0 22px #2244cc) brightness(1.15)',
              saturn:  'drop-shadow(0 0 10px #ffcc66) drop-shadow(0 0 22px #cc8800) brightness(1.1)',
              jupiter: 'drop-shadow(0 0 10px #ff9944) drop-shadow(0 0 22px #cc5500) brightness(1.1)',
            };
            return (
              <div key={pl.id} className="absolute pointer-events-none"
                style={{ left:pl.x, top:pl.y, width:pl.width, height:pl.height, zIndex:6 }}>
                <img src={`/GAME/${pl.type}.svg`} alt={pl.type} style={{ width:'100%', height:'100%', filter:filters[pl.type] }} />
              </div>
            );
          })}

          {/* Buraco Negro — morte instantânea */}
          {blackHoles.map(bh => (
            <div key={bh.id} className="absolute pointer-events-none"
              style={{ left:bh.x, top:bh.y, width:BH_W, height:BH_H, zIndex:9 }}>
              {/* Halo de luz pulsando */}
              <motion.div className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ opacity:[0.55,1,0.55], boxShadow:[
                  '0 0 18px 8px rgba(255,255,200,0.55), 0 0 40px 18px rgba(255,220,0,0.35)',
                  '0 0 38px 18px rgba(255,255,255,0.95), 0 0 70px 32px rgba(255,230,0,0.7)',
                  '0 0 18px 8px rgba(255,255,200,0.55), 0 0 40px 18px rgba(255,220,0,0.35)',
                ] }}
                transition={{ duration:0.75, repeat:Infinity, ease:'easeInOut' }}
                style={{ borderRadius:'50%' }} />
              <img src="/GAME/black-hole.svg" alt="buraco negro"
                style={{ width:'100%', height:'100%', position:'relative', zIndex:1,
                  filter:'drop-shadow(0 0 12px #fffde0) drop-shadow(0 0 28px #ffd700) brightness(1.25)' }} />
            </div>
          ))}

          {/* 🌕 Lua — coletável, aparece a cada 500pts */}
          {moonItems.map(mn => (
            <div key={mn.id} className="absolute pointer-events-none"
              style={{ left:mn.x, top:mn.y, width:MOON_W, height:MOON_H, zIndex:10 }}>
              {/* Halo suave prateado pulsando */}
              <motion.div className="absolute inset-0 pointer-events-none"
                animate={{ opacity:[0.4,0.85,0.4], boxShadow:[
                  '0 0 22px 10px rgba(200,220,255,0.35), 0 0 50px 20px rgba(180,200,255,0.18)',
                  '0 0 42px 20px rgba(220,235,255,0.70), 0 0 80px 35px rgba(200,215,255,0.40)',
                  '0 0 22px 10px rgba(200,220,255,0.35), 0 0 50px 20px rgba(180,200,255,0.18)',
                ] }}
                transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
                style={{ borderRadius:'50%' }} />
              <motion.img
                src="/GAME/MoonVideoGIF.gif"
                alt="lua missao lunar"
                animate={{ y:[0,-6,0] }}
                transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:'100%', height:'100%', borderRadius:'50%', position:'relative', zIndex:1,
                  filter:'drop-shadow(0 0 16px rgba(200,220,255,0.8)) drop-shadow(0 0 32px rgba(150,180,255,0.5)) brightness(1.1)' }}
              />
              {/* Label flutuante */}
              <motion.div
                animate={{ opacity:[0.7,1,0.7], y:[0,-3,0] }}
                transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)',
                  fontFamily:'monospace', fontSize:7, fontWeight:900, color:'#cce0ff',
                  textShadow:'0 0 8px #aac8ff', whiteSpace:'nowrap', letterSpacing:1 }}>
                🌕 MISSÃO LUNAR
              </motion.div>
            </div>
          ))}

          {/* ❄️ Banner de freeze ativo */}
          {screen === 'playing' && freezeActive && (
            <motion.div className="absolute pointer-events-none"
              style={{ top:44, left:0, right:0, display:'flex', justifyContent:'center', zIndex:15 }}
              initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
              <motion.div
                animate={{ boxShadow:['0 0 12px rgba(150,200,255,0.5)','0 0 24px rgba(180,220,255,0.9)','0 0 12px rgba(150,200,255,0.5)'] }}
                transition={{ duration:0.9, repeat:Infinity, ease:'easeInOut' }}
                style={{ fontFamily:'monospace', fontSize:10, fontWeight:900, color:'#cce8ff',
                  textShadow:'0 0 10px #99ccff', background:'rgba(80,130,255,0.18)',
                  border:'1px solid rgba(150,200,255,0.5)', borderRadius:8,
                  padding:'2px 10px', letterSpacing:2 }}>
                ❄️ FREEZE {freezeTimeLeft}s
              </motion.div>
            </motion.div>
          )}

          {/* Animação de coleta da lua */}
          <AnimatePresence>
            {moonCollectAnim && (
              <motion.div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
                {/* flash branco prateado */}
                <motion.div className="absolute inset-0"
                  initial={{ opacity:0.5 }} animate={{ opacity:0 }} transition={{ duration:1.5 }}
                  style={{ background:'radial-gradient(circle at 50% 50%, rgba(200,225,255,0.6) 0%, transparent 70%)' }} />
                <motion.div
                  initial={{ scale:0.3, y:30, opacity:0 }}
                  animate={{ scale:[0.3,1.5,1], y:[30,-15,0], opacity:[0,1,1] }}
                  exit={{ y:-50, opacity:0, scale:0.7 }}
                  transition={{ duration:0.6, times:[0,0.5,1], ease:'easeOut' }}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:52, lineHeight:1, filter:'drop-shadow(0 0 24px rgba(200,220,255,0.9))' }}>🌕</div>
                  <div style={{ fontFamily:'monospace', fontWeight:900, fontSize:16, color:'#cce8ff',
                    textShadow:'0 0 14px #aaccff, 0 0 28px #8899ff', letterSpacing:2 }}>MISSÃO LUNAR!</div>
                  <div style={{ fontFamily:'monospace', fontSize:9, color:'rgba(180,210,255,0.8)', letterSpacing:2 }}>+2 VIDAS  ·  FREEZE 5s</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🌕 Pop-up RPG Gravidade Lunar — aparece ao coletar a lua */}
          <AnimatePresence>
            {moonRpgActive && screen === 'playing' && (
              <motion.div
                className="absolute pointer-events-auto"
                style={{ bottom: 18, left: 10, right: 10, zIndex: 40 }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}>
                <div style={{
                  background: 'linear-gradient(160deg, rgba(0,8,28,0.97) 0%, rgba(0,18,48,0.97) 100%)',
                  border: '1.5px solid rgba(150,200,255,0.6)',
                  borderRadius: 12,
                  padding: '10px 12px 8px',
                  boxShadow: '0 0 28px rgba(100,180,255,0.3), inset 0 0 18px rgba(0,40,100,0.3)',
                  position: 'relative',
                }}>
                  {/* cantos decorativos */}
                  <div style={{ position:'absolute', top:6, left:6, width:8, height:8, borderTop:'2px solid #99ccff', borderLeft:'2px solid #99ccff', borderRadius:'2px 0 0 0' }} />
                  <div style={{ position:'absolute', top:6, right:6, width:8, height:8, borderTop:'2px solid #99ccff', borderRight:'2px solid #99ccff', borderRadius:'0 2px 0 0' }} />
                  {/* header */}
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                    <motion.div
                      animate={{ scale:[1,1.1,1], rotate:[0,-5,5,0] }}
                      transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
                      style={{ fontSize:22, lineHeight:1, filter:'drop-shadow(0 0 8px rgba(180,220,255,0.8))' }}>
                      👨‍🚀
                    </motion.div>
                    <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                      <div style={{ fontFamily:'monospace', fontSize:8, color:'#99ccff', letterSpacing:3, fontWeight:900, textShadow:'0 0 8px #99ccff' }}>CMDT. HOUSTON</div>
                      <div style={{ display:'flex', gap:2 }}>
                        {['LUNAR','GRAVIDADE','5s'].map(tag => (
                          <span key={tag} style={{ fontFamily:'monospace', fontSize:6, color:'rgba(150,200,255,0.55)', background:'rgba(100,180,255,0.08)', border:'1px solid rgba(150,200,255,0.2)', borderRadius:3, padding:'0 3px', letterSpacing:1 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    {/* Contagem regressiva */}
                    <motion.div
                      style={{ marginLeft:'auto', fontFamily:'monospace', fontSize:16, fontWeight:900, color:'#99ccff', textShadow:'0 0 12px #aaccff', minWidth:28, textAlign:'center' }}
                      animate={{ scale:[1,1.15,1], opacity:[1,0.7,1] }}
                      transition={{ duration:1, repeat:Infinity, ease:'easeInOut' }}>
                      {freezeTimeLeft}s
                    </motion.div>
                  </div>
                  {/* texto */}
                  <div style={{ fontFamily:'monospace', fontSize:9.5, color:'rgba(210,230,255,0.92)', lineHeight:1.65, letterSpacing:0.3, minHeight:44 }}>
                    Piloto! Gravidade lunar ativada — todos os obstáculos congelados por {FREEZE_SECS} segundos. +2 vidas adicionadas. Use esse tempo com sabedoria!
                    <motion.span animate={{ opacity:[1,0,1] }} transition={{ duration:0.7, repeat:Infinity }}>▌</motion.span>
                  </div>
                  {/* botão fechar */}
                  <div style={{ marginTop:8, display:'flex', justifyContent:'flex-end' }}>
                    <motion.button
                      onClick={() => setMoonRpgActive(false)}
                      whileHover={{ scale:1.04, boxShadow:'0 0 14px rgba(150,200,255,0.6)' }}
                      whileTap={{ scale:0.96 }}
                      style={{ fontFamily:'monospace', fontSize:8, fontWeight:900, letterSpacing:2,
                        color:'#99ccff', background:'rgba(100,180,255,0.1)', border:'1px solid rgba(150,200,255,0.45)',
                        borderRadius:6, padding:'4px 10px', cursor:'pointer',
                        boxShadow:'0 0 8px rgba(100,180,255,0.2)' }}>
                      [ ENTENDIDO! 🌕 ]
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* ── CAIXA DE DIÁLOGO RPG — Comandante Houston (game over) ── */}
          <AnimatePresence>
            {rpgStep !== null && screen === 'dead' && (() => {
              const line = RPG_LINES[rpgStep];
              const isLast = rpgStep >= RPG_LINES.length - 1;
              return (
                <motion.div
                  key={rpgStep}
                  className="absolute pointer-events-auto"
                  style={{ bottom: 18, left: 10, right: 10, zIndex: 40 }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 18 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}>
                  {/* caixa principal */}
                  <div style={{
                    background: 'linear-gradient(160deg, rgba(0,10,30,0.97) 0%, rgba(0,20,50,0.97) 100%)',
                    border: '1.5px solid rgba(0,207,255,0.55)',
                    borderRadius: 12,
                    padding: '10px 12px 8px',
                    boxShadow: '0 0 24px rgba(0,150,255,0.25), inset 0 0 18px rgba(0,50,100,0.3)',
                    position: 'relative',
                  }}>
                    {/* canto decorativo top-left */}
                    <div style={{ position:'absolute', top:6, left:6, width:8, height:8, borderTop:'2px solid #00cfff', borderLeft:'2px solid #00cfff', borderRadius:'2px 0 0 0' }} />
                    <div style={{ position:'absolute', top:6, right:6, width:8, height:8, borderTop:'2px solid #00cfff', borderRight:'2px solid #00cfff', borderRadius:'0 2px 0 0' }} />

                    {/* header: avatar + nome */}
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                      <motion.div
                        animate={{ scale:[1,1.08,1] }} transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                        style={{ fontSize:22, lineHeight:1, filter:'drop-shadow(0 0 6px #00cfff)' }}>
                        {line.avatar}
                      </motion.div>
                      <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                        <div style={{ fontFamily:'monospace', fontSize:8, color:'#00cfff', letterSpacing:3, fontWeight:900, textShadow:'0 0 8px #00cfff' }}>{line.speaker}</div>
                        <div style={{ display:'flex', gap:2 }}>
                          {/* barra de status tipo RPG */}
                          {['NASA','HOUSTON','TX'].map(tag => (
                            <span key={tag} style={{ fontFamily:'monospace', fontSize:6, color:'rgba(0,207,255,0.55)', background:'rgba(0,207,255,0.08)', border:'1px solid rgba(0,207,255,0.2)', borderRadius:3, padding:'0 3px', letterSpacing:1 }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      {/* indicador de página */}
                      <div style={{ marginLeft:'auto', display:'flex', gap:3 }}>
                        {RPG_LINES.map((_,i) => (
                          <div key={i} style={{ width:5, height:5, borderRadius:'50%', background: i <= rpgStep ? '#00cfff' : 'rgba(255,255,255,0.12)', boxShadow: i === rpgStep ? '0 0 5px #00cfff' : 'none' }} />
                        ))}
                      </div>
                    </div>

                    {/* texto com cursor piscando */}
                    <div style={{ fontFamily:'monospace', fontSize:9.5, color:'rgba(220,240,255,0.92)', lineHeight:1.65, letterSpacing:0.3, minHeight:44 }}>
                      {line.text}
                      <motion.span animate={{ opacity:[1,0,1] }} transition={{ duration:0.7, repeat:Infinity }}>▌</motion.span>
                    </div>

                    {/* botão de avançar */}
                    <div style={{ marginTop:8, display:'flex', justifyContent:'flex-end' }}>
                      <motion.button
                        onClick={advanceRpg}
                        whileHover={{ scale:1.04, boxShadow:'0 0 14px rgba(0,207,255,0.6)' }}
                        whileTap={{ scale:0.96 }}
                        style={{ fontFamily:'monospace', fontSize:8, fontWeight:900, letterSpacing:2,
                          color:'#00cfff', background:'rgba(0,207,255,0.1)', border:'1px solid rgba(0,207,255,0.45)',
                          borderRadius:6, padding:'4px 10px', cursor:'pointer',
                          boxShadow:'0 0 8px rgba(0,207,255,0.2)' }}>
                        {isLast ? '[ MISSÃO RECEBIDA. AVANTE! ]' : '[ PRÓXIMO ▶ ]'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

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
            <motion.div className="absolute inset-0 flex flex-col items-center px-4"
              style={{ scrollbarWidth:'none', overflowY: showGuide ? 'auto' : 'hidden', justifyContent: showGuide ? 'flex-start' : 'center', paddingTop: showGuide ? 28 : 0, paddingBottom: 12, gap: 14 }}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
              <motion.img src="/GAME/airplane.svg" alt="foguete" style={{ width:62, height:62, flexShrink:0, filter:'drop-shadow(0 0 16px #00d9ff)' }}
                animate={{ y:[-6,6,-6] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }} />
              <GameTitle size="lg" />
              <div style={{ fontFamily:'monospace', color:'#556677', fontSize:10 }}>
                BEM-VINDO, <span style={{ color:'#ffd700', textShadow:'0 0 8px #ffd700' }}>{playerName}</span>!
              </div>

              {/* ── CAMPO SOBRE ── */}
              <div style={{ width:'100%', borderRadius:14, overflow:'hidden', flexShrink:0 }}>
                {/* Botão LED piscando */}
                <motion.button onClick={() => setShowGuide(v => !v)}
                  className="w-full flex items-center justify-center gap-2 py-2"
                  style={{ background:'none', cursor:'pointer', border:'none', outline:'none' }}
                  whileTap={{ scale:0.96 }}>
                  {/* LED */}
                  <motion.div animate={{ opacity:[1, 0.15, 1], boxShadow:['0 0 6px 2px #00cfff','0 0 2px 1px #007799','0 0 6px 2px #00cfff'] }}
                    transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                    style={{ width:7, height:7, borderRadius:'50%', background:'#00cfff', flexShrink:0 }} />
                  <motion.span
                    animate={{ opacity:[1, 0.45, 1] }} transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                    style={{ fontFamily:'monospace', color:'#00cfff', fontSize:9, fontWeight:900, letterSpacing:3 }}>
                    COMO JOGAR
                  </motion.span>
                  <motion.div animate={{ rotate: showGuide ? 180 : 0 }} transition={{ duration:0.25 }}
                    style={{ color:'#00cfff', fontSize:10, lineHeight:1, opacity:0.7 }}>▼</motion.div>
                </motion.button>

                {/* Conteúdo colapsável */}
                <AnimatePresence>
                  {showGuide && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                      transition={{ duration:0.3, ease:'easeInOut' }}
                      style={{ overflow:'hidden' }}>
                      <div style={{ padding:'10px 14px 14px', display:'flex', flexDirection:'column', gap:10, background:'rgba(0,150,255,0.04)' }}>

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
                            { src:'/GAME/ALIEN.svg',   filter:'drop-shadow(0 0 8px #cc00ff) hue-rotate(200deg) brightness(1.6) saturate(2)', label:'🔴 PROJÉTIL', desc:'A partir de 300pts tiros alienígenas vêm direto em você! Desvie rápido.', color:'#cc00ff' },
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Seletor de dificuldade ── */}
              <div style={{ width:'100%', flexShrink:0 }}>
                <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:2, textAlign:'center', marginBottom:6 }}>DIFICULDADE</div>
                <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                  {([
                    { id: 'normal'       as Difficulty, label: 'NORMAL',      img: '/GAME/nivel-normal.svg',      color: '#00cfff', desc: 'Padrão' },
                    { id: 'apollo'       as Difficulty, label: 'APOLLO',       img: '/GAME/nivel-apollo.svg',      color: '#ffd700', desc: '+150pts vel.' },
                    { id: 'interestelar' as Difficulty, label: 'INTERSTELAR',  img: '/GAME/nivel-interstelar.svg', color: '#ff6b6b', desc: '+300pts vel.' },
                  ]).map(d => {
                    const active = difficulty === d.id;
                    return (
                      <motion.button key={d.id} onClick={() => setDifficulty(d.id)}
                        whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        style={{
                          flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                          padding:'6px 4px', borderRadius:10, cursor:'pointer', outline:'none',
                          background: active ? `rgba(${d.color === '#00cfff' ? '0,207,255' : d.color === '#ffd700' ? '255,215,0' : '255,107,107'},0.15)` : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${active ? d.color : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: active ? `0 0 12px ${d.color}44` : 'none',
                          transition: 'all 0.2s',
                        }}>
                        <img src={d.img} alt={d.label} style={{ width:36, height:36, objectFit:'contain', filter: active ? `drop-shadow(0 0 6px ${d.color})` : 'brightness(0.6) grayscale(0.4)' }} />
                        <span style={{ fontFamily:'monospace', fontSize:7, fontWeight:900, letterSpacing:1, color: active ? d.color : 'rgba(255,255,255,0.4)', textShadow: active ? `0 0 8px ${d.color}` : 'none' }}>{d.label}</span>
                        <span style={{ fontFamily:'monospace', fontSize:6, color:'rgba(255,255,255,0.25)', letterSpacing:0.5 }}>{d.desc}</span>
                      </motion.button>
                    );
                  })}
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
              {/* 🌕 Lua real flutuando no fundo — decorativa */}
              <motion.img
                src="/GAME/MoonVideoGIF.gif"
                alt=""
                aria-hidden="true"
                className="absolute pointer-events-none"
                style={{ width:200, height:200, borderRadius:'50%', opacity:0.13,
                  filter:'brightness(1.1) blur(2px)',
                  top:'50%', left:'50%', transform:'translate(-50%,-60%)' }}
                animate={{ y:[0,-12,0], opacity:[0.10,0.16,0.10] }}
                transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
              />
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
