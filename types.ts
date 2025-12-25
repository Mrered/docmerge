export interface DocFile {
  id: string;
  file: File;
  name: string;
  size: number;
  lastModified: number;
}

export type SortType = 'manual' | 'name' | 'size' | 'date';

export interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
