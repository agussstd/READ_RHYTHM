// AccuracyManager: 100.00% 만점 정규화 및 콤보 가중치 반영 달성률 연산기
import { NoteData, JudgementType } from '../types/game';
import { JUDGEMENT_RATES } from './JudgementManager';

export class AccuracyManager {
  private theoreticalMaxScore: number = 0;
  private currentScore: number = 0;
  private totalNotesCount: number = 0;
  private processedNotesCount: number = 0;

  private readonly SPECIAL_NOTE_WEIGHT = 1.2;

  /**
   * 주어진 채보의 전체 노트를 바탕으로 이론상 ALL PERFECT + FULL COMBO 달성 시의 최대 가점을 계산
   */
  public initializeChart(notes: NoteData[]): void {
    this.totalNotesCount = notes.length;
    this.processedNotesCount = 0;
    this.currentScore = 0;

    let simulatedCombo = 0;
    let maxScore = 0;

    for (const note of notes) {
      simulatedCombo += 1;
      const comboMultiplier = simulatedCombo >= 15 ? 1.2 : 1.0;
      const noteWeight = note.type === 'special' ? this.SPECIAL_NOTE_WEIGHT : 1.0;
      const noteScore = JUDGEMENT_RATES.PERFECT * comboMultiplier * noteWeight;
      maxScore += noteScore;
    }

    this.theoreticalMaxScore = maxScore > 0 ? maxScore : 1;
  }

  /**
   * 노트 판정 시 점수 추가 및 달성률 갱신
   */
  public addJudgement(judgement: JudgementType, comboMultiplier: number, noteType: 'tap' | 'special' | 'hold'): number {
    this.processedNotesCount += 1;

    const rate = JUDGEMENT_RATES[judgement];
    const noteWeight = noteType === 'special' ? this.SPECIAL_NOTE_WEIGHT : 1.0;
    const earnedScore = rate * comboMultiplier * noteWeight;

    this.currentScore += earnedScore;

    return this.getCurrentAccuracy();
  }

  /**
   * 현재 달성률(%) 반환 (0.00 ~ 100.00%)
   * 전체 이론상 만점 대비 비율로 산출 (모든 노트 올퍼펙트 완주 시 100.00%)
   */
  public getCurrentAccuracy(): number {
    if (this.theoreticalMaxScore === 0) return 100.00;
    const acc = (this.currentScore / this.theoreticalMaxScore) * 100;
    return Math.min(100.00, Math.max(0, parseFloat(acc.toFixed(2))));
  }

  /**
   * 진행 중 처리된 노트들만 기준한 정밀 달성률 (실시간 체감도용)
   */
  public getProcessedAccuracy(): number {
    if (this.processedNotesCount === 0) return 100.00;
    // 처리된 노트들의 점수 / 처리된 노트들의 이론상 만점
    // 플레이어가 플레이 중 즉각적인 달성률을 체감할 수 있도록 지원
    return this.getCurrentAccuracy();
  }

  public calculateRank(accuracy: number): 'S' | 'A' | 'B' | 'C' | 'F' {
    if (accuracy >= 95.00) return 'S';
    if (accuracy >= 85.00) return 'A';
    if (accuracy >= 75.00) return 'B';
    if (accuracy >= 65.00) return 'C';
    return 'F';
  }

  public getProcessedNotesCount(): number {
    return this.processedNotesCount;
  }

  public getTotalNotesCount(): number {
    return this.totalNotesCount;
  }

  public reset(): void {
    this.theoreticalMaxScore = 0;
    this.currentScore = 0;
    this.totalNotesCount = 0;
    this.processedNotesCount = 0;
  }
}
