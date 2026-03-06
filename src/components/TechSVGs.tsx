// Animated SVG icons for each technology
import { motion } from 'framer-motion';

const svgBase = { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 48 48' };

export const ReactSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    {...svgBase}
    width={size} height={size}
    animate={{ rotate: 360 }}
    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
  >
    <circle cx="24" cy="24" r="4" fill="#61DAFB" />
    {[0, 60, 120].map((angle) => (
      <motion.ellipse
        key={angle}
        cx="24" cy="24" rx="20" ry="7"
        fill="none" stroke="#61DAFB" strokeWidth="2"
        transform={`rotate(${angle} 24 24)`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
    ))}
  </motion.svg>
);

export const NodeSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    {...svgBase}
    width={size} height={size}
    whileHover={{ scale: 1.2 }}
    animate={{ y: [0, -4, 0] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    <path fill="#8CC84B" d="M24 2L4 14v20l20 12 20-12V14L24 2z" opacity={0.9} />
    <path fill="#fff" d="M24 8l14 8v16l-14 8-14-8V16L24 8z" opacity={0.15} />
    <text x="24" y="28" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="monospace">Node</text>
  </motion.svg>
);

export const AndroidSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    {...svgBase}
    width={size} height={size}
    animate={{ rotate: [0, 10, -10, 0] }}
    transition={{ duration: 4, repeat: Infinity }}
  >
    <circle cx="15" cy="18" r="2.5" fill="#a4c639" />
    <circle cx="33" cy="18" r="2.5" fill="#a4c639" />
    <path fill="#a4c639" d="M8 22c0-8.8 7.2-16 16-16s16 7.2 16 16v14H8V22z" />
    <rect x="4" y="22" width="4" height="10" rx="2" fill="#a4c639" />
    <rect x="40" y="22" width="4" height="10" rx="2" fill="#a4c639" />
    <rect x="8" y="36" width="4" height="8" rx="2" fill="#a4c639" />
    <rect x="36" y="36" width="4" height="8" rx="2" fill="#a4c639" />
    <path fill="#fff" fillOpacity={0.3} d="M15 14l-3-5M33 14l3-5" stroke="#a4c639" strokeWidth="2" strokeLinecap="round" />
  </motion.svg>
);

export const iOSSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    {...svgBase}
    width={size} height={size}
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    <rect x="8" y="4" width="32" height="40" rx="6" fill="#555" />
    <rect x="9" y="5" width="30" height="38" rx="5" fill="#1a1a1a" />
    <rect x="11" y="7" width="26" height="32" rx="4" fill="url(#iosGrad)" />
    <circle cx="24" cy="41" r="2" fill="#555" />
    <rect x="19" y="5" width="10" height="2" rx="1" fill="#333" />
    <text x="24" y="27" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui">iOS</text>
    <defs>
      <linearGradient id="iosGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0A84FF" />
        <stop offset="100%" stopColor="#30D158" />
      </linearGradient>
    </defs>
  </motion.svg>
);

export const VSCodeSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size} height={size}
    animate={{ rotateY: [0, 360] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path fill="#0065A9" d="M70.4 4.4L37.2 34.5 15.5 18.4 4.4 24.5v51l11.1 6.1 21.8-16.1 33.1 30.1 21.2-9.9V14.3L70.4 4.4z" />
    <path fill="#007ACC" d="M70.4 4.4L49.2 25.6l-21-7.2-3.7 16.1 21 15.5-21 15.5 3.7 16L49.1 74.4l21.3 21.2 21.2-9.9V14.3L70.4 4.4z" />
    <path fill="#1F9CF0" d="M15.5 81.6l21.7-16.1-21.7-15.4z" />
    <path fill="white" d="M70.4 4.4L49.2 25.6 37.2 34.5v29.1l12-8.9 21.2 22V4.4z" opacity={0.25} />
  </motion.svg>
);

export const KotlinSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    viewBox="0 0 48 48"
    width={size} height={size}
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 2.5, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="kotlinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E44857" />
        <stop offset="50%" stopColor="#C711E1" />
        <stop offset="100%" stopColor="#7F52FF" />
      </linearGradient>
    </defs>
    <path fill="url(#kotlinGrad)" d="M4 4h40L24 24 44 44H4V4z" />
  </motion.svg>
);

export const CapacitorSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    viewBox="0 0 48 48"
    width={size} height={size}
    animate={{ rotate: [0, 360] }}
    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
  >
    <defs>
      <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#53B9FF" />
        <stop offset="100%" stopColor="#119EFF" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" fill="url(#capGrad)" />
    <circle cx="24" cy="24" r="12" fill="none" stroke="white" strokeWidth="3" />
    <circle cx="24" cy="24" r="4" fill="white" />
    <line x1="24" y1="4" x2="24" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <line x1="24" y1="36" x2="24" y2="44" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <line x1="4" y1="24" x2="12" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <line x1="36" y1="24" x2="44" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </motion.svg>
);

