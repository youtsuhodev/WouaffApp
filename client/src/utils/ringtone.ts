const audio = new Audio('/assets/sounds/sonerie.mp3');
audio.volume = 0.7;
audio.loop = true;

export function playRingtone(): void {
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopRingtone(): void {
  audio.pause();
  audio.currentTime = 0;
}
