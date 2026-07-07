interface ElectronAPI {
  platform: string;
  appVersion: string;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (cb: (val: boolean) => void) => () => void;
  updateDiscordPresence: (page: string) => void;
}

interface Window {
  electronAPI: ElectronAPI | undefined;
}
