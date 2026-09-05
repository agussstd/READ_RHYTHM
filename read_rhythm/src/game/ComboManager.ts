// ComboManager: 콤보 및 15콤보 이상 1.2배 보너스 배율 관리
import { JudgementType } from '../types/game';

export class ComboManager {
  private currentCombo: number = 0;
  private maxCombo: number = 0;
  private readonly BONUS_THRESHOLD = 15; // 15콤보 이상 시 1.2배 가중치
  private readonly BONUS_MULTIPLIER = 1.2;
  private readonly DEFAULT_MULTIPLIER = 1.0;

  public processJudgement(judgement: JudgementType): { combo: number; maxCombo: number; multiplier: number } {
    if (judgement === 'PERFECT' || judgement === 'GOOD') {
      this.currentCombo += 1;
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
      }
    } else {
      // FAST 또는 FAIL 시 콤보 리셋
      this.currentCombo = 0;
    }

    return {
      combo: this.currentCombo,
      maxCombo: this.maxCombo,
      multiplier: this.getMultiplier()
    };
  }

  public getMultiplier(): number {
    return this.currentCombo >= this.BONUS_THRESHOLD ? this.BONUS_MULTIPLIER : this.DEFAULT_MULTIPLIER;
  }

  public getCurrentCombo(): number {
    return this.currentCombo;
  }

  public getMaxCombo(): number {
    return this.maxCombo;
  }

  public reset(): void {
    this.currentCombo = 0;
    this.maxCombo = 0;
  }
}
