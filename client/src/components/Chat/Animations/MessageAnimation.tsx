import { useEffect, useMemo, useState } from 'react';
import type { AnimationType } from './keywords';
import { generateParticles } from './particles';

interface Props {
  type: AnimationType;
  onEnd: () => void;
}

function animationClass(type: AnimationType): string {
  switch (type) {
    case 'fireworks': return 'anim-fireworks';
    case 'confetti': return 'anim-confetti';
    case 'snow': return 'anim-snow';
    case 'hearts': return 'anim-hearts';
    case 'stars': return 'anim-stars';
    case 'candles': return 'anim-candles';
    case 'bats': return 'anim-bats';
  }
}

export default function MessageAnimation({ type, onEnd }: Props) {
  const [visible, setVisible] = useState(true);
  const particles = useMemo(() => generateParticles(type), [type]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onEnd();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onEnd]);

  if (!visible) return null;

  return (
    <div className={`msg-animation-overlay ${animationClass(type)}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="msg-animation-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