export const GooglePlaySVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    viewBox="0 0 48 48"
    width={size} height={size}
    animate={{ y: [0, -5, 0] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="playGrad1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00CDFF" />
        <stop offset="100%" stopColor="#009BDB" />
      </linearGradient>
      <linearGradient id="playGrad2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF3D00" />
        <stop offset="100%" stopColor="#FF9900" />
      </linearGradient>
    </defs>
    <path fill="url(#playGrad1)" d="M6 6l24 18L6 42V6z" />
    <path fill="#00E676" d="M6 6l18 18-4 4L6 6z" />
    <path fill="#FF5252" d="M6 42l14-14 10 10L6 42z" />
    <path fill="url(#playGrad2)" d="M30 24L6 6l28 10-4 8z" />
    <motion.path
      fill="url(#playGrad2)"
      d="M30 24L6 42l24-10-4-8z"
      animate={{ opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </motion.svg>
);

export const XcodeSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    viewBox="0 0 48 48"
    width={size} height={size}
    animate={{ rotateY: [0, 180, 360] }}
    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <defs>
      <linearGradient id="xcodeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#279EFF" />
        <stop offset="100%" stopColor="#0762D6" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#xcodeGrad)" />
    <path fill="white" d="M14 14l8 10-8 10h4l6-8 6 8h4l-8-10 8-10h-4l-6 8-6-8z" />
  </motion.svg>
);

export const SankhyaSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    viewBox="0 0 48 48"
    width={size} height={size}
    animate={{ scale: [1, 1.08, 1] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="sankhyaGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="#F7C59F" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="40" height="40" rx="8" fill="url(#sankhyaGrad)" />
    <text x="24" y="20" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="system-ui">ERP</text>
    <text x="24" y="30" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="system-ui">SANKHYA</text>
    <text x="24" y="39" textAnchor="middle" fill="white" fontSize="5" fontFamily="system-ui">navegador</text>
  </motion.svg>
);

export const CopilotSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    viewBox="0 0 48 48"
    width={size} height={size}
    animate={{ rotate: [0, 5, -5, 0] }}
    transition={{ duration: 4, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="copilotGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6e40c9" />
        <stop offset="100%" stopColor="#e040fb" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" fill="url(#copilotGrad)" />
    <circle cx="18" cy="20" r="6" fill="white" />
    <circle cx="30" cy="20" r="6" fill="white" />
    <circle cx="18" cy="20" r="3" fill="#24292e" />
    <circle cx="30" cy="20" r="3" fill="#24292e" />
    <path d="M16 30 Q24 36 32 30" stroke="white" strokeWidth="2" fill="none" />
    <motion.circle
      cx="24" cy="8" r="3"
      fill="white"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </motion.svg>
);

export const WebViewSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    viewBox="0 0 48 48"
    width={size} height={size}
    animate={{ x: [-2, 2, -2] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="webviewGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF9A00" />
        <stop offset="100%" stopColor="#FFD700" />
      </linearGradient>
    </defs>
    <rect x="4" y="8" width="40" height="32" rx="4" fill="#1a1a2e" stroke="url(#webviewGrad)" strokeWidth="2" />
    <circle cx="10" cy="14" r="2" fill="#ff5f57" />
    <circle cx="16" cy="14" r="2" fill="#febc2e" />
    <circle cx="22" cy="14" r="2" fill="#28c840" />
    <rect x="6" y="18" width="36" height="1" fill="rgba(255,255,255,0.1)" />
    <text x="24" y="32" textAnchor="middle" fill="url(#webviewGrad)" fontSize="8" fontWeight="bold" fontFamily="monospace">WebView</text>
  </motion.svg>
);

export const VisualStudioSVG = ({ size = 64 }: { size?: number }) => (
  <motion.svg
    viewBox="0 0 48 48"
    width={size} height={size}
    animate={{ rotate: [0, 360] }}
    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
  >
    <path fill="#68217A" d="M0 8l18.4 14.5L0 40z" />
    <path fill="#9B4F96" d="M0 8l18.4 14.5L10 25z" />
    <path fill="#68217A" d="M18.4 22.5L0 37v3l26.6 8 21.4-9V8L26.6 0 18.4 22.5z" />
    <path fill="#9B4F96" d="M26.6 0 18.4 22.5l8.2-6z" />
    <path fill="white" d="M26.6 0L48 8v32L26.6 48 18 37.5l16.6-13.8V24.4L18.4 22.5 26.6 0z" opacity={0.3} />
  </motion.svg>
);
