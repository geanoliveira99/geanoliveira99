import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrustedUsers } from './ui/TrustedUsers';
import { CountUp } from './ui/CountUp';

const stats = [
  { value: 16, suffix: '', label: 'Projetos Entregues', color: 'var(--primary)' },
  { value: 3, suffix: ' anos', label: 'de Experiência', color: 'var(--secondary)' },
  { value: 10, suffix: '+', label: 'Clientes Satisfeitos', color: 'var(--accent)' },
  { value: 10, suffix: '+', label: 'Apps na Play Store', color: '#8CC84B' },
];

// Mock avatar URLs using a free avatar service
const mockAvatars = [
  'https://i.pravatar.cc/40?img=1',
  'https://i.pravatar.cc/40?img=2',
  'https://i.pravatar.cc/40?img=3',
  'https://i.pravatar.cc/40?img=4',
  'https://i.pravatar.cc/40?img=5',
];

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-16 px-4" style={{ background: 'var(--bg2)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Stats row */}
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-center p-5 rounded-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="text-3xl sm:text-4xl font-black mb-1" style={{ color: stat.color }}>
                {isInView ? (
                  <CountUp value={stat.value} suffix={stat.suffix} duration={2} />
                ) : (
                  <span>0{stat.suffix}</span>
                )}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* TrustedUsers component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex justify-center"
        >
          <TrustedUsers
            avatars={mockAvatars}
            rating={5}
            totalUsersText={10}
            caption="Confiado por"
            pricingLabel="clientes satisfeitos"
            ringColors={[
              'ring-purple-500',
              'ring-cyan-500',
              'ring-green-500',
              'ring-red-500',
              'ring-yellow-500',
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}
