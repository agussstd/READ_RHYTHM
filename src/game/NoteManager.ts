// NoteManager: 노트 생성, 레인별 큐 관리, 만료 및 홀드 상태 추적
import { ActiveNoteState, Lane, NoteData } from '../types/game';
import { JudgementManager, JudgementResult } from './JudgementManager';

export class NoteManager {
  private allNotes: ActiveNoteState[] = [];
  private lanesQueue: [ActiveNoteState[], ActiveNoteState[], ActiveNoteState[], ActiveNoteState[]] = [[], [], [], []];
  private onNoteJudged?: (note: ActiveNoteState, result: JudgementResult) => void;

  public loadChart(notes: NoteData[]): void {
    const sorted = [...notes].sort((a, b) => a.time - b.time);
    this.allNotes = sorted.map((n) => ({
      ...n,
      spawned: false,
      isProcessed: false,
      activeHold: false,
      holdProgress: 0,
      holdEndJudged: false
    }));

    this.lanesQueue = [[], [], [], []];
    for (const note of this.allNotes) {
      this.lanesQueue[note.lane].push(note);
    }
  }

  public setJudgedCallback(callback: (note: ActiveNoteState, result: JudgementResult) => void): void {
    this.onNoteJudged = callback;
  }

  public update(currentTime: number, isLanePressed: (lane: Lane) => boolean): void {
    const FAIL_LIMIT_SEC = JudgementManager.WINDOW_FAIL / 1000; // 0.2초

    for (let l = 0; l < 4; l++) {
      const laneQueue = this.lanesQueue[l as Lane];

      for (let i = 0; i < laneQueue.length; i++) {
        const note = laneQueue[i];
        if (note.isProcessed) continue;

        // 홀드 노트
        if (note.type === 'hold' && note.activeHold && note.holdDuration) {
          const holdEndTime = note.time + note.holdDuration;
          const progress = Math.min(1.0, Math.max(0, (currentTime - note.time) / note.holdDuration));
          note.holdProgress = progress;

          const pressed = isLanePressed(l as Lane);

          // 일찍 뗀 경우
          if (!pressed && currentTime < holdEndTime - 0.1) {
            note.activeHold = false;
            note.isProcessed = true;
            if (this.onNoteJudged) {
              this.onNoteJudged(note, {
                type: 'FAIL',
                diffMs: 250,
                rate: 0.0
              });
            }
            continue;
          }

          // 홀드 완료
          if (currentTime >= holdEndTime) {
            note.activeHold = false;
            note.isProcessed = true;
            if (this.onNoteJudged) {
              this.onNoteJudged(note, {
                type: 'PERFECT',
                diffMs: 0,
                rate: 1.0
              });
            }
            continue;
          }
          continue;
        }

        // 놓친 노트 (FAIL)
        const timeDiff = currentTime - note.time;
        if (timeDiff > FAIL_LIMIT_SEC) {
          note.isProcessed = true;
          if (this.onNoteJudged) {
            this.onNoteJudged(note, {
              type: 'FAIL',
              diffMs: timeDiff * 1000,
              rate: 0.0
            });
          }
        }
      }
    }
  }

  public handleLaneKeyDown(lane: Lane, currentTime: number): JudgementResult | null {
    const laneQueue = this.lanesQueue[lane];

    for (const note of laneQueue) {
      if (note.isProcessed) continue;

      const diffMs = (currentTime - note.time) * 1000;
      const result = JudgementManager.judge(diffMs);

      if (result !== null) {
        if (note.type === 'hold') {
          if (result.type !== 'FAIL') {
            note.activeHold = true;
          } else {
            note.isProcessed = true;
          }
        } else {
          note.isProcessed = true;
        }

        if (this.onNoteJudged) {
          this.onNoteJudged(note, result);
        }
        return result;
      }

      if (note.time - currentTime > JudgementManager.WINDOW_FAIL / 1000) {
        break;
      }
    }

    return null;
  }

  public handleLaneKeyUp(lane: Lane, currentTime: number): void {
    const laneQueue = this.lanesQueue[lane];
    for (const note of laneQueue) {
      if (!note.isProcessed && note.activeHold && note.type === 'hold') {
        const holdEndTime = note.time + (note.holdDuration || 0);
        if (currentTime < holdEndTime - 0.08) {
          note.activeHold = false;
          note.isProcessed = true;
          if (this.onNoteJudged) {
            this.onNoteJudged(note, {
              type: 'FAIL',
              diffMs: (holdEndTime - currentTime) * 1000,
              rate: 0.0
            });
          }
        } else {
          note.activeHold = false;
          note.isProcessed = true;
          if (this.onNoteJudged) {
            this.onNoteJudged(note, {
              type: 'PERFECT',
              diffMs: 0,
              rate: 1.0
            });
          }
        }
        break;
      }
    }
  }

  public getAllNotes(): ActiveNoteState[] {
    return this.allNotes;
  }

  public reset(): void {
    this.allNotes = [];
    this.lanesQueue = [[], [], [], []];
  }
}
