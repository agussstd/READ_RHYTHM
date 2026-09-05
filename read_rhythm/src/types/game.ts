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
  isProcessed?: boolean; // 판정 완료 여부
  judgement?: JudgementType;
}

export interface ChartData {
  songId: string;
  difficulty: DifficultyLevel;
  bpm: number;
  offset: number; // 밀리초 단위 (ms)
  notes: NoteData[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: MusicCategory;
  youtubeVideoId: string;
  jacketImage?: string;
  previewStartTime?: number; // 미리듣기 시작 시간 (초)
  charts: {
    [key in DifficultyLevel]?: string; // 채보 json 파일 경로 또는 내장 데이터 키
  };
}

export interface GameSettings {
  noteSpeed: number; // 배속 (1.0 ~ 10.0, 기본값 4.0)
  globalOffset: number; // 싱크 조절 (ms, 기본값 0, 1ms 단위 조절)
  bgDim: number; // 배경 영상 투명도 (0.0 ~ 1.0, 기본값 0.4)
  hitVolume: number; // 효과음 볼륨 (0.0 ~ 1.0)
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
  holdProgress?: number; // 0 ~ 1
  holdEndJudged?: boolean;
}
