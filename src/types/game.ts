export type Lane = 0 | 1 | 2 | 3; // 0: D, 1: F, 2: J, 3: K

export type NoteType = 'tap' | 'special' | 'hold';

export type JudgementType = 'PERFECT' | 'GOOD' | 'FAST' | 'FAIL';

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'master';

export const DIFFICULTY_NAMES: Record<DifficultyLevel, string> = {
  easy: 'かんたん',
  normal: 'ふつう',
  hard: 'むずかしい',
  master: 'マスター'
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: '#22c55e',   // 초록색
  normal: '#f97316', // 주황색
  hard: '#ef4444',   // 빨간색
  master: '#a855f7'  // 보라색
};

export type MusicCategory = 'J-POP' | 'VOCALOID' | 'VARIETY';

export interface NoteData {
  id: string;
  time: number; // 초 단위 (seconds)
  lane: Lane;
  type: NoteType;
  holdDuration?: number; // 초 단위 (hold 타입인 경우)
  isProcessed?: boolean;
  judgement?: JudgementType;
}

export interface ChartData {
  songId: string;
  difficulty: DifficultyLevel;
  bpm: number;
  offset: number; // ms
  notes: NoteData[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: MusicCategory;
  youtubeVideoId: string;
  jacketImage?: string;
  previewStartTime?: number;
  charts: {
    [key in DifficultyLevel]?: string;
  };
}

export interface GameSettings {
  noteSpeed: number; // 1.0 ~ 10.0 (기본값 4.0)
  globalOffset: number; // 1ms 단위 싱크 조절 (ms)
  bgDim: number;
  hitVolume: number;
}

export interface JudgementCount {
  PERFECT: number;
  GOOD: number;
  FAST: number;
  FAIL: number;
}

export interface GameResult {
  songTitle: string;
  artist: string;
  difficulty: DifficultyLevel;
  rank: 'S' | 'A' | 'B' | 'C' | 'F';
  accuracy: number; // 0.00 ~ 100.00%
  maxCombo: number;
  totalNotes: number;
  processedNotes: number;
  judgements: JudgementCount;
}

export interface ActiveNoteState extends NoteData {
  spawned: boolean;
  activeHold?: boolean;
  holdProgress?: number;
  holdEndJudged?: boolean;
}
