import type { AnimationType } from './keywords';

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function generateParticles(type: AnimationType): Particle[] {
  switch (type) {
    case 'fireworks':
      return range(80).map((i) => ({
        id: i,
        emoji: ['✨', '⭐', '🌟', '💫', '🎆', '🎇'][Math.floor(Math.random() * 6)],
        x: rand(10, 90),
        y: rand(10, 90),
        size: rand(16, 32),
        delay: rand(0, 1.5),
        duration: rand(1.5, 3),
        rotation: rand(0, 360),
      }));
    case 'confetti':
      return range(100).map((i) => ({
        id: i,
        emoji: ['🎉', '🎊', '⭐', '✨', '💛', '💜', '💙', '💚', '🧡', '❤️'][Math.floor(Math.random() * 10)],
        x: rand(0, 100),
        y: rand(-20, -5),
        size: rand(14, 26),
        delay: rand(0, 2),
        duration: rand(2, 4),
        rotation: rand(0, 360),
      }));
    case 'snow':
      return range(60).map((i) => ({
        id: i,
        emoji: ['❄️', '❄️', '❄️', '⛄', '☃️'][Math.floor(Math.random() * 5)],
        x: rand(0, 100),
        y: rand(-30, -10),
        size: rand(12, 24),
        delay: rand(0, 3),
        duration: rand(3, 6),
        rotation: rand(0, 360),
      }));
    case 'hearts':
      return range(50).map((i) => ({
        id: i,
        emoji: ['❤️', '💕', '💗', '💖', '💝', '🩷'][Math.floor(Math.random() * 6)],
        x: rand(10, 90),
        y: rand(50, 100),
        size: rand(18, 34),
        delay: rand(0, 1),
        duration: rand(2, 4),
        rotation: rand(-20, 20),
      }));
    case 'stars':
      return range(40).map((i) => ({
        id: i,
        emoji: ['⭐', '🌟', '✨', '💫'][Math.floor(Math.random() * 4)],
        x: rand(5, 95),
        y: rand(10, 90),
        size: rand(16, 30),
        delay: rand(0, 2),
        duration: rand(1.5, 3),
        rotation: rand(0, 360),
      }));
    case 'candles':
      return range(70).map((i) => ({
        id: i,
        emoji: ['🎂', '🕯️', '🕯️', '🎈', '🎉', '🎊', '✨', '💫'][Math.floor(Math.random() * 8)],
        x: rand(5, 95),
        y: rand(10, 90),
        size: rand(18, 40),
        delay: rand(0, 1.5),
        duration: rand(2, 4),
        rotation: rand(0, 360),
      }));
    case 'bats':
      return range(50).map((i) => ({
        id: i,
        emoji: ['🦇', '🎃', '👻', '🕸️', '🕷️'][Math.floor(Math.random() * 5)],
        x: rand(0, 100),
        y: rand(-20, 0),
        size: rand(18, 36),
        delay: rand(0, 3),
        duration: rand(3, 6),
        rotation: rand(-30, 30),
      }));
  }
}
