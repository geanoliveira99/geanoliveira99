import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Play, RotateCcw, LogIn } from 'lucide-react';

// ── Constantes de performance — avaliadas UMA vez ao carregar o módulo ──
// (declaradas aqui no topo para ficarem disponíveis em ScanLine e demais helpers)
const IS_MOBILE_WEB = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const TARGET_FPS        = IS_MOBILE_WEB ? 20 : 60;
const FRAME_MS          = 1000 / TARGET_FPS;
void FRAME_MS; // kept for reference; RENDER_FRAME_MS is used for the render throttle
const RENDER_FPS        = IS_MOBILE_WEB ? 15 : 60;
const RENDER_FRAME_MS   = 1000 / RENDER_FPS;
const PARTICLE_CAP      = IS_MOBILE_WEB ? 12 : 80;
const PARTICLE_SPARSE   = IS_MOBILE_WEB ? 0.3 : 1;

function ScanLine({ delay = 0, duration = 2.4 }: { delay?: number; duration?: number }) {
  // Avoid continuous framer-motion animations on mobile (reduces layout/paint churn)
  if (IS_MOBILE_WEB) {
    return (
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1,
          background: 'linear-gradient(90deg, transparent 0%, #00ff50 40%, #00ff50 60%, transparent 100%)',
          boxShadow: '0 0 6px 2px #00ff50, 0 0 16px 4px rgba(0,255,80,0.7)',
          pointerEvents: 'none', zIndex: 5,
          transform: 'translateX(-10%)'
        }}
      />
    );
  }
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
interface Bonus2Item { id: number; x: number; y: number; } // downgrade gun4→gun3
interface AlienShip { id: number; x: number; y: number; width: number; height: number; shootTimer: number; }
interface Projectile { id: number; x: number; y: number; vy: number; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface Explosion { id: number; x: number; y: number; }
interface ScoreEntry { name: string; score: number; date: string; }
type ShipSkin = 'normal' | 'bonus' | 'elite' | 'spacestart';
type PlanetType = 'neptune' | 'saturn' | 'jupiter';
type DeathCause = 'blackhole' | 'jupiter' | 'saturn' | 'neptune' | 'alien' | 'projectile' | 'obstacle' | 'boss';
interface Planet { id: number; x: number; y: number; width: number; height: number; type: PlanetType; }
interface BlackHole { id: number; x: number; y: number; born: number; }
interface MoonItem { id: number; x: number; y: number; }
type Difficulty = 'normal' | 'apollo' | 'interestelar';
type MonsterType = 'monster01' | 'monster02' | 'monster03' | 'monster04';
interface Monster { id: number; x: number; y: number; width: number; height: number; type: MonsterType; hp: number; maxHp: number; shootTimer: number; vx: number; arrived: boolean; }
interface BossEnemy { x: number; y: number; width: number; height: number; hp: number; maxHp: number; shootTimer: number; phase: number; vx: number; }
interface EnemyBullet { id: number; x: number; y: number; vx: number; vy: number; type: 'normal' | 'boss1' | 'boss2'; }
interface PlayerBullet { id: number; x: number; y: number; vy: number; }
// Mapa de HP dos obstáculos destruíveis (id -> hp atual)
type ObstacleHPMap = Map<number, number>;

const GAME_WIDTH = 320, GAME_HEIGHT = 520, PLANE_W = 52, PLANE_H = 52, PLANE_Y = GAME_HEIGHT - 68;
const TB_KEY = 'skyDodgeTable', NM_KEY = 'skyDodgeName';
const MAX_TABLE = 10, LIVES = 3, MAX_LIVES = 7, ELITE_SCORE = 1000, BONUS_SECS = 10;
const BONUS_STREAK_NEEDED = 4; // 4 bonus consecutivos = +1 vida
const BONUS_W = 38, BONUS_H = 38, ALIEN_W = 52, ALIEN_H = 40;
const BONUS2_W = 38, BONUS2_H = 38;
const FIREGUN4_WARN_MS  =  7000; // intervalo de repetição do aviso com gun4 (7s)
const FIREGUN4_DANGER_MS= 14000; // 14s com gun4 → planetas J/S crescem 35%
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
// Sistema de armas e monstros
const FIRE_STREAK_NEEDED = 1;   // 1 bonus = +1 nível de arma (gun1→2→3→4)
const MAX_FIRE_LEVEL = 4;
const MONSTER_SCORE_START = 900; // primeiro monster aos 900pts
const MONSTER_EVERY = 600;       // novo monster a cada 600pts depois
const BOSS_SCORE = 4500;         // boss final aos 4500pts
const MONSTER_W = 64, MONSTER_H = 64;
const MONSTER_STOP_Y = 38; // Y onde o monster para (topo da tela, logo abaixo do HUD)
const BOSS_W = 90, BOSS_H = 90;
const BOSS_HP = 20;              // boss final tem 20 de vida
const MONSTER_HP = 10;           // monsters normais têm 10 de vida
const ENEMY_BULLET_W = 18, ENEMY_BULLET_H = 18;
const PLAYER_BULLET_W = 14, PLAYER_BULLET_H = 14;
// HP dos obstáculos normais (por tipo)
const OBSTACLE_HP: Record<string, number> = { meteor: 1, cloud: 1 };
const ALIEN_HP = 2;
const NEPTUNE_HP = 2; // HP do Netuno (usado na lógica de colisão via ALIEN_HP path)
void NEPTUNE_HP; // suppress unused warning
let oid = 0, pid = 0, eid = 0, bid = 0, aid = 0, prid = 0, plid = 0, bhid = 0, mnid = 0, mid = 0, ebid = 0, pbid = 0;

// ── Passwords dos checkpoints ──
const PASSWORDS: { pw: string; label: string; score: number }[] = [
  { pw: 'EASY0101',      label: 'Após Monster 01', score: MONSTER_SCORE_START + MONSTER_EVERY },
  { pw: 'THEPHODALIS',   label: 'Após Monster 02', score: MONSTER_SCORE_START + MONSTER_EVERY * 2 },
  { pw: 'QWERTY0101001', label: 'Após Monster 03', score: MONSTER_SCORE_START + MONSTER_EVERY * 3 },
  { pw: 'SPACE2026NASA', label: 'Após Monster 04', score: MONSTER_SCORE_START + MONSTER_EVERY * 4 },
];
function getPasswordForKills(killed: number) {
  if (killed <= 0) return null;
  return PASSWORDS[Math.min(killed - 1, PASSWORDS.length - 1)] ?? null;
}
function getCheckpointByPassword(pw: string) {
  return PASSWORDS.find(p => p.pw === pw.toUpperCase().trim()) ?? null;
}

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

// Hook para sons de impacto — clona o áudio para suportar múltiplos plays simultâneos
function useHitSound(src: string, volume = 0.22) {
  const baseRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio(src); a.volume = volume; baseRef.current = a;
    return () => { a.src = ''; };
  }, [src, volume]);
  return useCallback(() => {
    const base = baseRef.current; if (!base) return;
    const clone = base.cloneNode() as HTMLAudioElement;
    clone.volume = volume;
    clone.play().catch(() => {});
  }, [volume]);
}

// ── Fundos por fase — viagem de volta à Terra pelo Sistema Solar ──
// Fase 0: Espaço profundo (início — além de Plutão)
// Fase 1: Após Monster01 — Região de Plutão/Kuiper Belt (azul gelo escuro)
// Fase 2: Após Monster02 — Região de Netuno/Urano (azul profundo com névoa)
// Fase 3: Após Monster03 — Saturno/Júpiter (laranja/âmbar com tons quentes)
// Fase 4: Após Monster04 — Cinturão de Asteróides/Marte (vermelho/ferrugem)
// Fase 5: Boss — Próximo ao Sol (laranja intenso + corona)
const PHASE_BACKGROUNDS: string[] = [
  // 0 — Espaço profundo: azul noturno quase preto
  'linear-gradient(180deg, #000814 0%, #001025 40%, #001840 70%, #002050 100%)',
  // 1 — Kuiper Belt / Plutão: azul gelo com névoa cósmica violeta
  'linear-gradient(180deg, #04001a 0%, #0a0530 35%, #0d1545 60%, #0a2255 100%)',
  // 2 — Netuno / Urano: azul elétrico profundo com brilho ciano
  'linear-gradient(180deg, #000c1e 0%, #001a3d 30%, #002d6b 60%, #003d8a 100%)',
  // 3 — Saturno / Júpiter: dourado âmbar escuro com tons de tempestade
  'linear-gradient(180deg, #0d0800 0%, #1a0e00 30%, #2e1800 60%, #3d2200 100%)',
  // 4 — Cinturão de asteróides / Marte: ferrugem escura com brilho vermelho
  'linear-gradient(180deg, #0e0000 0%, #1c0500 30%, #2d0800 60%, #3d1000 100%)',
  // 5 — Boss / Próximo ao Sol: laranja intenso com corona solar visível
  'linear-gradient(180deg, #1a0400 0%, #2d0800 25%, #4a1200 55%, #6b1e00 80%, #8b2800 100%)',
];

// Texto completo dos créditos — usado no render e no useEffect de detecção de fim
const CREDITS_FULL_TEXT = [
  '> DESENVOLVIDO POR: @geanoliveira99',
  '\n> TECNOLOGIA: React + TypeScript',
  '\n> COMPATÍVEL COM: Android, iOS e Desktop',
  '\n> QUALQUER TAMANHO DE TELA: SIM',
  '\n> ENGINE: Vite + Framer Motion',
  '\n> SONS E GRÁFICOS: Personalizados',
  '\n',
  '\n>  SIM, PILOTO!',
  '\n> A GALÁXIA ESTÁ SALVA... POR ENQUANTO.',
].join('');

// Texto da vitória bônus — inclui o nome do jogador
function bonusVictoryText(name: string): string {
  return [
    `> MISSÃO BÔNUS: CONCLUÍDA`,
    `\n`,
    `\n> PILOTO: ${name}`,
    `\n`,
    `\n> RELATÓRIO DE COMBATE:`,
    `\n> 4 AMEAÇAS ELIMINADAS COM SUCESSO.`,
    `\n> INVASÃO AO PLANETA TERRA: BLOQUEADA.`,
    `\n`,
    `\n> OS ÚLTIMOS SOBREVIVENTES DAS FORÇAS`,
    `\n> ALIENÍGENAS FORAM DESTRUÍDOS POR VOCÊ.`,
    `\n`,
    `\n> A HUMANIDADE NUNCA SABERÁ O QUE HOUVE`,
    `\n> LÁ FORA... MAS VOCÊ SABE.`,
    `\n`,
    `\n> VOCÊ É O ÚNICO HERÓI DESTA GALÁXIA,`,
    `\n> ${name}.`,
    `\n`,
    `\n> A TERRA ESTÁ SALVA.`,
    `\n> MISSÃO CUMPRIDA. 🌍`,
  ].join('');
}

// Componente typewriter para a tela de história
function StoryTyper({ text, chars, setChars }: { text: string; chars: number; setChars: (n: number) => void }) {
  useEffect(() => {
    if (chars >= text.length) return;
    const t = setTimeout(() => setChars(Math.min(chars + 1, text.length)), 28);
    return () => clearTimeout(t);
  }, [chars, text, setChars]);
  const cursor = chars < text.length ? <span style={{ animation:'blink 0.7s step-end infinite', color:'#00ff41' }}>█</span> : null;
  return <>{text.slice(0, chars)}{cursor}</>;
}

type Screen = 'register' | 'idle' | 'story' | 'playing' | 'dead' | 'table' | 'credits' | 'bonus_mission' | 'bonus_victory';

// ── Estrelas do fundo do jogo — pré-computadas, não recriadas a cada render ──
const GAME_STARS = Array.from({ length: IS_MOBILE_WEB ? 10 : 45 }, (_, i) => ({
  key: i,
  w: i % 6 === 0 ? 2 : 1,
  bg: (['#fff', '#adf', '#ffd'] as const)[i % 3],
  left: `${(i * 19 + 7) % 100}%`,
  top:  `${(i * 29 + 11) % 100}%`,
  opacity: 0.15 + (i % 5) * 0.07,
}));

