// NoteManager: 노트 생성, 레인별 큐 관리, 만료 및 홀드 상태 추적
import { ActiveNoteState, Lane, NoteData } from '../types/game';
import { JudgementManager, JudgementResult } from './JudgementManager';

export class NoteManager {
  private allNotes: ActiveNoteState[] = [];
  private lanesQueue: [ActiveNoteState[], ActiveNoteState[], ActiveNoteState[], ActiveNoteState[]] = [[], [], [], []];
  private onNoteJudged?: (note: ActiveNoteState, result: JudgementResult) => void;

  public loadChart(notes: NoteData[]): void {
    // 시간순으로 정렬
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

  /**
   * 매 프레임 호출: 놓친 노트(FAIL) 자동 처리 및 홀드 진행 업데이트
   * @param currentTime 현재 YouTube 게임 시간(초)
   */
  public update(currentTime: number, isLanePressed: (lane: Lane) => boolean): void {
    const FAIL_LIMIT_SEC = JudgementManager.WINDOW_FAIL / 1000; // 0.2초

    for (let l = 0; l < 4; l++) {
      const laneQueue = this.lanesQueue[l as Lane];

      for (let i = 0; i < laneQueue.length; i++) {
        const note = laneQueue[i];
        if (note.isProcessed) continue;

        // 1. 홀드 노트가 활성 상태일 때
        if (note.type === 'hold' && note.activeHold && note.holdDuration) {
          const holdEndTime = note.time + note.holdDuration;
          const progress = Math.min(1.0, Math.max(0, (currentTime - note.time) / note.holdDuration));
          note.holdProgress = progress;

          const pressed = isLanePressed(l as Lane);

          // 키를 누르고 있는 중이면 일시 뗌 타이머 초기화
          if (pressed) {
            note.lastReleaseTime = undefined;
          } else {
            // 키를 뗀 상태: 유예 시간(Grace Period, 180ms) 버퍼링
            if (note.lastReleaseTime === undefined) {
              note.lastReleaseTime = currentTime;
            }
          }

          // 홀드가 끝까지 도달한 경우 (완벽 완주)
          if (currentTime >= holdEndTime - 0.08) {
            note.activeHold = false;
            note.isProcessed = true;
            note.holdProgress = 1.0;
            // 이미 시작 시점에 판정 및 콤보 1이 적립되었으므로, 중복 콤보/판정 가산 없이 종료 상태 완료
            continue;
          }

          // 키를 뗀 채로 유예 시간(0.18초) 이상 경과했고 아직 홀드 끝에 도달하지 못한 경우 -> FAIL 처리
          if (
            !pressed &&
            note.lastReleaseTime !== undefined &&
            currentTime - note.lastReleaseTime > 0.18 &&
            currentTime < holdEndTime - 0.08
          ) {
            note.activeHold = false;
            note.isProcessed = true;
            if (this.onNoteJudged) {
              this.onNoteJudged(note, {
                type: 'FAIL',
                diffMs: (holdEndTime - currentTime) * 1000,
                rate: 0.0
              });
            }
            continue;
          }
          continue;
        }

        // 2. 노트를 완전히 지나쳐서 놓친 경우 (Miss / FAIL)
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

  /**
   * 특정 레인의 키가 눌렸을 때 (KeyDown)
   */
  public handleLaneKeyDown(lane: Lane, currentTime: number): JudgementResult | null {
    const laneQueue = this.lanesQueue[lane];

    for (const note of laneQueue) {
      if (note.isProcessed || note.activeHold) continue;

      const diffMs = (currentTime - note.time) * 1000;
      const result = JudgementManager.judge(diffMs);

      if (result !== null) {
        if (note.type === 'hold') {
          if (result.type !== 'FAIL') {
            note.activeHold = true;
            note.lastReleaseTime = undefined;
            // 홀드 노트 누른 즉시 판정 콜백을 호출하여 COMBO 1 적립 및 타격 이펙트 발동!
            if (this.onNoteJudged) {
              this.onNoteJudged(note, result);
            }
            return result;
          } else {
            note.isProcessed = true;
            if (this.onNoteJudged) {
              this.onNoteJudged(note, result);
            }
            return result;
          }
        } else {
          note.isProcessed = true;
          if (this.onNoteJudged) {
            this.onNoteJudged(note, result);
          }
          return result;
        }
      }

      if (note.time - currentTime > JudgementManager.WINDOW_FAIL / 1000) {
        break;
      }
    }

    return null;
  }

  /**
   * 특정 레인의 키를 뗐을 때 (KeyUp - 홀드 노트 해제 처리)
   */
  public handleLaneKeyUp(lane: Lane, currentTime: number): void {
    const laneQueue = this.lanesQueue[lane];
    for (const note of laneQueue) {
      if (!note.isProcessed && note.activeHold && note.type === 'hold') {
        const holdEndTime = note.time + (note.holdDuration || 0);

        // 홀드 끝부분(끝나기 80ms 전)까지 유지한 후 뗀 경우 정상 완료
        if (currentTime >= holdEndTime - 0.08) {
          note.activeHold = false;
          note.isProcessed = true;
          note.holdProgress = 1.0;
        } else {
          // 키를 뗐으므로 일시 해제 시간 기록 (update 루프에서 유예 시간 후 FAIL 판단)
          if (note.lastReleaseTime === undefined) {
            note.lastReleaseTime = currentTime;
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
