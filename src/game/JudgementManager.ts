// JudgementManager: 입력 시간과 목표 시간의 차이를 기반으로 판정 산출
import { JudgementType } from '../types/game';

export const JUDGEMENT_RATES: Record<JudgementType, number> = {
  PERFECT: 1.0,
  GOOD: 0.5,
  FAST: 0.3,
  FAIL: 0.0
};

export const JUDGEMENT_COLORS: Record<JudgementType, string> = {
  PERFECT: '#facc15',
  GOOD: '#38bdf8',
  FAST: '#a855f7',
  FAIL: '#ef4444'
};

export interface JudgementResult {
  type: JudgementType;
  diffMs: number;
  rate: number;
}

export class JudgementManager {
  public static readonly WINDOW_PERFECT = 50; // ±50ms
  public static readonly WINDOW_GOOD = 100;    // ±100ms
  public static readonly WINDOW_FAST = 150;    // ±150ms
  public static readonly WINDOW_FAIL = 200;    // ±200ms 초과 시 FAIL

  public static judge(timeDiffMs: number): JudgementResult | null {
    const absDiff = Math.abs(timeDiffMs);

    if (absDiff <= JudgementManager.WINDOW_PERFECT) {
      return {
        type: 'PERFECT',
        diffMs: timeDiffMs,
        rate: JUDGEMENT_RATES.PERFECT
      };
    }

    if (absDiff <= JudgementManager.WINDOW_GOOD) {
      return {
        type: 'GOOD',
        diffMs: timeDiffMs,
        rate: JUDGEMENT_RATES.GOOD
      };
    }

    if (absDiff <= JudgementManager.WINDOW_FAST) {
      return {
        type: 'FAST',
        diffMs: timeDiffMs,
        rate: JUDGEMENT_RATES.FAST
      };
    }

    if (absDiff <= JudgementManager.WINDOW_FAIL) {
      return {
        type: 'FAIL',
        diffMs: timeDiffMs,
        rate: JUDGEMENT_RATES.FAIL
      };
    }

    return null;
  }
}
