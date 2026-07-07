export type AnimationType = 'fireworks' | 'confetti' | 'snow' | 'hearts' | 'stars' | 'candles' | 'bats';

export const KEYWORD_MAP: [RegExp, AnimationType][] = [
  [/felicitations|félicitations/i, 'fireworks'],
  [/bravo/i, 'confetti'],
  [/no[eé]l|joyeux no[eé]l|happy new year/i, 'snow'],
  [/bonne ann[eé]e/i, 'fireworks'],
  [/halloween/i, 'bats'],
  [/bonne chance/i, 'stars'],
  [/merci/i, 'hearts'],
  [/joyeux anniversaire|bon anniversaire/i, 'candles'],
];
