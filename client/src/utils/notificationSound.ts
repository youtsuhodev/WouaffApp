const audio = new Audio('/assets/sounds/new-message.wav');
audio.volume = 0.5;

export function playMessageSound(): void {
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
