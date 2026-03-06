import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  separator?: string;
  className?: string;
  suffix?: string;
  prefix?: string;
  colorScheme?: 'default' | 'gradient';
}

export function CountUp({ value, duration = 2, separator = ',', className = '', suffix = '', prefix = '', colorScheme = 'default' }: CountUpProps) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, duration]);

  const formatted = count.toLocaleString('en-US').replace(/,/g, separator);

  if (colorScheme === 'gradient') {
    return (
      <span className={`gradient-text font-bold ${className}`}>
        {prefix}{formatted}{suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