export default function MiniGame({ onClose, isApp = false }: { onClose: () => void; isApp?: boolean }) {
  const savedName = localStorage.getItem(NM_KEY) || '';
  const [screen,       setScreen]      = useState<Screen>(savedName ? 'idle' : 'register');
  const [playerName,   setPlayerName]  = useState(savedName);
  const [nameInput,    setNameInput]   = useState(savedName);
  const [nameError,    setNameError]   = useState('');
  // score, bonusTimeLeft e freezeTimeLeft são lidos apenas pelo render tick
  // → ficam em useRef para não disparar re-renders extras fora do tick
  const scoreRenderRef      = useRef(0);   // valor exibido no HUD (sync via renderTick)
  const bonusTimeLeftRef    = useRef(0);   // segundos restantes do bônus (sync via renderTick)
  const freezeTimeLeftRef   = useRef(0);   // segundos restantes do freeze (sync via renderTick)
  const [score,        setScore]       = useState(0);
  const [highScore,    setHighScore]   = useState(() => { const t = loadTable().filter(e => e.name === savedName); return t.length > 0 ? Math.max(...t.map(e => e.score)) : 0; });
  const [planeX,       setPlaneX]      = useState(GAME_WIDTH / 2 - PLANE_W / 2);
  const [lives,        setLives]       = useState(LIVES);
  // ── Arrays de jogo: gerenciados via refs, renderTick dispara re-render ──
  const [, setRenderTick]  = useState(0);
  const obstaclesR    = useRef<Obstacle[]>([]);
  const bonusItemsR   = useRef<BonusItem[]>([]);
  const bonus2ItemsR  = useRef<Bonus2Item[]>([]); // item downgrade gun4→gun3
  const aliensR       = useRef<AlienShip[]>([]);
  const particlesR    = useRef<Particle[]>([]);
  const explosionsR   = useRef<Explosion[]>([]);
  const projectilesR2 = useRef<Projectile[]>([]);
  const planetsR      = useRef<Planet[]>([]);
  const blackHolesR   = useRef<BlackHole[]>([]);
  const moonItemsR    = useRef<MoonItem[]>([]);
  const monstersR2    = useRef<Monster[]>([]);
  const bossR2        = useRef<BossEnemy | null>(null);
  const enemyBulletsR = useRef<EnemyBullet[]>([]);
  const playerBulletsR= useRef<PlayerBullet[]>([]);
  const obstacleHPsR  = useRef<ObstacleHPMap>(new Map());
  const alienHPsR2    = useRef<Map<number,number>>(new Map());
  const [shake,        setShake]       = useState(false);
  const [table,        setTable]       = useState<ScoreEntry[]>(loadTable);
  const [isNewRecord,  setIsNewRecord] = useState(false);
  const [bonusActive,  setBonusActive] = useState(false);
  const [shipSkin,     setShipSkin]    = useState<ShipSkin>('normal');
  const [invincible,   setInvincible]  = useState(false);
  const [showGuide,    setShowGuide]   = useState(false);
  const [bonusStreak,  setBonusStreak] = useState(0);
  const [extraLifeAnim,setExtraLifeAnim] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const [moonCollectAnim, setMoonCollectAnim] = useState(false);
  const [rpgStep,      setRpgStep]     = useState<number | null>(null);
  const [difficulty,   setDifficulty]  = useState<Difficulty>('normal');
  const [moonRpgActive, setMoonRpgActive] = useState(false);
  const [monsterWarnActive, setMonsterWarnActive] = useState(false); // aviso ao chegar no monster sem munição
  const [midGameTipActive,  setMidGameTipActive]  = useState(false); // dica do astronauta durante o jogo
  const midGameTipActiveRef = useRef(false);  // ref espelho para uso dentro do loop
  const midGameTipTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null); // timer de fechar
  const [gun4WarnActive,    setGun4WarnActive]    = useState(false); // aviso arma gun4 muito pesada
  const [gun4Danger,        setGun4Danger]        = useState(false); // planetas J/S 35% maiores (14s)
  const [gun4Mega,          setGun4Mega]          = useState(false); // planetas J/S 100% maiores (4ª notif+)
  const midGameTipThresholdRef = useRef(0); // último múltiplo de 300pts que já disparou a dica
  const fireGun4TimerMs = useRef(0);  // ms acumulados com fireLevel===4
  const gun4WarnShownRef = useRef(false); // aviso já disparado nesta sequência gun4
  // ── Sistema de Password ──
  // Password que o jogador desbloqueou (exibido no game over)
  const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);
  // Ref para rastrear quantos monsters o jogador matou nesta partida
  const monstersKilledRef = useRef(0);
  const [passwordInput,    setPasswordInput]    = useState('');
  const [passwordError,    setPasswordError]    = useState('');
  // ── Armas, Boss state (HUD only) ──
  const [fireLevel,    setFireLevel]   = useState(0);
  const [boss,         setBoss]        = useState<BossEnemy | null>(null);
  const [bossDefeated, setBossDefeated]= useState(false);
  const rpgShownRef = useRef(false);       // evita duplo trigger no mesmo game over
  const gameOverCountRef = useRef(0);      // conta quantos game overs o usuário teve
  const deathCauseRef = useRef<DeathCause>('obstacle'); // causa da morte atual
  const difficultyRef = useRef<Difficulty>('normal');
  const prevHadMonsterRef = useRef(false); // controla loop de risada dos monsters

  const bgMusic       = useAudio('/sounds/somDuranteJogo.mp3',     true);
  const sndBonusMusic = useAudio('/sounds/gamebonusanimado.mp3',   true);
  const sndBoom       = useAudio('/sounds/BombExplosion2segundos.mp3', false);
  const sndGameOver   = useAudio('/sounds/game-over.mp3',          false);
  const sndVidaExtra  = useAudio('/sounds/VIDA-EXTRA.mp3',         false);
  const sndGravidadeLuna = useAudio('/sounds/gravidadeluna.mp3',   false);
  const sndCampeao       = useAudio('/sounds/zerou-o-game-campeao.mp3', false);
  const sndRisada        = useAudio('/sounds/risada-monsters.mp3', true);
  const sndBossMusic     = useAudio('/sounds/boss-final-game.mp3', true);
  const sndHistory       = useAudio('/sounds/history-game.wav',    true);
  // Som de impacto do tiro (suave, não compete com a música de fundo)
  const playHit = useHitSound('/sounds/hit-impact.wav', 1.0);

  // ── Estado da tela de história ──
  const [storyScene,   setStoryScene]   = useState(0);   // cena atual (0–N)
  const [storyChars,   setStoryChars]   = useState(0);   // chars revelados no typewriter

  // ── Estado da tela de créditos (após zerar) ──
  const [creditsChars,  setCreditsChars]  = useState(0);  // chars revelados no typewriter dos créditos
  const [creditsDone,   setCreditsDone]   = useState(false); // texto completo digitado

  // ── Estado da tela de vitória bônus Interestelar ──
  const [bonusVictoryChars, setBonusVictoryChars] = useState(0);
  const [bonusVictoryDone,  setBonusVictoryDone]  = useState(false);

  // ── Estado da missão bônus Interestelar ──
  const [bonusTimer,    setBonusTimer]    = useState(60);   // segundos restantes (60s)
  const bonusTimerMsRef = useRef(0);  // ms acumulados na missão bônus
  const bonusRainRef          = useRef(false); // chuva de buracos negros ativada
  const [bonusRain,     setBonusRain]     = useState(false);
  const bonusRainTimerRef     = useRef(0); // ms desde que a chuva começou
  const bonusVictoryShownRef  = useRef(false); // guard: evita execução repetida da vitória bônus

  // ── Fase visual do jogo (fundo muda a cada monster morto) ──
  const [gamePhase, setGamePhase] = useState(0); // 0–5

  // ── Modo SPACESTART: nave especial invencível por 7s (7 vidas + bônus) ──
  const [spaceStartActive, setSpaceStartActive] = useState(false);
  const spaceStartRef      = useRef(false);  // espelho para uso no loop
  const spaceStartTimerRef = useRef(0);      // ms restantes do modo SPACESTART

  const gameRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);

  // Calcula o scale para preencher a tela do dispositivo
  const calcScale = useCallback(() => {
    const sw = window.innerWidth, sh = window.innerHeight;
    const scaleW = sw / GAME_WIDTH;
    const scaleH = sh / GAME_HEIGHT;
    // No app nativo (isApp=true): escala livre para preencher tela do celular
    // No site: cap em 2.4× para telas muito grandes
    return isApp ? Math.min(scaleW, scaleH) : Math.min(scaleW, scaleH, 2.4);
  }, [isApp]);

  const [gameScale, setGameScale] = useState(() => calcScale());

  useEffect(() => {
    const onResize = () => { const s = calcScale(); scaleRef.current = s; setGameScale(s); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [calcScale]);

  const screenRef = useRef(screen), scoreRef = useRef(score), livesRef = useRef(lives), planeXRef = useRef(planeX);
  // bossRef aponta para bossR2 (compatibilidade com loop)
  const bossRef = bossR2;
  const bonusActiveRef = useRef(bonusActive), bonusTimerMs = useRef(0), lastBonusScore = useRef(-1);
  const bonusSpawnTimerRef = useRef(7000); // começa em 7000 para spawnar imediatamente no início
  const invincRef = useRef(false), rafRef = useRef<number>(0), lastTimeRef = useRef(0);
  // Mobile / performance heuristics — constantes definidas no escopo do módulo (IS_MOBILE_WEB etc.)
  const renderAccRef = useRef(0);
  const spawnTimerRef = useRef(0), scoreTimerRef = useRef(0), alienTimerRef = useRef(0), projTimerRef = useRef(0);
  const lastPlanetScore = useRef(-1), lastBHScore = useRef(-1), lastMoonScore = useRef(-1);
  const bonusStreakRef = useRef(0);
  const freezeActiveRef = useRef(false);
  const freezeTimerMs = useRef(0);
  const touchStartRef = useRef<number | null>(null);
  const fireLevelRef = useRef(0);
  const lastMonsterScore = useRef(-1);
  const playerBulletTimerRef = useRef(0);
  const bossDefeatedRef = useRef(false);
  const monsterKillBreakMs = useRef(0); // ms de respiro após matar monster
  const speedOffsetRef = useRef(0); // subtrai do score no cálculo de velocidade (reset após monster)
  const bossBonusTimerRef = useRef(0);    // timer bonus forçado durante o boss sem munição
  const monsterBonusTimerRef = useRef(0); // timer bonus forçado durante monster ativo

  // Small helper to create particle sparks with mobile-aware counts
  const makeSparks = (count: number, x: number, y: number, speed = 8, colors: string[] = ['#fff']) => {
    const c = Math.max(1, Math.floor(count * PARTICLE_SPARSE));
    return Array.from({ length: c }).map(() => ({ id: pid++, x, y, vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed, life: 1, color: colors[Math.floor(Math.random() * colors.length)], size: 3 + Math.random() * 5 }));
  };

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { planeXRef.current = planeX; }, [planeX]);
  useEffect(() => { bonusActiveRef.current = bonusActive; }, [bonusActive]);
  useEffect(() => { invincRef.current = invincible; }, [invincible]);
  useEffect(() => { bonusStreakRef.current = bonusStreak; }, [bonusStreak]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { fireLevelRef.current = fireLevel; }, [fireLevel]);
  useEffect(() => { bossRef.current = boss; }, [boss]);
  useEffect(() => { bossDefeatedRef.current = bossDefeated; }, [bossDefeated]);

  // Música principal: fade in ao entrar em playing, fade out ao sair
  useEffect(() => {
    if (screen === 'playing') bgMusic.fadeIn(0.35, 500);
    else bgMusic.fadeTo(0, 500);
  }, [screen]); // eslint-disable-line

  // Música da história: toca em loop enquanto story ou credits, para ao sair
  useEffect(() => {
    if (screen === 'story' || screen === 'credits' || screen === 'bonus_victory') sndHistory.fadeIn(0.5, 600);
    else sndHistory.fadeTo(0, 400);
  }, [screen]); // eslint-disable-line

  // Detecta fim do typewriter dos créditos → libera botões
  useEffect(() => {
    if (screen === 'credits' && creditsChars >= CREDITS_FULL_TEXT.length && !creditsDone) {
      setCreditsDone(true);
    }
  }, [screen, creditsChars, creditsDone]); // eslint-disable-line

  // Detecta fim do typewriter da vitória bônus → libera botões
  useEffect(() => {
    if (screen === 'bonus_victory' && bonusVictoryChars >= bonusVictoryText(playerName).length && !bonusVictoryDone) {
      setBonusVictoryDone(true);
    }
  }, [screen, bonusVictoryChars, bonusVictoryDone, playerName]); // eslint-disable-line

  // Música do boost: fade in ao ativar, fade out ao desativar
  useEffect(() => {
    if (bonusActive) {
      bgMusic.fadeTo(0, 350);
      sndBonusMusic.fadeIn(0.45, 350);
    } else {
      sndBonusMusic.fadeTo(0, 350);
      if (screen === 'playing' && !boss) bgMusic.fadeIn(0.35, 400);
    }
  }, [bonusActive]); // eslint-disable-line

  // Música do boss: entra quando o boss aparece, sai quando morre ou game over
  useEffect(() => {
    if (boss) {
      bgMusic.fadeTo(0, 400);
      sndBonusMusic.fadeTo(0, 300);
      sndBossMusic.fadeIn(0.55, 500);
    } else {
      sndBossMusic.fadeTo(0, 500);
      if (screen === 'playing' && !bossDefeated && !bonusActive) bgMusic.fadeIn(0.35, 500);
    }
  }, [boss]); // eslint-disable-line

  useEffect(() => {
    if (spaceStartActive) setShipSkin('spacestart');
    else if (bonusActive) setShipSkin('bonus');
    else if (score >= ELITE_SCORE) setShipSkin('elite');
    else setShipSkin('normal');
  }, [spaceStartActive, bonusActive, score]);

  const getShipSrc = (skin: ShipSkin) =>
    skin === 'spacestart' ? '/GAME/SPACESTART.gif'
    : skin === 'bonus'    ? '/GAME/spaceShuttleBONUS.svg'
    : skin === 'elite'    ? '/GAME/space1000bonus.svg'
    : '/GAME/airplane.svg';
  const getDiffOffset = (d: Difficulty) => d === 'interestelar' ? 300 : d === 'apollo' ? 150 : 0;
  const getSpeed = (s: number, d?: Difficulty) => 2.8 + Math.floor((Math.max(0, s - speedOffsetRef.current) + getDiffOffset(d ?? difficultyRef.current)) / 100) * 0.9;
  const getSpawnInterval = (s: number, d?: Difficulty) => Math.max(880 - Math.floor((Math.max(0, s - speedOffsetRef.current) + getDiffOffset(d ?? difficultyRef.current)) / 50) * 55, 320);
  const level = Math.floor(score / 100) + 1;

  const spawnObstacle = useCallback(() => {
    const type: Obstacle['type'] = Math.random() > 0.45 ? 'meteor' : 'cloud';
    const w = type === 'meteor' ? 38 : 58, h = type === 'meteor' ? 38 : 40, margin = 8;
    const maxPct = 100 - (w / GAME_WIDTH) * 100 - (margin / GAME_WIDTH) * 100;
    const x = (margin / GAME_WIDTH) * 100 + Math.random() * maxPct;
    obstaclesR.current.push({ id: oid++, x, y: -h - 5, width: w, height: h, type, rotation: Math.random() * 360 });
  }, []);

  const spawnBonus = useCallback(() => {
    const margin = 20, x = margin + Math.random() * (GAME_WIDTH - BONUS_W - margin * 2);
    bonusItemsR.current.push({ id: bid++, x, y: -BONUS_H - 5 });
  }, []);

  const spawnAlien = useCallback(() => {
    const margin = 8, x = margin + Math.random() * (GAME_WIDTH - ALIEN_W - margin * 2);
    aliensR.current.push({ id: aid++, x, y: -ALIEN_H - 5, width: ALIEN_W, height: ALIEN_H, shootTimer: 0 });
  }, []);

  const spawnProjectile = useCallback(() => {
    const margin = 10;
    const x = margin + Math.random() * (GAME_WIDTH - PROJ_W - margin * 2);
    const vy = 7 + Math.floor(scoreRef.current / 200) * 1.2;
    projectilesR2.current.push({ id: prid++, x, y: -PROJ_H - 5, vy });
  }, []);

  const spawnPlanet = useCallback(() => {
    const r = Math.random();
    const type: PlanetType = r < 0.25 ? 'neptune' : r < 0.625 ? 'saturn' : 'jupiter';
    const { w, h } = PLANET_SIZES[type];
    const margin = 8;
    const x = margin + Math.random() * (GAME_WIDTH - w - margin * 2);
    planetsR.current.push({ id: plid++, x, y: -h - 5, width: w, height: h, type });
  }, []);

  const spawnBlackHole = useCallback(() => {
    const margin = 8;
    const x = margin + Math.random() * (GAME_WIDTH - BH_W - margin * 2);
    blackHolesR.current.push({ id: bhid++, x, y: -BH_H - 5, born: Date.now() });
  }, []);

  const spawnMoon = useCallback(() => {
    const margin = 12;
    const x = margin + Math.random() * (GAME_WIDTH - MOON_W - margin * 2);
    moonItemsR.current.push({ id: mnid++, x, y: -MOON_H - 5 });
  }, []);

  const spawnMonster = useCallback(() => {
    const types: MonsterType[] = ['monster01','monster02','monster03','monster04'];
    // Usa o índice de monsters mortos para garantir ordem sequencial
    const type = types[monstersKilledRef.current % types.length];
    const margin = 10;
    const x = margin + Math.random() * (GAME_WIDTH - MONSTER_W - margin * 2);
    // vx inicial: vai e vem horizontal (±1.4px/frame)
    const vx = (Math.random() > 0.5 ? 1 : -1) * 1.4;
    const newMon: Monster = { id: mid++, x, y: -MONSTER_H - 5, width: MONSTER_W, height: MONSTER_H, type, hp: MONSTER_HP, maxHp: MONSTER_HP, shootTimer: 0, vx, arrived: false };
    monstersR2.current.push(newMon);
    // a risada em loop é controlada pelo game loop via prevHadMonsterRef
  }, [sndRisada]);

  // 💀 Boss Final
  const spawnBoss = useCallback(() => {
    const newBoss: BossEnemy = { x: GAME_WIDTH / 2 - BOSS_W / 2, y: 20, width: BOSS_W, height: BOSS_H, hp: BOSS_HP, maxHp: BOSS_HP, shootTimer: 0, phase: 1, vx: 1.6 };
    setBoss(newBoss);
    bossRef.current = newBoss;
  }, []);

  const triggerExplosion = useCallback((px: number, py: number, big = true) => {
    sndBoom.play();
    const colors = ['#ff4500','#ff8c00','#ffd700','#ff0000','#fff'];
    const newParts = makeSparks(big ? 26 : 12, px + PLANE_W / 2, py + PLANE_H / 2, 9, colors);
    particlesR.current.push(...newParts);
    if (particlesR.current.length > PARTICLE_CAP) particlesR.current.splice(0, particlesR.current.length - PARTICLE_CAP);
    if (big) explosionsR.current = [{ id: eid++, x: px - 12, y: py - 12 }, { id: eid++, x: px + 18, y: py + 8 }];
    else explosionsR.current = [{ id: eid++, x: px - 8, y: py - 8 }];
  }, [sndBoom]);

  const takeDamage = useCallback((px: number, py: number, finalScore: number, dmg = 1) => {
    const newLives = livesRef.current - dmg;
    if (newLives <= 0) {
      triggerExplosion(px, py, true);
      bgMusic.fadeTo(0, 600);
      sndBonusMusic.fadeTo(0, 300);
      sndBossMusic.fadeTo(0, 300);
      sndRisada.fadeTo(0, 300);
      prevHadMonsterRef.current = false;
      sndGameOver.play();
      setShake(true); setTimeout(() => setShake(false), 500); setLives(0);
      setBonusStreak(0); bonusStreakRef.current = 0; setExtraLifeAnim(false);
      const t = loadTable(), personal = t.filter(e => e.name === (localStorage.getItem(NM_KEY) || ''));
      const prevHS = personal.length > 0 ? Math.max(...personal.map(e => e.score)) : 0;
      const newHS = Math.max(prevHS, finalScore);
      setHighScore(newHS); setIsNewRecord(finalScore > 0 && finalScore >= newHS && finalScore > prevHS);
      const name = localStorage.getItem(NM_KEY) || 'PILOTO';
      if (finalScore > 0) { insertScore(name, finalScore); setTable(loadTable()); }
      // 🔑 Atualiza password desbloqueado baseado em quantos monsters foram mortos
      const pw = getPasswordForKills(monstersKilledRef.current);
      setUnlockedPassword(pw ? pw.pw : null);
      setScreen('dead');
    } else {
      triggerExplosion(px, py, false);
      setShake(true); setTimeout(() => setShake(false), 400);
      setLives(newLives); livesRef.current = newLives;
      setInvincible(true); invincRef.current = true;
      setTimeout(() => { setInvincible(false); invincRef.current = false; }, 1500);
      obstaclesR.current = []; aliensR.current = []; projectilesR2.current = [];
      enemyBulletsR.current = []; playerBulletsR.current = [];
      // Perde o nível de arma ao tomar dano
      fireLevelRef.current = 0; setFireLevel(0);
      // Reseta timers de spawn para evitar burst imediato de obstáculos
      spawnTimerRef.current = 0; projTimerRef.current = 0; alienTimerRef.current = 0;
      setBonusStreak(0); bonusStreakRef.current = 0;
    }
  }, [triggerExplosion, bgMusic, sndBonusMusic, sndBossMusic, sndGameOver, sndRisada]);

  const loop = useCallback((time: number) => {
    if (screenRef.current !== 'playing' && screenRef.current !== 'bonus_mission') return;
    const delta = Math.min(time - lastTimeRef.current, 50);
    lastTimeRef.current = time;
    const isBonusMission = screenRef.current === 'bonus_mission';
    lastTimeRef.current = time;
    const speed = getSpeed(scoreRef.current);
    const freeze = freezeActiveRef.current;

    // ── Timer do modo SPACESTART ──
    if (spaceStartRef.current) {
      spaceStartTimerRef.current = Math.max(0, spaceStartTimerRef.current - delta);
      if (spaceStartTimerRef.current <= 0) {
        spaceStartRef.current = false;
        setSpaceStartActive(false);
        invincRef.current = false;
        setInvincible(false);
      }
    }

    const hasMonster = monstersR2.current.length > 0;
    const hasBoss    = !!bossRef.current;
    // ── Controle de risada dos monsters em loop ──
    const shouldLaugh = hasMonster || hasBoss;
    if (shouldLaugh && !prevHadMonsterRef.current) {
      sndRisada.fadeIn(0.45, 400);
    } else if (!shouldLaugh && prevHadMonsterRef.current) {
      sndRisada.fadeTo(0, 600);
    }
    prevHadMonsterRef.current = shouldLaugh;

    // Fecha o mid-game tip imediatamente se um monster/boss aparecer enquanto estava ativo
    if (shouldLaugh && midGameTipActiveRef.current) {
      if (midGameTipTimerRef.current) { clearTimeout(midGameTipTimerRef.current); midGameTipTimerRef.current = null; }
      midGameTipActiveRef.current = false;
      setMidGameTipActive(false);
    }

    // ── Lógica da missão bônus ──
    if (isBonusMission) {
      // Deconta o timer de 60s
      if (!bonusRainRef.current) {
        bonusTimerMsRef.current = Math.max(0, bonusTimerMsRef.current - delta);
        const secsLeft = Math.ceil(bonusTimerMsRef.current / 1000);
        setBonusTimer(secsLeft);
        // Todos os monsters foram derrotados? Vitória bônus!
        if (monstersR2.current.length === 0 && !bonusRainRef.current && !bonusVictoryShownRef.current) {
          bonusVictoryShownRef.current = true; // guard: executa UMA ÚNICA VEZ
          cancelAnimationFrame(rafRef.current); // para o loop imediatamente
          sndRisada.fadeTo(0, 300);
          bgMusic.fadeTo(0, 400);
          sndBonusMusic.fadeTo(0, 400);
          sndBossMusic.fadeTo(0, 400);
          prevHadMonsterRef.current = false;
          sndCampeao.play();
          setTimeout(() => {
            setBonusVictoryChars(0); setBonusVictoryDone(false);
            setScreen('bonus_victory');
          }, 1800);
          return; // NÃO agenda novo requestAnimationFrame
        }
        // Tempo esgotado sem matar todos: chuva de buracos negros
        if (bonusTimerMsRef.current <= 0 && monstersR2.current.length > 0) {
          bonusRainRef.current = true; setBonusRain(true); bonusRainTimerRef.current = 0;
          // Spawna fileira de BHs cobrindo toda a largura
          const bhCount = Math.ceil(GAME_WIDTH / (BH_W + 2));
          for (let i = 0; i < bhCount; i++) {
            blackHolesR.current.push({ id: bhid++, x: i * (BH_W + 2), y: -BH_H - 5, born: Date.now() });
          }
        }
      } else {
        // Chuva ativa: empurra BHs para baixo rapidamente
        bonusRainTimerRef.current += delta;
        blackHolesR.current = blackHolesR.current.map(bh => ({ ...bh, y: bh.y + speed * 2.5 })).filter(bh => bh.y < GAME_HEIGHT + 90);
        // Se todos os BHs saíram e não matou — spawn nova fileira
        if (blackHolesR.current.length === 0) {
          const bhCount = Math.ceil(GAME_WIDTH / (BH_W + 2));
          for (let i = 0; i < bhCount; i++) {
            blackHolesR.current.push({ id: bhid++, x: i * (BH_W + 2), y: -BH_H - 5, born: Date.now() });
          }
        }
      }
    }

    // Respiro pós-monster: conta regressiva, bloqueia spawn e velocidade
    const inBreak = monsterKillBreakMs.current > 0;
    if (inBreak) monsterKillBreakMs.current = Math.max(0, monsterKillBreakMs.current - delta);
    // Velocidade efetiva: 0 durante monster ativo OU durante o respiro pós-monster
    const effectiveSpeed = (hasMonster || inBreak) ? 0 : speed;

    // ── Mover objetos direto nas refs (zero setState, zero alocação de array) ──
    // Obstáculos, aliens, projéteis PARAM enquanto houver monster ativo ou respiro (só planetas e buracos negros continuam)
    if (!hasMonster && !inBreak) {
      const dy0 = freeze ? 0 : effectiveSpeed;
      // obstáculos — move Y in-place, remove os que saíram da tela
      for (let i = obstaclesR.current.length - 1; i >= 0; i--) { obstaclesR.current[i].y += dy0; if (obstaclesR.current[i].y >= GAME_HEIGHT + 60) obstaclesR.current.splice(i, 1); }
      // aliens — move Y e acumula shootTimer in-place
      const dyA = freeze ? 0 : effectiveSpeed * 1.1;
      for (let i = aliensR.current.length - 1; i >= 0; i--) { aliensR.current[i].y += dyA; aliensR.current[i].shootTimer += delta; if (aliensR.current[i].y >= GAME_HEIGHT + 60) aliensR.current.splice(i, 1); }
      // projéteis — move Y in-place
      if (!freeze) { for (let i = projectilesR2.current.length - 1; i >= 0; i--) { projectilesR2.current[i].y += projectilesR2.current[i].vy; if (projectilesR2.current[i].y >= GAME_HEIGHT + 40) projectilesR2.current.splice(i, 1); } }
    } else {
      // apenas zera o shootTimer dos aliens (não move, não atira)
      for (let i = 0; i < aliensR.current.length; i++) aliensR.current[i].shootTimer = 0;
    }
    // bonus — move Y in-place
    { const dyB = freeze ? 0 : speed * 0.7; for (let i = bonusItemsR.current.length - 1; i >= 0; i--) { bonusItemsR.current[i].y += dyB; if (bonusItemsR.current[i].y >= GAME_HEIGHT + 60) bonusItemsR.current.splice(i, 1); } }
    // Planetas e buracos negros continuam SEMPRE (mesmo com monster e respiro)
    { const dyP = freeze ? 0 : speed * 0.85; for (let i = planetsR.current.length - 1; i >= 0; i--) { planetsR.current[i].y += dyP; if (planetsR.current[i].y >= GAME_HEIGHT + 80) planetsR.current.splice(i, 1); } }
    { const dyBH = freeze ? 0 : speed * 0.65; for (let i = blackHolesR.current.length - 1; i >= 0; i--) { blackHolesR.current[i].y += dyBH; if (blackHolesR.current[i].y >= GAME_HEIGHT + 90) blackHolesR.current.splice(i, 1); } }
    { const dyM = effectiveSpeed * 0.45; for (let i = moonItemsR.current.length - 1; i >= 0; i--) { moonItemsR.current[i].y += dyM; if (moonItemsR.current[i].y >= GAME_HEIGHT + 100) moonItemsR.current.splice(i, 1); } }
    // Monster: desce até MONSTER_STOP_Y e depois faz vaivém horizontal
    monstersR2.current = monstersR2.current.map(m => {
      if (!m.arrived) {
        const newY = m.y + speed * 1.4;
        if (newY >= MONSTER_STOP_Y) return { ...m, y: MONSTER_STOP_Y, arrived: true };
        return { ...m, y: newY };
      }
      // vaivém horizontal: inverte ao bater nas bordas
      let newX = m.x + m.vx;
      let newVx = m.vx;
      const margin = 6;
      if (newX <= margin) { newX = margin; newVx = Math.abs(m.vx); }
      else if (newX + m.width >= GAME_WIDTH - margin) { newX = GAME_WIDTH - margin - m.width; newVx = -Math.abs(m.vx); }
      return { ...m, x: newX, vx: newVx };
    });
    // balas inimigas — move in-place e filtra
    for (let i = enemyBulletsR.current.length - 1; i >= 0; i--) { const b = enemyBulletsR.current[i]; b.x += b.vx; b.y += b.vy; if (b.y >= GAME_HEIGHT + 20 || b.y < -30 || b.x < -20 || b.x > GAME_WIDTH + 20) enemyBulletsR.current.splice(i, 1); }
    // cap balas inimigas para evitar acúmulo
    if (enemyBulletsR.current.length > 40) enemyBulletsR.current.splice(0, enemyBulletsR.current.length - 40);
    // balas do jogador — move in-place e filtra
    for (let i = playerBulletsR.current.length - 1; i >= 0; i--) { playerBulletsR.current[i].y += playerBulletsR.current[i].vy; if (playerBulletsR.current[i].y < -PLAYER_BULLET_H) playerBulletsR.current.splice(i, 1); }

    // Aliens atiram — vy fixo reto pra baixo (sem mira), bloqueado durante monster
    if (aliensR.current.length > 0 && !freeze && !bossRef.current && !hasMonster) {
      const alienInterval = Math.max(2200 - scoreRef.current * 0.15, 1100);
      const newAlienBullets: EnemyBullet[] = [];
      aliensR.current = aliensR.current.map(a => {
        if (a.y < 0) return a;
        if (a.shootTimer >= alienInterval) {
          const cx = a.x + a.width / 2 - ENEMY_BULLET_W / 2;
          const by = a.y + a.height;
          // bala reta pra baixo — sem mira, sem perseguição
          newAlienBullets.push({ id: ebid++, x: cx, y: by, vx: 0, vy: 5, type: 'normal' });
          return { ...a, shootTimer: 0 };
        }
        return a;
      });
      if (newAlienBullets.length > 0) { enemyBulletsR.current.push(...newAlienBullets); if (enemyBulletsR.current.length > 80) enemyBulletsR.current.splice(0, enemyBulletsR.current.length - 80); }
    }

    // Score — incrementa a ref e o state React juntos, mas o state só dispara render
    // quando o segundo dígito muda (a cada 10 pts), poupando re-renders no Android
    if (!bossDefeatedRef.current) {
      scoreTimerRef.current += delta;
      if (scoreTimerRef.current >= 100) {
        scoreTimerRef.current = 0;
        const prev = scoreRef.current;
        const next = prev + 1;
        scoreRef.current = next;
        scoreRenderRef.current = next;
        // setScore (React state) só quando dezena muda → 10x menos re-renders por score
        if (next % 10 === 0) setScore(next);
      }
    }

    // Spawns de obstáculos/aliens/projéteis/planetas/monsters BLOQUEADOS na missão bônus
    if (!isBonusMission) {
    // Spawns de obstáculos/aliens/projéteis BLOQUEADOS enquanto houver monster ativo OU respiro pós-monster
    if (!hasMonster && !inBreak) {
      spawnTimerRef.current += delta;
      if (spawnTimerRef.current >= getSpawnInterval(scoreRef.current)) { spawnTimerRef.current = 0; spawnObstacle(); }

      if (scoreRef.current > 50) {
        alienTimerRef.current += delta;
        const alienInterval = Math.max(5000 - Math.floor(scoreRef.current / 100) * 500, 2500);
        if (alienTimerRef.current >= alienInterval) { alienTimerRef.current = 0; spawnAlien(); }
      }

      if (scoreRef.current >= PROJ_SCORE_START) {
        projTimerRef.current += delta;
        const projInterval = Math.max(3200 - Math.floor((scoreRef.current - PROJ_SCORE_START) / 100) * 300, 1200);
        if (projTimerRef.current >= projInterval) { projTimerRef.current = 0; spawnProjectile(); }
      }
    }

    // Planetas e buracos negros: spawn independente (mesmo com monster)
    const planetThreshold = Math.floor(scoreRef.current / PLANET_SCORE_START);
    if (scoreRef.current >= PLANET_SCORE_START && planetThreshold > lastPlanetScore.current) { lastPlanetScore.current = planetThreshold; spawnPlanet(); }

    const bhThreshold = Math.floor(scoreRef.current / BH_EVERY);
    if (scoreRef.current >= BH_EVERY && bhThreshold > lastBHScore.current) { lastBHScore.current = bhThreshold; spawnBlackHole(); }

    // Lua: NUNCA aparece com monster ativo
    const moonThreshold = Math.floor(scoreRef.current / MOON_EVERY);
    if (scoreRef.current >= MOON_EVERY && moonThreshold > lastMoonScore.current) {
      lastMoonScore.current = moonThreshold;
      if (!hasMonster) spawnMoon();
    }

    if (scoreRef.current >= MONSTER_SCORE_START && scoreRef.current < BOSS_SCORE && !bossRef.current && !bossDefeatedRef.current) {
      const monThreshold = Math.floor((scoreRef.current - MONSTER_SCORE_START) / MONSTER_EVERY);
      if (monThreshold > lastMonsterScore.current) {
        lastMonsterScore.current = monThreshold;
        spawnMonster();
        // Avisa se jogador não tem munição nenhuma
        if (fireLevelRef.current === 0) {
          setMonsterWarnActive(true);
        }
      }
    }

    // Dica do astronauta durante o jogo — dispara a cada 300pts (exceto quando monster/boss ativo)
    const tipThreshold = Math.floor(scoreRef.current / 300);
    if (tipThreshold > 0 && tipThreshold > midGameTipThresholdRef.current && !midGameTipActiveRef.current && monstersR2.current.length === 0 && !bossRef.current) {
      midGameTipThresholdRef.current = tipThreshold;
      midGameTipActiveRef.current = true;
      setMidGameTipActive(true);
      // Cancela qualquer timer anterior e agenda fechamento seguro
      if (midGameTipTimerRef.current) clearTimeout(midGameTipTimerRef.current);
      midGameTipTimerRef.current = setTimeout(() => {
        midGameTipActiveRef.current = false;
        setMidGameTipActive(false);
        midGameTipTimerRef.current = null;
      }, 5000);
    }

    // ── Timer Gun4: acumula ms com fireLevel===4, aviso imediato + repete a cada 7s ──
    if (fireLevelRef.current === 4) {
      const prevMs = fireGun4TimerMs.current;
      fireGun4TimerMs.current += delta;
      const curMs = fireGun4TimerMs.current;

      // Dispara aviso imediatamente (primeiro frame com gun4, prevMs===0)
      // e depois a cada FIREGUN4_WARN_MS (7s)
      const prevCycle = prevMs === 0 ? -1 : Math.floor(prevMs / FIREGUN4_WARN_MS);
      const curCycle  = Math.floor(curMs / FIREGUN4_WARN_MS);
      if (curCycle > prevCycle || prevMs === 0) {
        gun4WarnShownRef.current = true;
        setGun4WarnActive(true);
        // Spawna bonus2 se não houver nenhum na tela
        if (bonus2ItemsR.current.length === 0) {
          const b2x = 20 + Math.random() * (GAME_WIDTH - BONUS2_W - 40);
          bonus2ItemsR.current = [{ id: bid++, x: b2x, y: -BONUS2_H - 5 }];
        }
      }
      // Perigo aos 14s — planetas ficam 35% maiores
      if (curMs >= FIREGUN4_DANGER_MS) {
        setGun4Danger(true);
      }
      // MEGA: a partir da 4ª notificação (ciclo ≥ 3) → planetas 100% maiores
      if (curCycle >= 3) {
        setGun4Mega(true);
      }
    } else {
      // Saiu do gun4 (pegou bonus2 ou perdeu arma) → reseta tudo
      if (fireGun4TimerMs.current > 0) {
        fireGun4TimerMs.current = 0;
        gun4WarnShownRef.current = false;
        setGun4Danger(false);
        setGun4Mega(false);
        bonus2ItemsR.current = [];
      }
    }

    // Mover bonus2 com a velocidade dos obstáculos (in-place, zero alocação)
    { const dyB2 = freeze ? 0 : effectiveSpeed * 0.7; for (let i = bonus2ItemsR.current.length - 1; i >= 0; i--) { bonus2ItemsR.current[i].y += dyB2; if (bonus2ItemsR.current[i].y >= GAME_HEIGHT + 60) bonus2ItemsR.current.splice(i, 1); } }

    if (scoreRef.current >= BOSS_SCORE && !bossRef.current && !bossDefeatedRef.current) {
      spawnBoss();
      setGamePhase(5); // 🌞 Boss = próximo ao Sol
    }
    } // fim do bloco !isBonusMission

    // 🔫 Tiro da nave
    if (fireLevelRef.current > 0 && !bossDefeatedRef.current) {
      playerBulletTimerRef.current += delta;
      const fireInterval = Math.max(500 - (fireLevelRef.current - 1) * 80, 260);
      if (playerBulletTimerRef.current >= fireInterval) {
        playerBulletTimerRef.current = 0;
        const bx = planeXRef.current + PLANE_W / 2 - PLAYER_BULLET_W / 2;
        const newBullets: PlayerBullet[] = [{ id: pbid++, x: bx, y: PLANE_Y - PLAYER_BULLET_H, vy: -12 }];
        if (fireLevelRef.current >= 3) {
          newBullets.push({ id: pbid++, x: bx - 14, y: PLANE_Y - PLAYER_BULLET_H, vy: -12 });
          newBullets.push({ id: pbid++, x: bx + 14, y: PLANE_Y - PLAYER_BULLET_H, vy: -12 });
        }
        playerBulletsR.current.push(...newBullets);
      }
    }

    // 🎯 Balas do jogador vs inimigos — tudo em refs
    if (playerBulletsR.current.length > 0) {
      const remainingPB: PlayerBullet[] = [];
      const hpMapObs = obstacleHPsR.current;
      const hpMapAli = alienHPsR2.current;

      for (const pb of playerBulletsR.current) {
        let hit = false;
        for (const o of obstaclesR.current) {
          const ox = (o.x / 100) * GAME_WIDTH;
          if (!hit && pb.x < ox + o.width && pb.x + PLAYER_BULLET_W > ox && pb.y < o.y + o.height && pb.y + PLAYER_BULLET_H > o.y) {
            const curHp = hpMapObs.get(o.id) ?? OBSTACLE_HP[o.type] ?? 1;
            const newHp = curHp - 1;
            if (newHp <= 0) {
              hpMapObs.delete(o.id);
              obstaclesR.current = obstaclesR.current.filter(x => x.id !== o.id);
                const sparks = makeSparks(6, ox + o.width/2, o.y + o.height/2, 6, ['#ff9900']);
              particlesR.current.push(...sparks); if (particlesR.current.length > PARTICLE_CAP) particlesR.current.splice(0, particlesR.current.length - PARTICLE_CAP);
              playHit();
            } else hpMapObs.set(o.id, newHp);
            hit = true;
          }
        }
        if (!hit) {
          for (const a of aliensR.current) {
            if (!hit && pb.x < a.x + a.width && pb.x + PLAYER_BULLET_W > a.x && pb.y < a.y + a.height && pb.y + PLAYER_BULLET_H > a.y) {
              const curHp = hpMapAli.get(a.id) ?? ALIEN_HP;
              const newHp = curHp - 1;
              if (newHp <= 0) {
                hpMapAli.delete(a.id);
                aliensR.current = aliensR.current.filter(x => x.id !== a.id);
                const sparks = makeSparks(8, a.x + a.width/2, a.y + a.height/2, 7, ['#00ff80']);
                particlesR.current.push(...sparks); if (particlesR.current.length > PARTICLE_CAP) particlesR.current.splice(0, particlesR.current.length - PARTICLE_CAP);
                playHit();
              } else hpMapAli.set(a.id, newHp);
              hit = true;
            }
          }
        }
        if (!hit) {
          for (let mi = 0; mi < monstersR2.current.length; mi++) {
            const m = monstersR2.current[mi];
            if (!hit && pb.x < m.x + m.width && pb.x + PLAYER_BULLET_W > m.x && pb.y < m.y + m.height && pb.y + PLAYER_BULLET_H > m.y) {
              const newHp = m.hp - 1;
              if (newHp <= 0) {
                monstersR2.current = monstersR2.current.filter(x => x.id !== m.id);
                const sparks = makeSparks(14, m.x + m.width/2, m.y + m.height/2, 9, ['#ff4400','#ff9900','#ffcc00','#fff']);
                particlesR.current.push(...sparks); if (particlesR.current.length > PARTICLE_CAP) particlesR.current.splice(0, particlesR.current.length - PARTICLE_CAP);
                explosionsR.current.push({ id: eid++, x: m.x, y: m.y }); if (explosionsR.current.length > 4) explosionsR.current.splice(0, explosionsR.current.length - 4);
                playHit();
                // 🕐 Respiro de 3s após matar monster: limpa tela e pausa spawn
                monsterKillBreakMs.current = 3000;
                // 🔄 Reseta velocidade para o início (offset = score atual)
                speedOffsetRef.current = scoreRef.current;
                obstaclesR.current = []; aliensR.current = []; projectilesR2.current = [];
                enemyBulletsR.current = [];
                spawnTimerRef.current = 0; alienTimerRef.current = 0; projTimerRef.current = 0;
                // 🔑 Registra kill para sistema de password
                monstersKilledRef.current += 1;
                // 🌌 Muda o fundo para a próxima fase (1→4, depois boss usa fase 5)
                setGamePhase(Math.min(monstersKilledRef.current, 4));
              } else monstersR2.current[mi] = { ...m, hp: newHp };
              hit = true;
            }
          }
        }
        if (!hit && bossRef.current) {
          const b = bossRef.current;
          if (pb.x < b.x + b.width && pb.x + PLAYER_BULLET_W > b.x && pb.y < b.y + b.height && pb.y + PLAYER_BULLET_H > b.y) {
            const newHp = b.hp - 1;
            if (newHp <= 0) {
              setBoss(null); bossRef.current = null;
              setBossDefeated(true); bossDefeatedRef.current = true;
              bgMusic.fadeTo(0, 400); sndBossMusic.fadeTo(0, 400); sndCampeao.play();
              const sparks = makeSparks(40, b.x + b.width/2, b.y + b.height/2, 12, ['#ff4400','#ff9900','#ffcc00','#fff','#ff00ff']);
              particlesR.current.push(...sparks); if (particlesR.current.length > PARTICLE_CAP) particlesR.current.splice(0, particlesR.current.length - PARTICLE_CAP);
              explosionsR.current = [{ id: eid++, x: b.x, y: b.y }, { id: eid++, x: b.x+30, y: b.y+20 }];
              // Vai para créditos após 2.5s (tempo da explosão)
              setTimeout(() => {
                setCreditsChars(0); setCreditsDone(false);
                setScreen('credits');
              }, 2500);
            } else {
              const phase = newHp <= Math.floor(b.maxHp / 2) ? 2 : 1;
              const upd = { ...b, hp: newHp, phase };
              setBoss(upd); bossRef.current = upd;
            }
            hit = true;
          }
        }
        if (!hit) remainingPB.push(pb);
      }
      playerBulletsR.current = remainingPB;
    }

    // 🔴 Tiro dos Monsters — só atira depois de chegar ao topo (arrived)
    if (monstersR2.current.length > 0 && !freeze) {
      monstersR2.current = monstersR2.current.map(m => {
        if (!m.arrived) return m; // ainda descendo, não atira
        const interval = Math.max(2800 - scoreRef.current * 0.3, 1200);
        const newTimer = m.shootTimer + delta;
        if (newTimer >= interval) {
          const cx = m.x + m.width / 2 - ENEMY_BULLET_W / 2;
          const by = m.y + m.height;
          const dx = planeXRef.current + PLANE_W / 2 - (m.x + m.width / 2);
          const dy = PLANE_Y - by;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const spd = 4.5, spread = 1.8;
          const vxC = (dx / dist) * spd, vyC = (dy / dist) * spd;
          enemyBulletsR.current.push(
            { id: ebid++, x: cx, y: by, vx: vxC, vy: vyC, type: 'normal' },
            { id: ebid++, x: cx - 10, y: by, vx: vxC - spread, vy: vyC, type: 'normal' },
            { id: ebid++, x: cx + 10, y: by, vx: vxC + spread, vy: vyC, type: 'normal' },
          );
          return { ...m, shootTimer: 0 };
        }
        return { ...m, shootTimer: newTimer };
      });
    }

    // 💀 Tiro do Boss
    if (bossRef.current && !freeze) {
      const b = bossRef.current;
      const interval = b.phase >= 2 ? 800 : 1400;
      const newTimer = b.shootTimer + delta;
      if (newTimer >= interval) {
        const cx = b.x + b.width / 2 - ENEMY_BULLET_W / 2;
        const by = b.y + b.height;
        const dx = planeXRef.current + PLANE_W / 2 - (b.x + b.width / 2);
        const dy = PLANE_Y - by;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 5.5, spread = 2.2;
        const vxC = (dx / dist) * spd, vyC = (dy / dist) * spd;
        const newBullets: EnemyBullet[] = [
          { id: ebid++, x: cx, y: by, vx: vxC, vy: vyC, type: 'normal' },
          { id: ebid++, x: cx - 14, y: by, vx: vxC - spread, vy: vyC, type: 'normal' },
          { id: ebid++, x: cx + 14, y: by, vx: vxC + spread, vy: vyC, type: 'normal' },
        ];
        if (b.phase >= 2) { newBullets.push({ id: ebid++, x: cx - 8, y: by + 8, vx: vxC - spread * 0.5, vy: vyC + 1, type: 'boss1' }, { id: ebid++, x: cx + 8, y: by + 8, vx: vxC + spread * 0.5, vy: vyC + 1, type: 'boss1' }); }
        if (b.hp <= 2) { newBullets.push({ id: ebid++, x: cx - 20, y: by, vx: vxC - spread * 1.5, vy: vyC - 0.5, type: 'boss2' }, { id: ebid++, x: cx + 20, y: by, vx: vxC + spread * 1.5, vy: vyC - 0.5, type: 'boss2' }); }
        enemyBulletsR.current.push(...newBullets);
        const upd = { ...b, shootTimer: 0 }; setBoss(upd); bossRef.current = upd;
      } else { const upd = { ...b, shootTimer: newTimer }; setBoss(upd); bossRef.current = upd; }
    }

    // 💀 Movimento horizontal do Boss (vaivém, acelera na fase 2 e quando quase morto)
    if (bossRef.current && !freeze) {
      const b = bossRef.current;
      const speed = b.hp <= 2 ? 3.2 : b.phase >= 2 ? 2.4 : 1.6;
      let newX = b.x + b.vx * speed;
      let newVx = b.vx;
      const margin = 8;
      if (newX <= margin) { newX = margin; newVx = Math.abs(b.vx); }
      else if (newX + b.width >= GAME_WIDTH - margin) { newX = GAME_WIDTH - margin - b.width; newVx = -Math.abs(b.vx); }
      const moved = { ...b, x: newX, vx: newVx };
      setBoss(moved); bossRef.current = moved;
    }

    // Bonus por timer fixo de 7s — só quando NÃO tem monster nem boss ativo
    if (!hasMonster && !bossRef.current) {
      bonusSpawnTimerRef.current += delta;
      if (bonusSpawnTimerRef.current >= 7000 && !bonusActiveRef.current && bonusItemsR.current.length === 0) {
        bonusSpawnTimerRef.current = 0;
        spawnBonus();
      }
    } else {
      // Reseta o timer normal quando entra em monster/boss para começar do zero ao sair
      bonusSpawnTimerRef.current = 0;
    }

    // Durante MONSTER ativo: força bonus a cada 8s (garante munição para o player)
    if (hasMonster) {
      monsterBonusTimerRef.current += delta;
      if (monsterBonusTimerRef.current >= 8000) {
        monsterBonusTimerRef.current = 0;
        if (bonusItemsR.current.length === 0) spawnBonus();
      }
    } else {
      monsterBonusTimerRef.current = 0;
    }

    // Durante o boss: garante spawn de bonus a cada 8s (sem munição: a cada 5s)
    if (bossRef.current) {
      bossBonusTimerRef.current += delta;
      const bossInterval = fireLevelRef.current === 0 ? 5000 : 8000;
      if (bossBonusTimerRef.current >= bossInterval) {
        bossBonusTimerRef.current = 0;
        if (bonusItemsR.current.length === 0) spawnBonus();
      }
    } else {
      bossBonusTimerRef.current = 0;
    }

    if (bonusActiveRef.current) {
      bonusTimerMs.current -= delta;
      if (bonusTimerMs.current <= 0) {
        bonusTimerMs.current = 0; setBonusActive(false); bonusActiveRef.current = false;
        bonusTimeLeftRef.current = 0;
      } else {
        bonusTimeLeftRef.current = Math.ceil(bonusTimerMs.current / 1000);
      }
    }

    // ❄️ Freeze timer
    if (freeze) {
      freezeTimerMs.current -= delta;
      if (freezeTimerMs.current <= 0) {
        freezeTimerMs.current = 0; freezeActiveRef.current = false;
        setFreezeActive(false); freezeTimeLeftRef.current = 0;
        obstaclesR.current = []; aliensR.current = []; projectilesR2.current = [];
        planetsR.current = []; blackHolesR.current = [];
        spawnTimerRef.current = 0; alienTimerRef.current = 0; projTimerRef.current = 0;
        setMoonRpgActive(false); sndGravidadeLuna.stop();
      } else { freezeTimeLeftRef.current = Math.ceil(freezeTimerMs.current / 1000); }
    }

    const px = planeXRef.current, py = PLANE_Y, hb = 13;

    // Colisões com o jogador
    if (!invincRef.current && !bonusActiveRef.current) {
      for (const o of obstaclesR.current) {
        const ox = (o.x / 100) * GAME_WIDTH;
        if (px + hb < ox + o.width - hb && px + PLANE_W - hb > ox + hb && py + hb < o.y + o.height - hb && py + PLANE_H - hb > o.y + hb) {
          deathCauseRef.current = 'obstacle'; takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop); return;
        }
      }
    }

    let collected = false;
    bonusItemsR.current = bonusItemsR.current.filter(b => {
      if (!collected && px + hb < b.x + BONUS_W - 4 && px + PLANE_W - hb > b.x + 4 && py + hb < b.y + BONUS_H - 4 && py + PLANE_H - hb > b.y + 4) {
        collected = true;
        setBonusActive(true); bonusActiveRef.current = true; bonusTimerMs.current = BONUS_SECS * 1000; bonusTimeLeftRef.current = BONUS_SECS;
        alienTimerRef.current = 9999;
        const newStreak = bonusStreakRef.current + 1;
        if (newStreak % FIRE_STREAK_NEEDED === 0) {
          const newFire = Math.min(fireLevelRef.current + 1, MAX_FIRE_LEVEL);
          fireLevelRef.current = newFire; setFireLevel(newFire);
        }
        if (newStreak >= BONUS_STREAK_NEEDED) {
          bonusStreakRef.current = 0; setBonusStreak(0);
          const gained = Math.min(livesRef.current + 1, MAX_LIVES);
          if (gained > livesRef.current) {
            livesRef.current = gained; setLives(gained);
            sndVidaExtra.play(); setExtraLifeAnim(true);
            setTimeout(() => setExtraLifeAnim(false), 2200);
            // ── SPACESTART: 7 vidas + bônus ativo = modo invencível 7s ──
            if (gained >= 7 && bonusActiveRef.current && !spaceStartRef.current) {
              spaceStartRef.current = true;
              spaceStartTimerRef.current = 7000;
              setSpaceStartActive(true);
              invincRef.current = true;
              setInvincible(true);
            }
          }
        } else { bonusStreakRef.current = newStreak; setBonusStreak(newStreak); }
  const sparks = makeSparks(18, b.x + BONUS_W / 2, b.y + BONUS_H / 2, 8, ['#ffd700','#fff700','#ffaa00','#fff']);
  particlesR.current.push(...sparks); if (particlesR.current.length > PARTICLE_CAP) particlesR.current.splice(0, particlesR.current.length - PARTICLE_CAP);
        return false;
      }
      return true;
    });

    // Coleta bonus2 → downgrade gun4 → gun3, reseta timer e perigo
    bonus2ItemsR.current = bonus2ItemsR.current.filter(b => {
      if (px + hb < b.x + BONUS2_W - 4 && px + PLANE_W - hb > b.x + 4 && py + hb < b.y + BONUS2_H - 4 && py + PLANE_H - hb > b.y + 4) {
        fireLevelRef.current = 3; setFireLevel(3);
        fireGun4TimerMs.current = 0; gun4WarnShownRef.current = false;
        setGun4Danger(false); setGun4Mega(false); setGun4WarnActive(false);
  const sparks = makeSparks(16, b.x + BONUS2_W / 2, b.y + BONUS2_H / 2, 8, ['#00ffcc','#00ddff','#88ffee','#ffffff']);
  particlesR.current.push(...sparks); if (particlesR.current.length > PARTICLE_CAP) particlesR.current.splice(0, particlesR.current.length - PARTICLE_CAP);
        return false;
      }
      return true;
    });

    if (!invincRef.current) {
      for (const a of aliensR.current) {
        if (px + hb < a.x + a.width - hb && px + PLANE_W - hb > a.x + hb && py + hb < a.y + a.height - hb && py + PLANE_H - hb > a.y + hb) {
          if (bonusActiveRef.current) { setBonusActive(false); bonusActiveRef.current = false; bonusTimerMs.current = 0; bonusTimeLeftRef.current = 0; }
          aliensR.current = aliensR.current.filter(x => x.id !== a.id);
          deathCauseRef.current = 'alien'; takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop); return;
        }
      }
    }

    if (!invincRef.current && !bonusActiveRef.current) {
      for (const pr of projectilesR2.current) {
        const hbp = 6;
        if (px + hbp < pr.x + PROJ_W - hbp && px + PLANE_W - hbp > pr.x + hbp && py + hbp < pr.y + PROJ_H - hbp && py + PLANE_H - hbp > pr.y + hbp) {
          projectilesR2.current = projectilesR2.current.filter(x => x.id !== pr.id);
          deathCauseRef.current = 'projectile'; takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop); return;
        }
      }
    }

    if (!invincRef.current && !bonusActiveRef.current) {
      for (const pl of planetsR.current) {
        if (pl.type === 'jupiter' || pl.type === 'saturn') continue; // gigantes tratados abaixo
        const hbp = 10;
        if (px + hbp < pl.x + pl.width - hbp && px + PLANE_W - hbp > pl.x + hbp && py + hbp < pl.y + pl.height - hbp && py + PLANE_H - hbp > pl.y + hbp) {
          planetsR.current = planetsR.current.filter(x => x.id !== pl.id);
          deathCauseRef.current = pl.type as DeathCause; takeDamage(px, py, scoreRef.current, 1);
          rafRef.current = requestAnimationFrame(loop); return;
        }
      }
    }

    // Júpiter e Saturno: 3 corações de dano — ignoram bonus e inimizade (massa gigante!)
    if (!invincRef.current) {
      for (const pl of planetsR.current) {
        if (pl.type !== 'jupiter' && pl.type !== 'saturn') continue;
        const hbp = 10;
        if (px + hbp < pl.x + pl.width - hbp && px + PLANE_W - hbp > pl.x + hbp && py + hbp < pl.y + pl.height - hbp && py + PLANE_H - hbp > pl.y + hbp) {
          planetsR.current = planetsR.current.filter(x => x.id !== pl.id);
          // remove bonus se ativo
          if (bonusActiveRef.current) { setBonusActive(false); bonusActiveRef.current = false; bonusTimerMs.current = 0; bonusTimeLeftRef.current = 0; }
          deathCauseRef.current = pl.type as DeathCause; takeDamage(px, py, scoreRef.current, 3);
          rafRef.current = requestAnimationFrame(loop); return;
        }
      }
    }

    for (const mn of moonItemsR.current) {
      const hbm = 8;
      if (px + hbm < mn.x + MOON_W - hbm && px + PLANE_W - hbm > mn.x + hbm && py + hbm < mn.y + MOON_H - hbm && py + PLANE_H - hbm > mn.y + hbm) {
        moonItemsR.current = [];
        const gained = Math.min(livesRef.current + 2, MAX_LIVES); livesRef.current = gained; setLives(gained);
        freezeActiveRef.current = true; setFreezeActive(true); freezeTimerMs.current = FREEZE_SECS * 1000; freezeTimeLeftRef.current = FREEZE_SECS;
        setMoonCollectAnim(true); setTimeout(() => setMoonCollectAnim(false), 2800);
        setMoonRpgActive(true); sndGravidadeLuna.play();
  const sparks = makeSparks(28, mn.x + MOON_W / 2, mn.y + MOON_H / 2, 10, ['#ffffff','#ccddff','#aabbff','#e0f0ff']);
  particlesR.current.push(...sparks); if (particlesR.current.length > PARTICLE_CAP) particlesR.current.splice(0, particlesR.current.length - PARTICLE_CAP);
        rafRef.current = requestAnimationFrame(loop); return;
      }
    }

    if (!invincRef.current) {
      for (const m of monstersR2.current) {
        const hbm = 10;
        if (px + hbm < m.x + m.width - hbm && px + PLANE_W - hbm > m.x + hbm && py + hbm < m.y + m.height - hbm && py + PLANE_H - hbm > m.y + hbm) {
          if (bonusActiveRef.current) { setBonusActive(false); bonusActiveRef.current = false; bonusTimerMs.current = 0; bonusTimeLeftRef.current = 0; }
          monstersR2.current = monstersR2.current.filter(x => x.id !== m.id);
          deathCauseRef.current = 'alien'; takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop); return;
        }
      }
    }

    if (!invincRef.current && !bonusActiveRef.current) {
      for (const eb of enemyBulletsR.current) {
        const hbe = 5;
        if (px + hbe < eb.x + ENEMY_BULLET_W - hbe && px + PLANE_W - hbe > eb.x + hbe && py + hbe < eb.y + ENEMY_BULLET_H - hbe && py + PLANE_H - hbe > eb.y + hbe) {
          enemyBulletsR.current = enemyBulletsR.current.filter(x => x.id !== eb.id);
          deathCauseRef.current = (eb.type === 'boss1' || eb.type === 'boss2') ? 'boss' : bossRef.current ? 'boss' : 'projectile';
          takeDamage(px, py, scoreRef.current);
          rafRef.current = requestAnimationFrame(loop); return;
        }
      }
    }

    // Colisão com o corpo do boss
    if (!invincRef.current && bossRef.current) {
      const b = bossRef.current;
      const hbb = 12;
      if (px + hbb < b.x + b.width - hbb && px + PLANE_W - hbb > b.x + hbb && py + hbb < b.y + b.height - hbb && py + PLANE_H - hbb > b.y + hbb) {
        deathCauseRef.current = 'boss'; takeDamage(px, py, scoreRef.current);
        rafRef.current = requestAnimationFrame(loop); return;
      }
    }

    for (const bh of blackHolesR.current) {
      // Colisão circular — centro da nave vs centro do buraco negro
      // Raio do BH cobre o anel externo: 55% de BH_W/2 ≈ 22px (era só núcleo ~20px box)
      const bhCx = bh.x + BH_W / 2;
      const bhCy = bh.y + BH_H / 2;
      const planeCx = px + PLANE_W / 2;
      const planeCy = py + PLANE_H / 2;
      const dx = planeCx - bhCx;
      const dy = planeCy - bhCy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const BH_KILL_RADIUS = BH_W * 0.55; // inclui o anel externo
      if (dist < BH_KILL_RADIUS) {
        livesRef.current = 1; setLives(1);
        setBonusActive(false); bonusActiveRef.current = false; bonusTimerMs.current = 0;
        invincRef.current = false; setInvincible(false);
        blackHolesR.current = [];
        deathCauseRef.current = 'blackhole'; takeDamage(px, py, scoreRef.current);
        rafRef.current = requestAnimationFrame(loop); return;
      }
    }

    // Partículas — atualiza e renderiza apenas na taxa configurada (throttle em mobile)
    renderAccRef.current += delta;
    if (renderAccRef.current >= RENDER_FRAME_MS) {
      renderAccRef.current %= RENDER_FRAME_MS;
      // Atualiza partículas in-place para evitar alocações de array todo frame
      let writeIdx = 0;
      for (let i = 0; i < particlesR.current.length; i++) {
        const p = particlesR.current[i];
        const newLife = p.life - 0.035;
        if (newLife > 0) {
          particlesR.current[writeIdx++] = { ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.18, life: newLife };
        }
      }
      particlesR.current.length = Math.min(writeIdx, PARTICLE_CAP);

      // ── Um único re-render por frame (limitado por TARGET_FPS) ──
      setRenderTick(t => t + 1);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [spawnObstacle, spawnBonus, spawnAlien, spawnProjectile, spawnPlanet, spawnBlackHole, spawnMoon, spawnMonster, spawnBoss, triggerExplosion, takeDamage, sndVidaExtra, sndGravidadeLuna, sndCampeao, sndBossMusic, bgMusic, sndRisada]);

  useEffect(() => {
    if (screen === 'playing' || screen === 'bonus_mission') { lastTimeRef.current = performance.now(); rafRef.current = requestAnimationFrame(loop); }
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen, loop]);

  const startGame = useCallback((initialScore = 0, initialMonsterKills = 0) => {
    obstaclesR.current = []; bonusItemsR.current = []; aliensR.current = []; particlesR.current = [];
    explosionsR.current = []; projectilesR2.current = []; planetsR.current = []; blackHolesR.current = [];
    moonItemsR.current = []; monstersR2.current = []; enemyBulletsR.current = []; playerBulletsR.current = [];
    obstacleHPsR.current = new Map(); alienHPsR2.current = new Map();
    setBoss(null); bossRef.current = null;
    setBossDefeated(false); bossDefeatedRef.current = false;
    setFireLevel(0); fireLevelRef.current = 0;
    playerBulletTimerRef.current = 0;
    lastMonsterScore.current = initialMonsterKills - 1; // threshold já passado
    monsterKillBreakMs.current = 0;
    // ⚠️ speedOffsetRef = initialScore → velocidade SEMPRE começa do zero independente do checkpoint
    speedOffsetRef.current = initialScore;
    setScore(initialScore); scoreRef.current = initialScore;
    setPlaneX(GAME_WIDTH / 2 - PLANE_W / 2); setLives(LIVES);
    setBonusActive(false); bonusTimeLeftRef.current = 0; setIsNewRecord(false); setShipSkin('normal');
    setInvincible(false); invincRef.current = false;
    bonusActiveRef.current = false; bonusTimerMs.current = 0; lastBonusScore.current = -1;
    bonusSpawnTimerRef.current = 7000; // spawna imediatamente ao iniciar
    alienTimerRef.current = 0; spawnTimerRef.current = 0; scoreTimerRef.current = 0; projTimerRef.current = 0;
    projectilesR2.current = []; planetsR.current = []; blackHolesR.current = [];
    lastPlanetScore.current = -1; lastBHScore.current = -1; lastMoonScore.current = -1;
    freezeActiveRef.current = false; freezeTimerMs.current = 0;
    setFreezeActive(false); freezeTimeLeftRef.current = 0; setMoonCollectAnim(false);
    setBonusStreak(0); bonusStreakRef.current = 0; setExtraLifeAnim(false);
    rpgShownRef.current = false; setRpgStep(null);
    setMoonRpgActive(false);
    setMonsterWarnActive(false);
    if (midGameTipTimerRef.current) { clearTimeout(midGameTipTimerRef.current); midGameTipTimerRef.current = null; }
    midGameTipActiveRef.current = false; setMidGameTipActive(false); midGameTipThresholdRef.current = 0;
    setGun4WarnActive(false); setGun4Danger(false); setGun4Mega(false);
    fireGun4TimerMs.current = 0; gun4WarnShownRef.current = false;
    bonus2ItemsR.current = [];
    bossBonusTimerRef.current = 0;
    monsterBonusTimerRef.current = 0;
    monstersKilledRef.current = initialMonsterKills;
    setUnlockedPassword(null);
    setPasswordInput(''); setPasswordError('');
    sndRisada.stop(); prevHadMonsterRef.current = false;
    spaceStartRef.current = false; spaceStartTimerRef.current = 0; setSpaceStartActive(false);
    setGamePhase(0);
    setScreen('playing');  }, [sndRisada]);

  // Inicia a missão bônus Interestelar: todos os 4 monsters ao mesmo tempo + timer 60s
  const startBonusMission = useCallback(() => {
    obstaclesR.current = []; bonusItemsR.current = []; aliensR.current = []; particlesR.current = [];
    explosionsR.current = []; projectilesR2.current = []; planetsR.current = []; blackHolesR.current = [];
    moonItemsR.current = []; enemyBulletsR.current = []; playerBulletsR.current = [];
    obstacleHPsR.current = new Map(); alienHPsR2.current = new Map();
    setBoss(null); bossRef.current = null; setBossDefeated(false); bossDefeatedRef.current = false;
    setFireLevel(0); fireLevelRef.current = 0; playerBulletTimerRef.current = 0;
    speedOffsetRef.current = 0;
    setScore(0); scoreRef.current = 0;
    setPlaneX(GAME_WIDTH / 2 - PLANE_W / 2); setLives(LIVES);
    setBonusActive(false); bonusTimeLeftRef.current = 0; setIsNewRecord(false); setShipSkin('normal');
    setInvincible(false); invincRef.current = false;
    bonusActiveRef.current = false; bonusTimerMs.current = 0;
    bonusSpawnTimerRef.current = 7000;
    alienTimerRef.current = 0; spawnTimerRef.current = 0; scoreTimerRef.current = 0; projTimerRef.current = 0;
    lastPlanetScore.current = -1; lastBHScore.current = -1; lastMoonScore.current = -1;
    freezeActiveRef.current = false; freezeTimerMs.current = 0;
    setFreezeActive(false); freezeTimeLeftRef.current = 0; setMoonCollectAnim(false);
    setBonusStreak(0); bonusStreakRef.current = 0; setExtraLifeAnim(false);
    rpgShownRef.current = false; setRpgStep(null); setMoonRpgActive(false);
    setMonsterWarnActive(false);
    if (midGameTipTimerRef.current) { clearTimeout(midGameTipTimerRef.current); midGameTipTimerRef.current = null; }
    midGameTipActiveRef.current = false; setMidGameTipActive(false); midGameTipThresholdRef.current = 0;
    setGun4WarnActive(false); setGun4Danger(false); setGun4Mega(false);
    fireGun4TimerMs.current = 0; gun4WarnShownRef.current = false; bonus2ItemsR.current = [];
    bossBonusTimerRef.current = 0; monsterBonusTimerRef.current = 0;
    monstersKilledRef.current = 0; lastMonsterScore.current = -1; monsterKillBreakMs.current = 0;
    setUnlockedPassword(null); setPasswordInput(''); setPasswordError('');
    sndRisada.stop(); prevHadMonsterRef.current = false;
    bonusVictoryShownRef.current = false; // reseta guard para nova tentativa
    spaceStartRef.current = false; spaceStartTimerRef.current = 0; setSpaceStartActive(false);
    // Spawna os 4 monsters simultaneamente com posições espalhadas
    const types: MonsterType[] = ['monster01','monster02','monster03','monster04'];
    const spacing = (GAME_WIDTH - MONSTER_W * 4 - 10) / 3;
    const startX = 5;
    monstersR2.current = types.map((type, i) => ({
      id: mid++, x: startX + i * (MONSTER_W + spacing), y: -MONSTER_H - 5 - i * 30,
      width: MONSTER_W, height: MONSTER_H, type, hp: MONSTER_HP, maxHp: MONSTER_HP,
      shootTimer: 0, vx: (i % 2 === 0 ? 1 : -1) * 1.4, arrived: false,
    }));
    bonusTimerMsRef.current = 60000; // 60s
    setBonusTimer(60);
    bonusRainRef.current = false; setBonusRain(false); bonusRainTimerRef.current = 0;
    setGamePhase(0);
    setScreen('bonus_mission');
  }, [sndRisada]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screenRef.current !== 'playing' && screenRef.current !== 'bonus_mission') return;
      setPlaneX(x => { if (e.key === 'ArrowLeft') return Math.max(0, x - 24); if (e.key === 'ArrowRight') return Math.min(GAME_WIDTH - PLANE_W, x + 24); return x; });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientX; }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (screenRef.current !== 'playing' && screenRef.current !== 'bonus_mission') return;
    if (touchStartRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartRef.current;
    touchStartRef.current = e.touches[0].clientX;
    // divide pelo scale para converter coordenadas visuais → coordenadas do jogo
    setPlaneX(x => Math.max(0, Math.min(GAME_WIDTH - PLANE_W, x + (dx / scaleRef.current) * 1.3)));
  }, []);
  const onTap = useCallback((e: React.MouseEvent) => {
    if (screenRef.current !== 'playing' && screenRef.current !== 'bonus_mission') return;
    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return;
    // divide pelo scale para converter coordenadas visuais → coordenadas do jogo
    setPlaneX(Math.max(0, Math.min(GAME_WIDTH - PLANE_W, (e.clientX - rect.left) / scaleRef.current - PLANE_W / 2)));
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
    bgMusic.fadeTo(0, 300); sndBonusMusic.fadeTo(0, 300); sndBossMusic.fadeTo(0, 300); cancelAnimationFrame(rafRef.current);
    obstaclesR.current = []; particlesR.current = []; explosionsR.current = [];
    bonusItemsR.current = []; aliensR.current = []; projectilesR2.current = [];
    planetsR.current = []; blackHolesR.current = []; moonItemsR.current = [];
    monstersR2.current = []; enemyBulletsR.current = []; playerBulletsR.current = [];
    setScore(0); setNameInput(''); setNameError('');
    localStorage.removeItem(NM_KEY); setPlayerName(''); setHighScore(0);
    setLives(LIVES); setBonusActive(false); bonusTimeLeftRef.current = 0;
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
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Atingido por um gigante gasoso! Júpiter e Saturno têm massa descomunal — o impacto tira 3 CORAÇÕES de uma vez, e ignora qualquer bônus ativo.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Júpiter: 318 vezes a massa da Terra. Saturno: anéis de gelo e 146 luas. Ambos são morte quase garantida com menos de 3 corações. Não subestime o tamanho deles.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'ESTRATÉGIA: acumule corações via streak de BONUS. Com 6+ corações você sobrevive ao golpe triplo. É a única margem de segurança contra esses gigantes.' },
    ],
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'De novo os gigantes. Lembre: a massa deles é tão brutal que derruba 3 corações instantaneamente — e ainda cancela o bônus! Não existe escudo contra a gravidade de Júpiter.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Saturno tem anéis de gelo de 73.000km de largura. Júpiter tem a Grande Mancha Vermelha: tempestade contínua há 400 anos. Desviar cedo é a única opção viável.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Cada BONUS que você pega sobe o nível da arma. Acumulando BONUS seguidos você ganha vidas extras. Com 7 corações, você sobrevive ao triple-hit dos gigantes.' },
    ],
  ];

  // Grupos gerais — para mortes por meteoro, nuvem, alien, projétil, Netuno
  const RPG_GENERAL_GROUPS = [
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Astronauta... missão comprometida. Recebemos o sinal de ejeção. Você foi atingido. Mas a NASA não abandona seus pilotos.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'ALERTA: Júpiter e Saturno causam DANO TRIPLO — 3 corações de uma vez, e ignoram o bônus! Buraco Negro = morte instantânea. Netuno (azul) tira apenas 1 coração, como meteoros e aliens.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'DICA: colete 4x⚡BONUS seguidos — aquela pilha dourada no HUD — e a base manda VIDA EXTRA. Agora decola. Houston aguarda.' },
    ],
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Piloto, análise do campo: Netuno é o planeta mais ventoso do sistema solar — 2.100 km/h. No jogo ele só tira 1 coração. Use-o como treino de reflexo.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Hierarquia de ameaças: Buraco Negro (instant kill) > Júpiter/Saturno (3 corações de dano, ignora bônus) > aliens/projéteis/meteoros/Netuno (1 coração). Priorize o desvio pelo risco.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'O streak de bônus requer 4 coletas SEM tomar dano. Se levar um golpe, a pilha zera. Planeje as rotas para pegar bônus sem se expor. Houston acredita em você.' },
    ],
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Debrief rápido: a cada 150 pontos um BONUS aparece. A cada 75 pontos pode aparecer um Buraco Negro. A cada 100 pontos surge um planeta.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Os aliens disparam projéteis a partir de 300 pontos. Quanto mais você pontua, mais rápido o campo fica. Ritmo e antecipação são mais importantes que velocidade de reação.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Você tem até 7 corações se manter o streak. Com 7 corações você sobrevive a 3 colisões com gigantes seguidas. Esse é o estado ideal de missão. Força, piloto.' },
    ],
  ];

  // Grupos para morte pelo BOSS FINAL (rotativo entre si)
  const RPG_BOSS_GROUPS = [
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Piloto... você chegou até o Boss Final. Isso já é feito de poucos. Ele tem 20 pontos de HP, se move de lado e atira em rajadas triplas direto em você.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'ATENÇÃO: quando o HP dele cai para 2 ou menos, ele entra em modo berserk. Os tiros ficam roxos — mais rápidos e em mais ângulos. É quando a maioria dos pilotos cai.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'TÁTICA: mantenha o firegun alto e desvie lateralmente. Ele se move mais rápido no berserk — mas você pode prever a direção. Antecipe, não reaja. Você quase zerou.' },
    ],
    [
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'O Boss Final te derrubou de novo. Houston tem o registro: ele muda de fase quando chega à metade do HP — cadência de tiro dobra e os projéteis laranja entram em cena.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'No berserk (HP ≤ 2), tiros roxos surgem nas extremidades. Eles viajam em ângulo — mais difíceis de desviar. Posicione-se no centro e mova só quando necessário.' },
      { speaker: 'CMDT. HOUSTON', avatar: '👨‍🚀', text: 'Cada hit no boss conta. Use o BONUS para aumentar o nível do firegun ANTES do boss aparecer. Com gun4 você reduz o HP dele muito mais rápido. Decola. Houston acredita.' },
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
  } else if (cause === 'boss') {
    const bossCount = gameOverCountRef.current;
    RPG_LINES = RPG_BOSS_GROUPS[(bossCount - 1) % RPG_BOSS_GROUPS.length];
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
      <motion.div key="game-overlay"
        initial={{ opacity: IS_MOBILE_WEB ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: IS_MOBILE_WEB ? 1 : 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(2,2,14,0.98)' }}>
        {/* Botão fechar — oculto no modo app (isApp=true), visível no site */}
        {!isApp && (
          <motion.button onClick={onClose} className="absolute top-3 right-3 z-50 w-11 h-11 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,60,60,0.35)', border: '2px solid rgba(255,100,100,0.8)', boxShadow:'0 0 14px rgba(255,60,60,0.5)' }}
            whileHover={{ scale: 1.15, background:'rgba(255,60,60,0.6)' }} whileTap={{ scale: 0.9 }}>
            <X size={20} style={{ color: '#fff' }} />
          </motion.button>
        )}

        {/* Wrapper que aplica o scale — origin: center */}
        <div style={{ transform: `scale(${gameScale})`, transformOrigin: 'center center', lineHeight: 0, willChange:'transform' }}>
        <motion.div ref={gameRef} animate={shake ? { x: [-7,7,-5,5,-3,3,0] } : {}} transition={{ duration: 0.4 }}
          onClick={onTap} onTouchStart={onTouchStart} onTouchMove={onTouchMove}
          className="relative overflow-hidden select-none"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT, borderRadius: 20,
            background: PHASE_BACKGROUNDS[gamePhase] ?? PHASE_BACKGROUNDS[0],
            border: `1px solid ${bonusActive ? 'rgba(255,215,0,0.5)' : 'rgba(0,150,255,0.25)'}`,
            boxShadow: bonusActive ? '0 0 30px rgba(255,215,0,0.2), inset 0 0 60px rgba(0,0,0,0.5)' : '0 0 30px rgba(0,100,255,0.12), inset 0 0 60px rgba(0,0,0,0.5)',
            cursor: screen === 'playing' ? 'crosshair' : 'default', touchAction: 'none',
            transition: 'background 3s ease, border-color 0.3s, box-shadow 0.3s',
            willChange: 'transform' }}>

          {GAME_STARS.map(s => (
            <div key={s.key} className="absolute rounded-full" style={{ width: s.w, height: s.w, background: s.bg, left: s.left, top: s.top, opacity: s.opacity }} />
          ))}

          {(screen === 'playing' || screen === 'dead') && (
            <div className="absolute top-3 left-0 right-0 flex justify-between items-center px-4 z-10 pointer-events-none">
              <div style={{ fontFamily:'monospace', color:'#00cfff', fontSize:13, fontWeight:700, textShadow:'0 0 8px #00cfff' }}>{String(scoreRenderRef.current).padStart(5,'0')}</div>
              <div className="flex gap-1 items-center flex-wrap justify-center" style={{ maxWidth:100 }}>
                {Array.from({ length: lives }).map((_,i) => (
                  IS_MOBILE_WEB ? (
                    <span key={i} style={{ fontSize:11, filter:'drop-shadow(0 0 4px #ff4444)' }}>❤️</span>
                  ) : (
                  <motion.span key={i}
                    initial={i === lives - 1 && extraLifeAnim ? { scale: 2.2, opacity: 0 } : false}
                    animate={i === lives - 1 && extraLifeAnim ? { scale: 1, opacity: 1 } : {}}
                    transition={{ type:'spring', stiffness:260, damping:14 }}
                    style={{ fontSize:11, filter:'drop-shadow(0 0 4px #ff4444)' }}>❤️</motion.span>
                  )
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
                    <div key={i}
                      style={{
                        width: 9, height: 13 + i * 2, borderRadius: 2,
                        background: filled
                          ? 'linear-gradient(180deg, #fff7aa 0%, #ffd700 35%, #ff9900 75%, #cc6600 100%)'
                          : 'rgba(255,255,255,0.08)',
                        border: filled ? '1px solid rgba(255,200,0,0.7)' : '1px solid rgba(255,255,255,0.12)',
                        boxShadow: filled ? '0 0 6px #ffd700, inset 0 1px 0 rgba(255,255,255,0.4)' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        position: 'relative',
                        animation: filled ? 'streakGlow 1.1s ease-in-out infinite' : 'none',
                      }}>
                      {filled && <div style={{ position:'absolute', top:1, left:1, right:1, height:3, borderRadius:1, background:'rgba(255,255,255,0.45)' }} />}
                    </div>
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
                ⚡ BOOST {bonusTimeLeftRef.current}s
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
                {/* 🔫 Arma atual */}
                {fireLevel > 0 && (
                  <img
                    src={`/GAME/FIREgun${fireLevel}.svg`}
                    alt={`fire${fireLevel}`}
                    style={{ width:18, height:18, objectFit:'contain', filter:'drop-shadow(0 0 6px #ff4400) drop-shadow(0 0 12px #ff8800)', animation:'gunPulse 0.6s ease-in-out infinite' }}
                  />
                )}
              </div>
            </div>
          )}

          {obstaclesR.current.map(o => {
            const ox = (o.x / 100) * GAME_WIDTH;
            const maxHp = OBSTACLE_HP[o.type] ?? 1;
            const curHp = obstacleHPsR.current.get(o.id) ?? maxHp;
            const hpPct = curHp / maxHp;
            const hpColor = hpPct > 0.6 ? '#44ff44' : hpPct > 0.3 ? '#ffcc00' : '#ff3333';
            return (
              <div key={o.id} className="absolute pointer-events-none"
                style={{ transform:`translate3d(${ox}px,${o.y}px,0)`, width:o.width, height:o.height, top:0, left:0, willChange:'transform' }}>
                <img src={`/GAME/${o.type==='meteor'?'meteor':'cloud'}.svg`} alt="" style={{ width:'100%', height:'100%', filter: o.type==='meteor'?'drop-shadow(0 0 5px #ff6b00)':'drop-shadow(0 0 4px #00cfff) brightness(1.2)' }} />
                {curHp < maxHp && (
                  <div style={{ position:'absolute', bottom:-3, left:3, right:3, height:2, background:'rgba(0,0,0,0.5)', borderRadius:1 }}>
                    <div style={{ height:'100%', width:`${hpPct*100}%`, background:hpColor, borderRadius:1 }} />
                  </div>
                )}
              </div>
            );
          })}

          {bonusItemsR.current.map(b => (
            <div key={b.id} className="absolute pointer-events-none"
              style={{ transform:`translate3d(${b.x}px,${b.y}px,0)`, width:BONUS_W, height:BONUS_H, zIndex:8, top:0, left:0, willChange:'transform' }}>
              <img src="/GAME/BONUS.svg" alt="bonus" className="bonus-spin" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 8px #ffd700) drop-shadow(0 0 18px #ffaa00) brightness(1.4)' }} />
            </div>
          ))}

          {/* ⬇️ BONUS2 — downgrade gun4→gun3 */}
          {bonus2ItemsR.current.map(b => (
            <div key={b.id} className="absolute pointer-events-none"
              style={{ transform:`translate3d(${b.x}px,${b.y}px,0)`, width:BONUS2_W, height:BONUS2_H, zIndex:8, top:0, left:0, willChange:'transform' }}>
              <img src="/GAME/bonus2.svg" alt="bonus2" className="bonus-spin-reverse" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 10px #00ffcc) drop-shadow(0 0 20px #00ddaa) brightness(1.4)' }} />
              <div style={{ position:'absolute', bottom:-14, left:'50%', transform:'translateX(-50%)', fontFamily:'monospace', fontSize:6, fontWeight:900, color:'#00ffcc', textShadow:'0 0 6px #00ffcc', whiteSpace:'nowrap', letterSpacing:1 }}>⬇️ DESCARGA</div>
            </div>
          ))}

          {aliensR.current.map(a => {
            const curHp = alienHPsR2.current.get(a.id) ?? ALIEN_HP;
            const hpPct = curHp / ALIEN_HP;
            const hpColor = hpPct > 0.6 ? '#44ff44' : hpPct > 0.3 ? '#ffcc00' : '#ff3333';
            return (
              <div key={a.id} className="absolute pointer-events-none"
                style={{ transform:`translate3d(${a.x}px,${a.y}px,0)`, width:a.width, height:a.height, zIndex:8, top:0, left:0, willChange:'transform' }}>
                <img src="/GAME/ALIEN.svg" alt="alien" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 6px #00ff80) drop-shadow(0 0 14px #00cc60) brightness(1.2)' }} />
                {curHp < ALIEN_HP && (
                  <div style={{ position:'absolute', bottom:-3, left:3, right:3, height:2, background:'rgba(0,0,0,0.5)', borderRadius:1 }}>
                    <div style={{ height:'100%', width:`${hpPct*100}%`, background:hpColor, borderRadius:1 }} />
                  </div>
                )}
              </div>
            );
          })}

          {projectilesR2.current.map(pr => (
            <div key={pr.id} className="absolute pointer-events-none"
              style={{ transform:`translate3d(${pr.x}px,${pr.y}px,0)`, width:PROJ_W, height:PROJ_H, zIndex:7, top:0, left:0, willChange:'transform' }}>
              <img src="/GAME/ALIEN.svg" alt="tiro" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 5px #cc00ff) drop-shadow(0 0 12px #7700ff) hue-rotate(200deg) brightness(1.5) saturate(2)' }} />
            </div>
          ))}

          {/* Planetas — obstáculos elite a cada 100pts */}
          {planetsR.current.map(pl => {
            const filters: Record<PlanetType, string> = {
              neptune: 'drop-shadow(0 0 8px #4488ff) drop-shadow(0 0 18px #2244cc) brightness(1.1)',
              saturn:  'drop-shadow(0 0 8px #ffcc66) drop-shadow(0 0 18px #cc8800) brightness(1.1)',
              jupiter: 'drop-shadow(0 0 8px #ff9944) drop-shadow(0 0 18px #cc5500) brightness(1.1)',
            };
            const isGiant = pl.type === 'jupiter' || pl.type === 'saturn';
            // gun4Mega (4ª notif+) → 100%; gun4Danger (14s) → 35%; gun4 ativo → 20%
            const dangerScale = isGiant
              ? gun4Mega ? 2.0 : gun4Danger ? 1.35 : fireLevel === 4 ? 1.20 : 1
              : 1;
            const dw = Math.round(pl.width  * dangerScale);
            const dh = Math.round(pl.height * dangerScale);
            const dx = pl.x - (dw - pl.width) / 2;
            const dy = pl.y - (dh - pl.height) / 2;
            const dangerFilter = isGiant && gun4Mega
              ? filters[pl.type].replace('brightness(1.1)', 'brightness(1.5)') + ' drop-shadow(0 0 22px #ff0000) drop-shadow(0 0 8px #ff6600)'
              : isGiant && gun4Danger
              ? filters[pl.type].replace('brightness(1.1)', 'brightness(1.3)') + ' drop-shadow(0 0 16px #ff4400)'
              : isGiant && fireLevel === 4
              ? filters[pl.type].replace('brightness(1.1)', 'brightness(1.2)') + ' drop-shadow(0 0 10px #ff8800)'
              : filters[pl.type];
            return (
              <div key={pl.id} className="absolute pointer-events-none"
                style={{ transform:`translate3d(${dx}px,${dy}px,0)`, width:dw, height:dh, zIndex:6, top:0, left:0, willChange:'transform' }}>
                <img src={`/GAME/${pl.type}.svg`} alt={pl.type} style={{ width:'100%', height:'100%', filter: dangerFilter }} />
              </div>
            );
          })}

          {/* Buraco Negro — morte instantânea */}
          {blackHolesR.current.map(bh => {
            // Fase 1 (0–800ms): cresce de 0→1 com easeOutBack
            // Fase 2 (após 800ms): pulsa continuamente entre 0.65 e 1.0 via seno
            const elapsed = Date.now() - bh.born;
            const GROW_MS = 800;
            let bhScale: number;
            if (elapsed < GROW_MS) {
              const t = elapsed / GROW_MS;
              const c1 = 1.70158, c3 = c1 + 1;
              bhScale = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            } else {
              // pulsa: 0.65 a 1.0, período ~1.1s
              const phase = ((elapsed - GROW_MS) / 1100) * Math.PI * 2;
              bhScale = 0.825 + 0.175 * Math.sin(phase);
            }
            return (
            <div key={bh.id} className="absolute pointer-events-none"
              style={{ transform:`translate3d(${bh.x}px,${bh.y}px,0)`, width:BH_W, height:BH_H, zIndex:9, top:0, left:0, willChange:'transform' }}>
              {/* container de escala separado para não interferir com translate3d */}
              <div style={{ width:'100%', height:'100%', transform:`scale(${bhScale})`, transformOrigin:'center center' }}>
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ borderRadius:'50%', animation:'bhGlow 0.9s ease-in-out infinite' }} />
                <img src="/GAME/black-hole.svg" alt="buraco negro"
                  style={{ width:'100%', height:'100%', position:'relative', zIndex:1,
                    filter:'drop-shadow(0 0 10px #fffde0) drop-shadow(0 0 22px #ffd700) brightness(1.2)' }} />
              </div>
            </div>
            );
          })}

          {/* 🌕 Lua — coletável, aparece a cada 500pts */}
          {moonItemsR.current.map(mn => (
            <div key={mn.id} className="absolute pointer-events-none"
              style={{ transform:`translate3d(${mn.x}px,${mn.y}px,0)`, top:0, left:0, width:MOON_W, height:MOON_H, zIndex:10, willChange:'transform' }}>
              {/* Halo suave prateado pulsando — CSS animation em vez de Framer Motion */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ borderRadius:'50%', animation:'moonHalo 2.2s ease-in-out infinite' }} />
              <img
                src="/GAME/MoonVideoGIF.gif"
                alt="lua missao lunar"
                style={{ width:'100%', height:'100%', borderRadius:'50%', position:'relative', zIndex:1,
                  filter:'drop-shadow(0 0 16px rgba(200,220,255,0.8)) drop-shadow(0 0 32px rgba(150,180,255,0.5)) brightness(1.1)',
                  animation:'moonFloat 3s ease-in-out infinite' }}
              />
              {/* Label flutuante */}
              <div
                style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)',
                  fontFamily:'monospace', fontSize:7, fontWeight:900, color:'#cce0ff',
                  textShadow:'0 0 8px #aac8ff', whiteSpace:'nowrap', letterSpacing:1,
                  animation:'moonFloat 1.8s ease-in-out infinite' }}>
                🌕 MISSÃO LUNAR
              </div>
            </div>
          ))}

          {/* 👾 Monsters — com barra de HP */}
          {monstersR2.current.map(m => {
            const hpPct = m.hp / m.maxHp;
            const hpColor = hpPct > 0.6 ? '#44ff44' : hpPct > 0.3 ? '#ffcc00' : '#ff3333';
            return (
              <div key={m.id} className="absolute pointer-events-none" style={{ transform:`translate3d(${m.x}px,${m.y}px,0)`, top:0, left:0, width:m.width, height:m.height, zIndex:11, willChange:'transform' }}>
                <img
                  src={`/GAME/${m.type}.svg`} alt={m.type}
                  style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 10px #ff4400) drop-shadow(0 0 20px #ff8800) brightness(1.2)' }}
                />
                <div style={{ position:'absolute', bottom:-7, left:0, right:0, height:4, background:'rgba(0,0,0,0.6)', borderRadius:2 }}>
                  <div style={{ height:'100%', width:`${hpPct*100}%`, background:hpColor, borderRadius:2, transition:'width 0.1s', boxShadow:`0 0 4px ${hpColor}` }} />
                </div>
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', fontFamily:'monospace', fontSize:7, color:hpColor, textShadow:`0 0 4px ${hpColor}`, fontWeight:900 }}>{m.hp}/{m.maxHp}</div>
              </div>
            );
          })}

          {/* 💀 Boss Final */}
          {boss && (
            <>
              <div className="absolute pointer-events-none" style={{ transform:`translate3d(${boss.x}px,${boss.y}px,0)`, top:0, left:0, width:boss.width, height:boss.height, zIndex:12, willChange:'transform' }}>
                <img
                  src="/GAME/kraken.gif" alt="boss"
                  style={{ width:'100%', height:'100%',
                    filter: boss.hp <= 2
                      ? 'drop-shadow(0 0 18px #ff0000) drop-shadow(0 0 36px #cc0000) brightness(1.4)'
                      : boss.phase >= 2
                      ? 'drop-shadow(0 0 14px #ff6600) drop-shadow(0 0 28px #ff3300) brightness(1.25)'
                      : 'drop-shadow(0 0 10px #aa00ff) drop-shadow(0 0 22px #7700cc) brightness(1.2)'
                  }}
                />
              </div>
              {/* Barra de HP do boss no topo */}
              <div className="absolute pointer-events-none" style={{ top:16, left:12, right:12, zIndex:20 }}>
                <div style={{ fontFamily:'monospace', fontSize:7, color:'#ff6600', letterSpacing:2, fontWeight:900, textShadow:'0 0 6px #ff4400', marginBottom:2, textAlign:'center' }}>
                  💀 BOSS FINAL {boss.hp}/{boss.maxHp}
                </div>
                <div style={{ height:7, background:'rgba(0,0,0,0.7)', borderRadius:4, border:'1px solid rgba(255,100,0,0.5)', overflow:'hidden' }}>
                  <div
                    style={{ height:'100%', width:`${(boss.hp/boss.maxHp)*100}%`, background: boss.hp <= 2 ? 'linear-gradient(90deg,#ff0000,#ff6600)' : 'linear-gradient(90deg,#ff6600,#ffcc00)', borderRadius:4, transition:'width 0.2s', animation: boss.hp <= 2 ? 'bossHpGlowRed 0.6s ease-in-out infinite' : 'bossHpGlow 0.6s ease-in-out infinite' }}
                  />
                </div>
              </div>
            </>
          )}

          {/* 🔴 Balas inimigas */}
          {enemyBulletsR.current.map(eb => {
            const src = eb.type === 'boss2' ? '/GAME/damage-boss02.svg' : eb.type === 'boss1' ? '/GAME/damage-boss01.svg' : '/GAME/damage-for-alls-monster.svg';
            const glow = eb.type === 'boss2' ? '#ff00ff' : eb.type === 'boss1' ? '#ff4400' : '#ff6600';
            return (
              <div key={eb.id} className="absolute pointer-events-none" style={{ transform:`translate3d(${eb.x}px,${eb.y}px,0)`, top:0, left:0, width:ENEMY_BULLET_W, height:ENEMY_BULLET_H, zIndex:10, willChange:'transform' }}>
                <img src={src} alt="eb" style={{ width:'100%', height:'100%', filter:`drop-shadow(0 0 5px ${glow}) brightness(1.4)` }} />
              </div>
            );
          })}

          {/* 🔵 Balas do jogador */}
          {playerBulletsR.current.map(pb => (
            <div key={pb.id} className="absolute pointer-events-none" style={{ transform:`translate3d(${pb.x}px,${pb.y}px,0)`, top:0, left:0, width:PLAYER_BULLET_W, height:PLAYER_BULLET_H, zIndex:10, willChange:'transform' }}>
              <img src={`/GAME/FIREgun${fireLevelRef.current || 1}.svg`} alt="fire" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 0 6px #ff4400) drop-shadow(0 0 14px #ff8800) brightness(1.5)', animation:'pulse 0.2s ease-in-out infinite' }} />
            </div>
          ))}

          {/* 🏆 Tela de vitória — Boss derrotado! */}
          <AnimatePresence>
            {bossDefeated && screen === 'playing' && (
              <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50 pointer-events-none"
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.6 }}
                style={{ background:'rgba(0,0,10,0.85)' }}>
                <motion.div style={{ fontSize:56, lineHeight:1, filter:'drop-shadow(0 0 30px #ffd700)' }}
                  animate={{ scale:[1,1.25,1], rotate:[0,12,-12,0] }} transition={{ duration:1.2, repeat:Infinity }}>🏆</motion.div>
                <motion.div
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
                  style={{ fontFamily:'monospace', fontSize:20, fontWeight:900, color:'#ffd700', textShadow:'0 0 20px #ffd700', letterSpacing:4, textAlign:'center' }}>
                  BOSS DESTRUÍDO!
                </motion.div>
                <motion.div
                  initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
                  style={{ fontFamily:'monospace', fontSize:9, color:'rgba(0,255,65,0.7)', letterSpacing:2 }}>
                  carregando créditos...
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ❄️ Banner de freeze ativo */}
          {screen === 'playing' && freezeActive && (
            <motion.div className="absolute pointer-events-none"
              style={{ top:44, left:0, right:0, display:'flex', justifyContent:'center', zIndex:15 }}
              initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
              <motion.div
                animate={IS_MOBILE_WEB ? undefined : { boxShadow:['0 0 12px rgba(150,200,255,0.5)','0 0 24px rgba(180,220,255,0.9)','0 0 12px rgba(150,200,255,0.5)'] }}
                transition={{ duration:0.9, repeat:Infinity, ease:'easeInOut' }}
                style={{ fontFamily:'monospace', fontSize:10, fontWeight:900, color:'#cce8ff',
                  textShadow:'0 0 10px #99ccff', background:'rgba(80,130,255,0.18)',
                  border:'1px solid rgba(150,200,255,0.5)', borderRadius:8,
                  padding:'2px 10px', letterSpacing:2,
                  boxShadow: IS_MOBILE_WEB ? '0 0 12px rgba(150,200,255,0.5)' : undefined }}>
                ❄️ FREEZE {freezeTimeLeftRef.current}s
              </motion.div>
            </motion.div>
          )}

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
                      {freezeTimeLeftRef.current}s
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

            {/* ── TOAST: Monster chegou sem munição ── */}
            {monsterWarnActive && screen === 'playing' && (
              <motion.div
                className="absolute pointer-events-none"
                style={{ top: 52, left: 8, right: 8, zIndex: 40 }}
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onAnimationComplete={() => { setTimeout(() => setMonsterWarnActive(false), 4500); }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(28,8,0,0.92)', border:'1px solid rgba(255,140,60,0.55)', borderRadius:9, padding:'6px 10px', boxShadow:'0 0 14px rgba(255,100,0,0.3)' }}>
                  <img src="/GAME/airplane.svg" alt="astronauta" style={{ width:20, height:20, flexShrink:0, filter:'drop-shadow(0 0 4px #ff8c3a)' }} />
                  <span style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,220,170,0.95)', lineHeight:1.5 }}>
                    <span style={{ color:'#ff8c3a', fontWeight:900 }}>SEM MUNIÇÃO!</span> Desvie dos tiros e planetas. O <span style={{ color:'#ffd700', fontWeight:900 }}>⚡BÔNUS</span> vem aí — aguenta!
                  </span>
                </div>
              </motion.div>
            )}

            {/* ── TOAST: Dica do astronauta a cada 300pts ── */}
            {midGameTipActive && screen === 'playing' && (
              <motion.div
                className="absolute pointer-events-none"
                style={{ top: 52, left: 8, right: 8, zIndex: 40 }}
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(8,0,28,0.92)', border:'1px solid rgba(180,100,255,0.5)', borderRadius:9, padding:'6px 10px', boxShadow:'0 0 14px rgba(150,60,255,0.25)' }}>
                  <img src="/GAME/airplane.svg" alt="astronauta" style={{ width:20, height:20, flexShrink:0, filter:'drop-shadow(0 0 4px #bb66ff)' }} />
                  <span style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(220,200,255,0.95)', lineHeight:1.5 }}>
                    <span style={{ color:'#bb66ff', fontWeight:900 }}>HOUSTON:</span> Não é fácil chegar a <span style={{ color:'#ffd700', fontWeight:900 }}>1000pts</span> nessa viagem. Tome cuidado, piloto!
                  </span>
                </div>
              </motion.div>
            )}

            {/* ── TOAST: Gun4 pesada — gigantes gasosos crescem ── */}
            {gun4WarnActive && screen === 'playing' && (
              <motion.div
                className="absolute pointer-events-none"
                style={{ top: 52, left: 8, right: 8, zIndex: 40 }}
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onAnimationComplete={() => { setTimeout(() => setGun4WarnActive(false), 4500); }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(0,18,10,0.92)', border:'1px solid rgba(0,255,180,0.45)', borderRadius:9, padding:'6px 10px', boxShadow:'0 0 14px rgba(0,220,140,0.25)' }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>🪐</span>
                  <span style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(180,255,235,0.95)', lineHeight:1.5 }}>
                    <span style={{ color:'#00ffcc', fontWeight:900 }}>ARMA PESADA!</span> Júpiter e Saturno vão crescer. Pegue o <span style={{ color:'#00ffcc', fontWeight:900 }}>⬇️DESCARGA</span> — desvie rápido!
                  </span>
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
                style={{ width:'100%', height:'100%', filter:
                  shipSkin==='spacestart' ? 'drop-shadow(0 0 20px #fff) drop-shadow(0 0 40px #00ffff) drop-shadow(0 0 60px #ff00ff) brightness(1.4)'
                  : bonusActive ? 'drop-shadow(0 0 14px #ffd700) drop-shadow(0 0 28px #ffaa00) brightness(1.25)'
                  : shipSkin==='elite'    ? 'drop-shadow(0 0 14px #ff00ff) drop-shadow(0 0 28px #aa00ff) brightness(1.25)'
                  : 'drop-shadow(0 0 8px #00d9ff)' }}
                animate={bonusActive?{scale:[1,1.07,1]}:{}} transition={{ duration:0.4, repeat:Infinity }} />
              {screen === 'playing' && (
                <motion.div className="absolute rounded-full"
                  style={{ bottom:-10, left:'50%', transform:'translateX(-50%)', width:bonusActive?10:6, background:bonusActive?'linear-gradient(180deg,#ffd700,#ff6b00,transparent)':'linear-gradient(180deg,#ff6b6b,#ff9a00,transparent)', borderRadius:4 }}
                  animate={{ height:bonusActive?[16,28,12,24,16]:[10,18,8,16,10], opacity:[0.9,1,0.7,1,0.9] }}
                  transition={{ duration:0.25, repeat:Infinity }} />
              )}
            </motion.div>
          )}

          {particlesR.current.map(p => (
            <div key={p.id} className="absolute rounded-full pointer-events-none" style={{ transform:`translate3d(${p.x}px,${p.y}px,0)`, top:0, left:0, width:p.size, height:p.size, background:p.color, opacity:p.life, willChange:'transform' }} />
          ))}

          {explosionsR.current.map((exp,i) => (
            <motion.div key={exp.id} className="absolute pointer-events-none" style={{ transform:`translate3d(${exp.x}px,${exp.y}px,0)`, top:0, left:0, zIndex:20, willChange:'transform' }}
              initial={{ scale:0.2, opacity:1, rotate:i===0?0:25 }} animate={{ scale:i===0?2.8:2.2, opacity:0, rotate:i===0?15:-20 }}
              transition={{ duration:i===0?0.7:0.55, ease:'easeOut' }}>
              <img src={`/GAME/explosioncloud${(i%2)+1}.svg`} alt="" style={{ width:72, height:72, filter:`drop-shadow(0 0 12px ${i===0?'#ff4500':'#ffd700'}) hue-rotate(${i===0?0:20}deg) brightness(3)` }} />
            </motion.div>
          ))}

          {/* ── CAIXA DE DIÁLOGO RPG — Comandante Houston (game over) ── */}

          {/* 🔑 Password — flutua acima do diálogo RPG */}
          <AnimatePresence>
            {unlockedPassword && screen === 'dead' && (
              <motion.div
                className="absolute pointer-events-none"
                style={{ bottom: rpgStep !== null ? 182 : 22, left: 10, right: 10, zIndex: 39 }}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                transition={{ delay:1.0, duration:0.35, ease:'easeOut' }}>
                <div style={{
                  background:'linear-gradient(135deg, rgba(40,28,0,0.97) 0%, rgba(20,16,0,0.97) 100%)',
                  border:'1.5px solid rgba(255,215,0,0.55)',
                  borderRadius:10,
                  padding:'7px 12px',
                  display:'flex', alignItems:'center', gap:10,
                  boxShadow:'0 0 18px rgba(255,200,0,0.2), inset 0 0 12px rgba(80,60,0,0.3)',
                }}>
                  <div style={{ fontSize:16, flexShrink:0 }}>🔑</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'monospace', fontSize:7, color:'rgba(255,215,0,0.6)', letterSpacing:2, marginBottom:2 }}>CHECKPOINT DESBLOQUEADO</div>
                    <div style={{ fontFamily:'monospace', fontSize:13, color:'#ffd700', fontWeight:900, letterSpacing:2, textShadow:'0 0 10px #ffd700' }}>{unlockedPassword}</div>
                    <div style={{ fontFamily:'monospace', fontSize:7, color:'rgba(255,255,255,0.35)', marginTop:2 }}>Anote e use na tela inicial para continuar</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              {/* 3 naves: normal (esq), lendária (centro), boost (dir) */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:18, flexShrink:0 }}>
                {/* Normal */}
                <motion.img src="/GAME/airplane.svg" alt="nave normal"
                  style={{ width:42, height:42, filter:'drop-shadow(0 0 10px #00d9ff)' }}
                  animate={{ y:[-6,6,-6] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }} />
                {/* Lendária (elite) — maior, brilho roxo */}
                <motion.img src="/GAME/space1000bonus.svg" alt="nave lendária"
                  style={{ width:62, height:62, filter:'drop-shadow(0 0 16px #ff00ff) drop-shadow(0 0 28px #aa00ff) brightness(1.2)' }}
                  animate={{ y:[-6,6,-6] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut', delay:0.3 }} />
                {/* Boost — brilho dourado */}
                <motion.img src="/GAME/spaceShuttleBONUS.svg" alt="nave boost"
                  style={{ width:42, height:42, filter:'drop-shadow(0 0 10px #ffd700) drop-shadow(0 0 20px #ffaa00) brightness(1.15)' }}
                  animate={{ y:[-6,6,-6] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut', delay:0.6 }} />
              </div>
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
                            { src:'/GAME/airplane.svg',          filter:'drop-shadow(0 0 6px #00d9ff)',                          label:'NORMAL',   desc:'Nave padrão. Desvie de tudo!',           color:'#00d9ff' },
                            { src:'/GAME/spaceShuttleBONUS.svg', filter:'drop-shadow(0 0 6px #ffd700) brightness(1.3)',          label:'BOOST',    desc:'Ativa ao pegar ⚡ BONUS. Obstáculos não te machucam por 10s!', color:'#ffd700' },
                            { src:'/GAME/space1000bonus.svg',     filter:'drop-shadow(0 0 6px #ff00ff) drop-shadow(0 0 12px #aa00ff) brightness(1.3)', label:'LENDÁRIA', desc:'Desbloqueada ao atingir 1000pts!', color:'#ff00ff' },
                          ].map(n => (
                            <div key={n.label} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'7px 10px', border:`1px solid ${n.color}22` }}>
                              <img src={n.src} alt={n.label} style={{ width:32, height:32, flexShrink:0, filter:n.filter }} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:n.color, letterSpacing:1, marginBottom:2 }}>{n.label}</div>
                                <div style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,255,255,0.5)', lineHeight:1.6, wordBreak:'break-word' }}>{n.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Armas */}
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:2 }}>🔫 ARMAS</div>
                          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'8px 10px', border:'1px solid rgba(0,207,255,0.15)', display:'flex', flexDirection:'column', gap:5 }}>
                            {[
                              { label:'GUN 1', desc:'1 tiro simples. Pega o 1º BONUS para ativar.', color:'#00cfff' },
                              { label:'GUN 2', desc:'Cadência maior. Ativada no 2º BONUS coletado.', color:'#44ff88' },
                              { label:'GUN 3', desc:'Tiro triplo em leque! Ativada no 3º BONUS.', color:'#ffd700' },
                              { label:'GUN 4', desc:'Máximo poder — mas atenção: planetas ficam 20% maiores! A cada 7s aparece um DESCARGA para você coletar e voltar à GUN 3.', color:'#ff6b6b' },
                            ].map((g) => (
                              <div key={g.label} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                                <div style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:g.color, minWidth:38, flexShrink:0 }}>{g.label}</div>
                                <div style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>{g.desc}</div>
                              </div>
                            ))}
                            <div style={{ marginTop:2, fontFamily:'monospace', fontSize:7.5, color:'rgba(255,200,0,0.5)', lineHeight:1.5 }}>
                              ⚠️ Morrer reseta a arma para GUN 1.
                            </div>
                          </div>
                        </div>

                        {/* Itens */}
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:2 }}>ITENS & INIMIGOS</div>
                          {[
                            { src:'/GAME/BONUS.svg',    filter:'drop-shadow(0 0 8px #ffd700) brightness(1.5)',                                                    label:'⚡ BONUS',       desc:'Aparece a cada 150pts. Coleta para ativar BOOST 10s e subir de arma!', color:'#ffd700' },
                            { src:'/GAME/bonus2.svg',   filter:'drop-shadow(0 0 8px #00ffcc) brightness(1.4)',                                                    label:'💠 DESCARGA',    desc:'Aparece quando você está com GUN 4. Colete para voltar à GUN 3 e evitar que os planetas cresçam ainda mais!', color:'#00ffcc' },
                            { src:'/GAME/MoonVideoGIF.gif', filter:'drop-shadow(0 0 8px rgba(200,220,255,0.8)) brightness(1.1)',                                  label:'🌕 LUA',         desc:'Coletável especial! Aparece a cada 500pts. Dá pontos bônus e vida extra.', color:'#c8dcff' },
                            { src:'/GAME/ALIEN.svg',    filter:'drop-shadow(0 0 8px #00ff80) brightness(1.2)',                                                    label:'👾 ALIEN',       desc:'Aparece durante o BOOST para te desafiar. Cancela o boost e tira 1 vida!', color:'#00ff80' },
                            { src:'/GAME/meteor.svg',   filter:'drop-shadow(0 0 5px #ff6b00)',                                                                    label:'☄️ METEORO',     desc:'Obstáculo principal. Aparece do início. Causa 1 de dano.', color:'#ff6b00' },
                            { src:'/GAME/ALIEN.svg',    filter:'drop-shadow(0 0 8px #cc00ff) hue-rotate(200deg) brightness(1.6) saturate(2)',                    label:'🔴 PROJÉTIL',    desc:'A partir de 300pts tiros alienígenas vêm direto em você! Desvie rápido.', color:'#cc00ff' },
                            { src:'/GAME/cloud.svg',    filter:'drop-shadow(0 0 5px #00cfff) brightness(1.2)',                                                    label:'☁️ NUVEM',       desc:'Obstáculo secundário. Causa 1 de dano.', color:'#00cfff' },
                            { src:'/GAME/jupiter.svg',  filter:'drop-shadow(0 0 8px #ff9944) brightness(1.1)',                                                   label:'🪐 PLANETAS',    desc:'Júpiter e Saturno aparecem a partir de 100pts. Grandes e difíceis de desviar — com GUN 4 ficam ainda maiores!', color:'#ffaa55' },
                            { src:'/GAME/black-hole.svg', filter:'drop-shadow(0 0 10px #ffd700) brightness(1.2)',                                                 label:'🕳️ BURACO NEGRO', desc:'Morte instantânea! Cresce pulsando enquanto desce. Não tem como sobreviver ao toque.', color:'#ffe066' },
                          ].map(n => (
                            <div key={n.label} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'7px 10px', border:`1px solid ${n.color}22` }}>
                              <img src={n.src} alt={n.label} style={{ width:30, height:30, flexShrink:0, filter:n.filter, borderRadius: n.label==='🌕 LUA' ? '50%' : 0 }} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:n.color, letterSpacing:1, marginBottom:2 }}>{n.label}</div>
                                <div style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,255,255,0.5)', lineHeight:1.6, wordBreak:'break-word' }}>{n.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Monstros & Boss */}
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:2 }}>MONSTROS & BOSS</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:5, background:'rgba(255,60,60,0.04)', borderRadius:10, padding:'8px 10px', border:'1px solid rgba(255,60,60,0.15)' }}>
                            <div style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                              👹 <span style={{ color:'#ff8888', fontWeight:900 }}>MONSTROS</span> aparecem a partir de <span style={{ color:'#ffd700' }}>900pts</span>, a cada 600pts. Chegam em sequência: Monstro 1 → 2 → 3 → 4. Atire para destruir!
                            </div>
                            <div style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                              💀 <span style={{ color:'#ff4444', fontWeight:900 }}>BOSS FINAL</span> aparece aos <span style={{ color:'#ffd700' }}>4500pts</span>. Tem 20HP, se move em vaivém e atira em rajadas. Quando HP ≤ 2 entra em modo <span style={{ color:'#ff00ff' }}>BERSERK</span> — muito mais rápido!
                            </div>
                          </div>
                        </div>

                        {/* Checkpoints */}
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:2 }}>🔑 CHECKPOINTS</div>
                          <div style={{ background:'rgba(255,215,0,0.05)', borderRadius:10, padding:'8px 10px', border:'1px solid rgba(255,215,0,0.2)', display:'flex', flexDirection:'column', gap:4 }}>
                            <div style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                              Ao atingir <span style={{ color:'#ffd700' }}>1000 / 2000 / 3000 / 4000pts</span> você desbloqueia um <span style={{ color:'#ffd700', fontWeight:900 }}>PASSWORD</span>. Anote-o!
                            </div>
                            <div style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                              Na tela inicial, insira o password para continuar de onde parou sem perder o progresso.
                            </div>
                          </div>
                        </div>

                        {/* Vidas */}
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.35)', fontSize:8, letterSpacing:2 }}>VIDAS</div>
                          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,60,60,0.06)', borderRadius:10, padding:'8px 10px', border:'1px solid rgba(255,80,80,0.2)' }}>
                            <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                              {['❤️','❤️','❤️'].map((h,i) => <span key={i} style={{ fontSize:16 }}>{h}</span>)}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:'#ff6b6b', letterSpacing:1, marginBottom:2 }}>3 VIDAS</div>
                              <div style={{ fontFamily:'monospace', fontSize:8.5, color:'rgba(255,255,255,0.5)', lineHeight:1.6, wordBreak:'break-word' }}>Você aguenta 3 colisões. Na 3ª — game over! Após levar dano fica invencível por 1.5s. A cada 4 BONUS coletados ganha +1 vida (máx. 7).</div>
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

              {/* ── Campo de Password ── */}
              <div style={{ width:'100%', flexShrink:0 }}>
                <div style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:2, textAlign:'center', marginBottom:6 }}>🔑 TEM UM PASSWORD?</div>
                <div style={{ display:'flex', gap:6 }}>
                  <input
                    value={passwordInput}
                    onChange={e => { setPasswordInput(e.target.value.toUpperCase()); setPasswordError(''); }}
                    placeholder="EX: EASY0101"
                    style={{ flex:1, background:'rgba(255,255,255,0.06)', border:`1px solid ${passwordError ? 'rgba(255,80,80,0.6)' : 'rgba(255,215,0,0.25)'}`, borderRadius:10, padding:'7px 10px', fontFamily:'monospace', fontSize:10, color:'#ffd700', letterSpacing:2, outline:'none' }}
                  />
                  <motion.button
                    onClick={() => {
                      // 🔑 Password secreto do dev — acesso direto à missão bônus
                      if (passwordInput.trim().toUpperCase() === 'GEANOLIVEIRA99') {
                        startBonusMission();
                        return;
                      }
                      const cp = getCheckpointByPassword(passwordInput);
                      if (!cp) { setPasswordError('Password inválido!'); return; }
                      startGame(cp.score, PASSWORDS.indexOf(cp) + 1);
                    }}
                    whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    style={{ background:'rgba(255,215,0,0.18)', border:'1px solid rgba(255,215,0,0.4)', borderRadius:10, padding:'7px 12px', fontFamily:'monospace', fontSize:9, color:'#ffd700', fontWeight:900, cursor:'pointer', flexShrink:0 }}>
                    IR
                  </motion.button>
                </div>
                {passwordError && <div style={{ fontFamily:'monospace', fontSize:8, color:'#ff6b6b', marginTop:4, textAlign:'center' }}>{passwordError}</div>}
              </div>

              <div className="flex gap-3" style={{ flexShrink:0 }}>
                <motion.button onClick={() => { setStoryScene(0); setStoryChars(0); setScreen('story'); }} className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm tracking-widest"
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
              <motion.button
                onClick={() => { setCreditsChars(0); setCreditsDone(false); setScreen('credits'); }}
                style={{ fontFamily:'monospace', color:'rgba(0,255,65,0.35)', fontSize:9, background:'none', border:'1px solid rgba(0,255,65,0.15)', borderRadius:8, padding:'5px 14px', cursor:'pointer', flexShrink:0, letterSpacing:1 }}
                whileHover={{ color:'#00ff41', borderColor:'rgba(0,255,65,0.5)', textShadow:'0 0 8px #00ff41' }} whileTap={{ scale:0.95 }}>
                📜 CRÉDITOS
              </motion.button>
            </motion.div>
          )}

          {/* ── TELA DE HISTÓRIA ── */}
          {screen === 'story' && (() => {
            // Cenas: cada uma tem imagem + texto
            const SCENES = [
  {
    img: '/history/sistema-solar01.jpg',
    text: 'Ano 2157. A NASA enviou sua equipe mais ousada para além de Plutão — em busca de planetas habitáveis, muito além dos limites conhecidos da galáxia...',
  },
  {
    img: '/history/sistema-solar02.png',
    text: 'Uma equipe de seis astronautas cruzou o vazio sideral. O que os aguardava não era apenas a imensidão do espaço — era algo oculto de todos os nossos satélites de monitoramento...',
  },
  {
    img: '/history/monster-aliens-boss.png',
    text: 'Monstros ancestrais atacaram sem aviso. Em minutos, cinco dos seis astronautas foram eliminados. Apenas UM sobreviveu...',
  },
  {
    img: '/history/astronauta-no-planeta-marte.png',
    text: 'Atilas God. O último sobrevivente. Com a nave solo Apolly-B11 e apenas o que restou de munição, ele precisa voltar para a Terra.',
  },
  {
    img: '/history/sistema-solar03.png',
    text: 'Ao se aproximar de Marte, o terrível BOSS-Kraken emerge das sombras. A gravidade do planeta vermelho e o alinhamento da Lua são sua única esperança...',
  },
  {
    img: '/history/buraco-negro.jpg',
    text: 'E o perigo mais mortal de toda a jornada: buracos negros surgem a qualquer momento no caminho de volta. Não há como escapar deles. Apenas desviar.',
  },
];

            const scene = SCENES[storyScene];
            const fullText = scene.text;
            const isTextDone = storyChars >= fullText.length;
            const isLastScene = storyScene >= SCENES.length - 1;

            return (
              <motion.div
                key="story-screen"
                className="absolute inset-0 flex flex-col"
                style={{ background:'#000', zIndex:50, overflow:'hidden' }}
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.5 }}
              >
                {/* Música de história gerenciada via useEffect no componente pai */}

                {/* Imagem de fundo — ocupa tudo sem cortar, com object-fit contain */}
                <motion.div className="absolute inset-0" style={{ background:'#000' }}>
                  <motion.img
                    key={storyScene}
                    src={scene.img}
                    alt=""
                    initial={{ opacity:0, scale:1.04 }}
                    animate={{ opacity:1, scale:1 }}
                    transition={{ duration:1.1, ease:'easeOut' }}
                    style={{
                      position:'absolute', inset:0, width:'100%', height:'100%',
                      objectFit:'contain',   // sem cortar nada
                      objectPosition:'center',
                    }}
                  />
                  {/* escurecimento suave para legibilidade do texto */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.55) 100%)' }} />
                </motion.div>

                {/* Indicador de cena */}
                <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5" style={{ zIndex:2 }}>
                  {SCENES.map((_, i) => (
                    <div key={i} style={{
                      width: i === storyScene ? 18 : 6, height:4, borderRadius:2,
                      background: i <= storyScene ? '#00ff41' : 'rgba(255,255,255,0.2)',
                      transition:'all 0.3s',
                    }} />
                  ))}
                </div>

                {/* Bloco de texto — parte inferior */}
                <div className="absolute bottom-0 left-0 right-0" style={{ zIndex:2, padding:'0 16px 16px' }}>
                  {/* Barra superior decorativa */}
                  <div style={{ height:1, background:'linear-gradient(90deg,transparent,#00ff41,transparent)', marginBottom:10, opacity:0.5 }} />

                  {/* Texto typewriter verde terminal */}
                  <motion.div
                    key={storyScene + '-text'}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}
                    style={{
                      fontFamily:'"Courier New", Courier, monospace',
                      fontSize:11, lineHeight:1.8,
                      color:'#00ff41',
                      textShadow:'0 0 8px #00ff41, 0 0 2px #00ff41',
                      minHeight:70,
                      letterSpacing:0.5,
                    }}
                  >
                    {/* Efeito typewriter via useEffect abaixo */}
                    <StoryTyper
                      text={fullText}
                      chars={storyChars}
                      setChars={setStoryChars}
                    />
                  </motion.div>

                  {/* Botões de navegação */}
                  <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8 }}>
                    {/* PULAR — sempre visível ao lado esquerdo do botão principal */}
                    <motion.button
                      style={{ fontFamily:'monospace', fontSize:8, color:'rgba(0,255,65,0.45)', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,255,65,0.18)', borderRadius:8, padding:'5px 10px', cursor:'pointer', letterSpacing:2 }}
                      whileHover={{ color:'#00ff41', borderColor:'rgba(0,255,65,0.6)' }}
                      whileTap={{ scale:0.95 }}
                      onClick={() => { sndHistory.stop(); startGame(); }}
                    >
                      PULAR ▶▶
                    </motion.button>

                    {isTextDone ? (
                      isLastScene ? (
                        <motion.button
                          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => { sndHistory.stop(); startGame(); }}
                          style={{ fontFamily:'monospace', fontSize:11, fontWeight:900, color:'#000', background:'#00ff41', border:'none', borderRadius:8, padding:'8px 22px', cursor:'pointer', letterSpacing:2, boxShadow:'0 0 18px #00ff41' }}
                        >
                          ▶ INICIAR MISSÃO
                        </motion.button>
                      ) : (
                        <motion.button
                          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => { setStoryScene(s => s + 1); setStoryChars(0); }}
                          style={{ fontFamily:'monospace', fontSize:10, color:'#00ff41', background:'rgba(0,255,65,0.08)', border:'1px solid rgba(0,255,65,0.35)', borderRadius:8, padding:'7px 18px', cursor:'pointer', letterSpacing:2 }}
                        >
                          CONTINUAR ▶
                        </motion.button>
                      )
                    ) : (
                      /* acelera o typewriter ao clicar */
                      <motion.button
                        whileTap={{ scale:0.95 }}
                        onClick={() => setStoryChars(fullText.length)}
                        style={{ fontFamily:'monospace', fontSize:9, color:'rgba(0,255,65,0.4)', background:'none', border:'1px solid rgba(0,255,65,0.15)', borderRadius:8, padding:'5px 14px', cursor:'pointer', letterSpacing:2 }}
                      >
                        ▶ VER TUDO
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* ── TELA DE VITÓRIA BÔNUS INTERESTELAR ── */}
          {screen === 'bonus_victory' && (
            <motion.div key="bonus-victory-screen" className="absolute inset-0 flex flex-col"
              style={{ background:'linear-gradient(180deg,#000a00 0%,#001a00 50%,#003300 100%)', zIndex:50 }}
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ duration:0.8 }}>

              {/* Raios de luz verde irradiando do centro */}
              {[...Array(8)].map((_,i) => (
                <motion.div key={i} style={{ position:'absolute', top:'50%', left:'50%',
                  width:2, height:'55%', transformOrigin:'top center',
                  transform:`rotate(${i*45}deg)`,
                  background:`linear-gradient(180deg, rgba(0,255,65,0.15) 0%, transparent 100%)`,
                  pointerEvents:'none' }}
                  animate={{ opacity:[0.05,0.2,0.05] }}
                  transition={{ duration:2+i*0.3, repeat:Infinity, delay:i*0.2 }} />
              ))}

              {/* Partículas de estrela verde */}
              {[...Array(22)].map((_,i) => (
                <motion.div key={i} style={{ position:'absolute', borderRadius:'50%',
                  width: i%4===0?3:i%3===0?2:1, height: i%4===0?3:i%3===0?2:1,
                  background: i%5===0 ? '#ffd700' : '#00ff41',
                  left:`${(i*17+5)%98}%`, top:`${(i*23+8)%92}%` }}
                  animate={{ opacity:[0.1,0.7,0.1], scale:[1,1.5,1] }}
                  transition={{ duration:1.5+i*0.2, repeat:Infinity, delay:i*0.1 }} />
              ))}

              {/* Conteúdo */}
              <div className="absolute inset-0 flex flex-col" style={{ padding:'16px 18px', zIndex:2, overflowY:'auto', scrollbarWidth:'none' }}>

                {/* Header com emoji e título */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8, marginTop:8 }}>
                  <motion.span style={{ fontSize:30 }}
                    animate={{ scale:[1,1.2,1], rotate:[0,10,-10,0] }}
                    transition={{ duration:2, repeat:Infinity }}>�</motion.span>
                  <div style={{ fontFamily:'monospace', fontSize:12, fontWeight:900, color:'#00ff41',
                    textShadow:'0 0 20px #00ff41', letterSpacing:3 }}>
                    MISSÃO CUMPRIDA
                  </div>
                  <motion.span style={{ fontSize:30 }}
                    animate={{ scale:[1,1.2,1], rotate:[0,-10,10,0] }}
                    transition={{ duration:2, repeat:Infinity, delay:0.5 }}>�</motion.span>
                </div>

                {/* Linha divisória */}
                <div style={{ height:1, background:'linear-gradient(90deg,transparent,#00ff41,transparent)', marginBottom:14, opacity:0.4 }} />

                {/* Typewriter do relatório */}
                <div style={{ fontFamily:'"Courier New",monospace', fontSize:10, color:'#00ff41',
                  textShadow:'0 0 5px rgba(0,255,65,0.6)', lineHeight:2,
                  letterSpacing:0.3, whiteSpace:'pre-wrap', flex:1 }}>
                  <StoryTyper
                    text={bonusVictoryText(playerName)}
                    chars={bonusVictoryChars}
                    setChars={setBonusVictoryChars}
                  />
                </div>

                {/* Botões após texto completo */}
                {bonusVictoryDone && (
                  <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.5 }}
                    style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center', paddingTop:12, paddingBottom:8 }}>
                    <div style={{ fontFamily:'monospace', fontSize:8, color:'rgba(0,255,65,0.5)', letterSpacing:2 }}>
                      O QUE DESEJA FAZER, PILOTO?
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                      <motion.button
                        onClick={() => { sndHistory.stop(); startGame(); }}
                        whileHover={{ scale:1.06 }} whileTap={{ scale:0.95 }}
                        style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:'#00cfff',
                          background:'rgba(0,150,255,0.12)', border:'1px solid rgba(0,200,255,0.45)',
                          borderRadius:10, padding:'7px 14px', cursor:'pointer', letterSpacing:2 }}>
                        🚀 NOVA CAMPANHA
                      </motion.button>
                      <motion.button
                        onClick={() => { sndHistory.stop(); startBonusMission(); }}
                        whileHover={{ scale:1.06 }} whileTap={{ scale:0.95 }}
                        style={{ fontFamily:'monospace', fontSize:9, fontWeight:900, color:'#ff6600',
                          background:'rgba(255,100,0,0.12)', border:'1px solid rgba(255,120,0,0.5)',
                          borderRadius:10, padding:'7px 14px', cursor:'pointer', letterSpacing:2,
                          boxShadow:'0 0 10px rgba(255,80,0,0.25)' }}>
                        ☄️ JOGAR DE NOVO
                      </motion.button>
                    </div>
                    <motion.button
                      onClick={() => { sndHistory.stop(); setScreen('idle'); }}
                      whileHover={{ color:'rgba(255,255,255,0.6)' }} whileTap={{ scale:0.95 }}
                      style={{ fontFamily:'monospace', fontSize:8, color:'rgba(255,255,255,0.25)',
                        background:'none', border:'none', cursor:'pointer', letterSpacing:2 }}>
                      MENU PRINCIPAL
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── TELA DE CRÉDITOS (após zerar) ── */}
          {screen === 'credits' && (
            <motion.div key="credits-screen" className="absolute inset-0 flex flex-col"
              style={{ background:'#000', zIndex:50 }}
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.7 }}>

              {/* Fundo gradiente verde */}
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 30%, rgba(0,80,0,0.18) 0%, #000 70%)' }} />

              {/* Partículas de estrela */}
              {[...Array(18)].map((_,i) => (
                <motion.div key={i} style={{ position:'absolute', borderRadius:'50%',
                  width: i%3===0?2:1, height: i%3===0?2:1,
                  background:'#00ff41', opacity:0.25,
                  left:`${(i*13+7)%100}%`, top:`${(i*17+11)%80}%` }}
                  animate={{ opacity:[0.1,0.5,0.1] }}
                  transition={{ duration:2+i*0.3, repeat:Infinity, delay:i*0.15 }} />
              ))}

              {/* Conteúdo centralizado */}
              <div className="absolute inset-0 flex flex-col justify-center" style={{ padding:'20px 18px', zIndex:2 }}>
                {/* Troféu + Título na mesma linha */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10 }}>
                  <motion.span style={{ fontSize:28, lineHeight:1 }}
                    animate={{ scale:[1,1.12,1] }}
                    transition={{ duration:2.5, repeat:Infinity }}>🏆</motion.span>
                  <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:900, color:'#ffd700',
                    textShadow:'0 0 16px #ffd700', letterSpacing:4 }}>
                    {bossDefeated ? 'VOCÊ ZEROU!' : 'CRÉDITOS'}
                  </div>
                </div>

                {/* Score — só exibe se veio de uma partida zerada */}
                {bossDefeated && (
                  <div style={{ fontFamily:'monospace', fontSize:10, color:'#00cfff', textAlign:'center', marginBottom:18,
                    textShadow:'0 0 8px #00cfff' }}>
                    SCORE FINAL: <span style={{ fontWeight:900 }}>{String(score).padStart(5,'0')}</span>
                  </div>
                )}

                {/* Typewriter de créditos */}
                <div style={{ fontFamily:'"Courier New",monospace', fontSize:11, color:'#00ff41',
                  textShadow:'0 0 6px rgba(0,255,65,0.7)', lineHeight:2, minHeight:170,
                  marginTop: bossDefeated ? 0 : 14,
                  letterSpacing:0.3, whiteSpace:'pre-wrap' }}>
                  <StoryTyper
                    text={CREDITS_FULL_TEXT}
                    chars={creditsChars}
                    setChars={setCreditsChars}
                  />
                </div>

                {/* Botões aparecem após texto completo */}
                {creditsDone && (
                  <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.5 }}
                    style={{ marginTop:18, display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
                    {bossDefeated ? (
                      <>
                        <div style={{ fontFamily:'monospace', fontSize:9, color:'rgba(0,255,65,0.55)',
                          letterSpacing:2, marginBottom:4 }}>
                          INICIAR NOVA CAMPANHA?
                        </div>
                        <div style={{ display:'flex', gap:10 }}>
                          <motion.button
                            onClick={() => { sndHistory.stop(); startGame(); }}
                            whileHover={{ scale:1.06 }} whileTap={{ scale:0.95 }}
                            style={{ fontFamily:'monospace', fontSize:10, fontWeight:900, color:'#00cfff',
                              background:'rgba(0,150,255,0.12)', border:'1px solid rgba(0,200,255,0.45)',
                              borderRadius:10, padding:'8px 16px', cursor:'pointer', letterSpacing:2,
                              boxShadow:'0 0 10px rgba(0,180,255,0.2)' }}>
                            🚀 MODO APOLLO
                          </motion.button>
                          <motion.button
                            onClick={() => { sndHistory.stop(); startBonusMission(); }}
                            whileHover={{ scale:1.06 }} whileTap={{ scale:0.95 }}
                            style={{ fontFamily:'monospace', fontSize:10, fontWeight:900, color:'#ff6600',
                              background:'rgba(255,100,0,0.12)', border:'1px solid rgba(255,120,0,0.5)',
                              borderRadius:10, padding:'8px 16px', cursor:'pointer', letterSpacing:2,
                              boxShadow:'0 0 14px rgba(255,80,0,0.3)' }}>
                            ☄️ INTERESTELAR
                          </motion.button>
                        </div>
                        <motion.button
                          onClick={() => { sndHistory.stop(); setScreen('idle'); }}
                          whileHover={{ color:'rgba(255,255,255,0.7)' }} whileTap={{ scale:0.95 }}
                          style={{ fontFamily:'monospace', fontSize:8, color:'rgba(255,255,255,0.28)',
                            background:'none', border:'none', cursor:'pointer', letterSpacing:2, marginTop:4 }}>
                          MENU PRINCIPAL
                        </motion.button>
                      </>
                    ) : (
                      <motion.button
                        onClick={() => { sndHistory.stop(); setScreen('idle'); }}
                        whileHover={{ scale:1.06, color:'#00cfff' }} whileTap={{ scale:0.95 }}
                        style={{ fontFamily:'monospace', fontSize:10, fontWeight:900, color:'rgba(255,255,255,0.45)',
                          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.18)',
                          borderRadius:10, padding:'8px 22px', cursor:'pointer', letterSpacing:2 }}>
                        ← VOLTAR
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── HUD da missão bônus Interestelar ── */}
          {screen === 'bonus_mission' && (
            <div style={{ position:'absolute', top:6, left:0, right:0, display:'flex', justifyContent:'center', zIndex:25, pointerEvents:'none' }}>
              <motion.div
                animate={bonusTimer <= 10
                  ? { color:['#ff4400','#ff0000','#ff4400'], scale:[1,1.05,1] }
                  : { color:'#ff8800' }}
                transition={{ duration:0.5, repeat:bonusTimer <= 10 ? Infinity : 0 }}
                style={{ fontFamily:'monospace', fontSize:11, fontWeight:900,
                  background:'rgba(0,0,0,0.82)', border:'1px solid rgba(255,120,0,0.5)',
                  borderRadius:8, padding:'3px 14px', letterSpacing:2,
                  boxShadow:'0 0 12px rgba(255,80,0,0.25)' }}>
                ⏱ MISSÃO BÔNUS: {bonusTimer}s
              </motion.div>
            </div>
          )}

          {/* Chuva de buracos negros na missão bônus */}
          {screen === 'bonus_mission' && bonusRain && (
            <div style={{ position:'absolute', top:0, left:0, right:0, display:'flex', justifyContent:'center',
              zIndex:24, pointerEvents:'none', paddingTop:50 }}>
              <motion.div animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:0.4, repeat:Infinity }}
                style={{ fontFamily:'monospace', fontSize:10, fontWeight:900, color:'#ff0000',
                  textShadow:'0 0 12px #ff0000', letterSpacing:2, background:'rgba(0,0,0,0.75)',
                  border:'1px solid rgba(255,0,0,0.5)', borderRadius:6, padding:'3px 12px' }}>
                ⚠ CHUVA DE BURACOS NEGROS!
              </motion.div>
            </div>
          )}

          {screen === 'dead' && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-start gap-3"
              style={{ overflowY:'auto', scrollbarWidth:'none', paddingTop:24, paddingBottom: rpgStep !== null ? (unlockedPassword ? 340 : 200) : (unlockedPassword ? 160 : 100), paddingLeft:12, paddingRight:12 }}
              initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
              transition={{ delay:0.55, type:'spring', stiffness:180 }}>
              {/* 🌕 Lua real flutuando no fundo — decorativa */}
              <motion.img
                src="/GAME/MoonVideoGIF.gif"
                alt=""
                aria-hidden="true"
                className="absolute pointer-events-none"
                style={{ width:200, height:200, borderRadius:'50%', opacity:0.13, filter:'brightness(1.1) blur(2px)', top:'50%', left:'50%', transform:'translate(-50%,-60%)' }}
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
                <motion.button onClick={() => startGame()} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-xs tracking-widest"
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
                <motion.button onClick={() => startGame()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs"
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
        </div>{/* fecha wrapper scale */}
      </motion.div>
    </AnimatePresence>
  );
}

