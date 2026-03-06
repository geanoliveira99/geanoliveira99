import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { cn } from '../../lib/utils';

const hexToRgbNormalized = (hex: string): [number, number, number] => {
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return [r / 255, g / 255, b / 255];
};

interface GlobeProps {
  className?: string;
  theta?: number;
  dark?: number;
  scale?: number;
  diffuse?: number;
  mapSamples?: number;
  mapBrightness?: number;
  baseColor?: [number, number, number] | string;
  markerColor?: [number, number, number] | string;
  glowColor?: [number, number, number] | string;
}

const Globe: React.FC<GlobeProps> = ({
  className,
  theta = 0.25,
  dark = 1,
  scale = 1.1,
  diffuse = 1.2,
  mapSamples = typeof window !== 'undefined' && window.innerWidth < 768 ? 16000 : 40000,
  mapBrightness = 10,
  baseColor = '#6c63ff',
  markerColor = '#00d9ff',
  glowColor = '#5227FF',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef = useRef(0);
  const thetaRef = useRef(theta);
  const autoRotateSpeed = 0.003;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resolvedBase: [number, number, number] =
      typeof baseColor === 'string' ? hexToRgbNormalized(baseColor) : baseColor || [0.42, 0.39, 1];
    const resolvedMarker: [number, number, number] =
      typeof markerColor === 'string' ? hexToRgbNormalized(markerColor) : markerColor || [0, 0.85, 1];
    const resolvedGlow: [number, number, number] =
      typeof glowColor === 'string' ? hexToRgbNormalized(glowColor) : glowColor || [0.32, 0.15, 1];

    const initGlobe = () => {
      if (globeRef.current) { globeRef.current.destroy(); globeRef.current = null; }
      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;

      globeRef.current = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark,
        scale,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor: resolvedBase,
        markerColor: resolvedMarker,
        glowColor: resolvedGlow,
        opacity: 1,
        offset: [0, 0],
        markers: [
          { location: [-15.77972, -47.92972], size: 0.08 }, // Brasília, Brasil
          { location: [-23.5505, -46.6333], size: 0.06 },   // São Paulo
          { location: [37.7749, -122.4194], size: 0.05 },   // SF
          { location: [51.5074, -0.1278], size: 0.05 },     // Londres
          { location: [35.6762, 139.6503], size: 0.05 },    // Tóquio
        ],
        onRender: (state: Record<string, unknown>) => {
          phiRef.current += autoRotateSpeed;
          state.phi = phiRef.current;
          state.theta = thetaRef.current;
        },
      });
    };

    // ResizeObserver garante que o globo inicializa com o tamanho correto
    // mesmo no primeiro render mobile (getBoundingClientRect pode retornar 0 antes do layout)
    let lastSize = 0;
    const safeInit = () => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.round(Math.min(rect.width, rect.height));
      if (size < 10 || size === lastSize) return;
      lastSize = size;
      initGlobe();
    };

    const ro = new ResizeObserver(safeInit);
    ro.observe(canvas);
    // Tenta também no próximo frame para garantir layout completo
    const raf = requestAnimationFrame(safeInit);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (globeRef.current) { globeRef.current.destroy(); globeRef.current = null; }
    };
  }, [theta, dark, scale, diffuse, mapSamples, mapBrightness, baseColor, markerColor, glowColor]);

  return (
    <div className={cn('w-full h-full flex items-center justify-center', className)}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', aspectRatio: '1', display: 'block', pointerEvents: 'none', touchAction: 'none' }}
      />
    </div>
  );
};

export default Globe;
