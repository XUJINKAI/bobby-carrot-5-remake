export type MusicStyle = "modern" | "8bit";

export interface AudioBackend {
  playMusic(id: string): void;
  stopMusic(): void;
  playSound(id: string): void;
  setMusicEnabled(enabled: boolean): void;
  isMusicEnabled(): boolean;
  setMusicGain(gain: number): void;
  getMusicGain(): number;
  setSoundGain(gain: number): void;
  getSoundGain(): number;
  setMusicStyle(style: MusicStyle): void;
  getMusicStyle(): MusicStyle;
  getMusicPosition(): number;
  resume(): void;
}

export class NullAudioBackend implements AudioBackend {
  playMusic(_id: string): void {}
  stopMusic(): void {}
  playSound(_id: string): void {}
  setMusicEnabled(_enabled: boolean): void {}
  isMusicEnabled(): boolean {
    return false;
  }
  setMusicGain(_gain: number): void {}
  getMusicGain(): number {
    return 0;
  }
  setSoundGain(_gain: number): void {}
  getSoundGain(): number {
    return 0;
  }
  setMusicStyle(_style: MusicStyle): void {}
  getMusicStyle(): MusicStyle {
    return "8bit";
  }
  getMusicPosition(): number {
    return 0;
  }
  resume(): void {}
}
