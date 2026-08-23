export interface AudioBackend {
  playMusic(id: string): void;
  stopMusic(): void;
  playSound(id: string): void;
  setMusicVolume(volume: number): void;
  setSoundVolume(volume: number): void;
}

export class NullAudioBackend implements AudioBackend {
  playMusic(_id: string): void {}
  stopMusic(): void {}
  playSound(_id: string): void {}
  setMusicVolume(_volume: number): void {}
  setSoundVolume(_volume: number): void {}
}
