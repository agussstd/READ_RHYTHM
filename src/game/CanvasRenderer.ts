// CanvasRenderer: 좌측 10~15% 여백 채보 영역, 4레인, 노트, 판정선, 이펙트 시각화
import { ActiveNoteState, Lane } from '../types/game';
import { JudgementResult, JUDGEMENT_COLORS } from './JudgementManager';

interface HitEffect {
  lane: Lane;
  startTime: number;
  duration: number; // ms
  judgement?: JudgementResult;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hitEffects: HitEffect[] = [];
  private lastJudgementText: { text: string; color: string; time: number } | null = null;
  private currentCombo: number = 0;

  // 노트 색상 설정
  private readonly COLOR_TAP = '#ef4444';     // 일반 탭 노트: 빨간색
  private readonly COLOR_SPECIAL = '#eab308'; // 스페셜 탭 노트: 노란색
  private readonly COLOR_HOLD = '#dc2626';    // 홀드 노트: 짙은 빨간색
  private readonly COLOR_HOLD_BODY = 'rgba(239, 68, 68, 0.45)';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public triggerHit(lane: Lane, judgement?: JudgementResult): void {
    const now = performance.now();
    this.hitEffects.push({
      lane,
      startTime: now,
      duration: 250,
      judgement
    });

    if (judgement) {
      this.lastJudgementText = {
        text: judgement.type,
        color: JUDGEMENT_COLORS[judgement.type],
        time: now
      };
    }
  }

  public setCombo(combo: number): void {
    this.currentCombo = combo;
  }

  /**
   * 메인 렌더링 프레임
   * @param notes 채보의 전체 노트 상태
   * @param currentTime 현재 YouTube 게임 시간(초)
   * @param speed 노트 속도 배속
   * @param isLanePressed 레인별 현재 키 눌림 상태
   */
  public render(
    notes: ActiveNoteState[],
    currentTime: number,
    speed: number,
    isLanePressed: (lane: Lane) => boolean
  ): void {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const now = performance.now();

    ctx.clearRect(0, 0, width, height);

    // 19.1 채보 영역: 왼쪽 끝에서부터 10~15%의 여백 공간 확보
    const marginLeft = width * 0.12; // 12% 여백
    const trackWidth = Math.min(width * 0.76, 460); // 최대 460px 또는 너비의 76%
    const laneWidth = trackWidth / 4;
    const trackRight = marginLeft + trackWidth;

    // 판정선 위치 (하단에서 약 15% 위)
    const judgmentY = height * 0.84;
    const noteHeight = 22;
    const hitAreaHeight = 36;

    // 초당 떨어지는 픽셀 수 (speed 기반)
    // speed 4.0 기준 약 600px/sec
    const pixelsPerSecond = 140 * speed;

    // 1. 트랙 배경 및 레인 그리기
    ctx.save();
    // 트랙 어두운 반투명 배경
    const bgGrad = ctx.createLinearGradient(marginLeft, 0, trackRight, 0);
    bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    bgGrad.addColorStop(1, 'rgba(30, 41, 59, 0.85)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(marginLeft, 0, trackWidth, height);

    // 레인 구분선 및 눌림 이펙트
    const laneKeys = ['D', 'F', 'J', 'K'];
    for (let l = 0; l < 4; l++) {
      const laneX = marginLeft + l * laneWidth;

      // 키가 눌려있을 때 레인 하이라이트 빔
      if (isLanePressed(l as Lane)) {
        const laneGrad = ctx.createLinearGradient(0, 0, 0, judgmentY);
        laneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.02)');
        laneGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.25)');
        laneGrad.addColorStop(1, 'rgba(56, 189, 248, 0.55)');
        ctx.fillStyle = laneGrad;
        ctx.fillRect(laneX, 0, laneWidth, judgmentY);
      }

      // 레인 테두리 선
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(laneX, 0);
      ctx.lineTo(laneX, height);
      ctx.stroke();

      // 키 안내 텍스트 (하단 판정선 아래)
      ctx.fillStyle = isLanePressed(l as Lane) ? '#38bdf8' : 'rgba(255, 255, 255, 0.45)';
      ctx.font = 'bold 18px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(laneKeys[l], laneX + laneWidth / 2, judgmentY + 45);
    }
    // 마지막 우측 외곽선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(trackRight, 0);
    ctx.lineTo(trackRight, height);
    ctx.stroke();

    // 2. 판정선 렌더링
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(marginLeft, judgmentY);
    ctx.lineTo(trackRight, judgmentY);
    ctx.stroke();
    ctx.shadowBlur = 0; // 리셋

    // 판정선 판정 영역 가이드
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(marginLeft, judgmentY - hitAreaHeight / 2, trackWidth, hitAreaHeight);
    ctx.restore();

    // 3. 노트 렌더링
    for (const note of notes) {
      if (note.isProcessed && !note.activeHold) continue;

      const laneX = marginLeft + note.lane * laneWidth + 4;
      const noteW = laneWidth - 8;

      // 노트의 판정선 도달 기준 Y 좌표 계산
      // note.time 일 때 targetY = judgmentY
      const timeDiff = note.time - currentTime;
      const targetY = judgmentY - timeDiff * pixelsPerSecond;

      // 화면 위나 아래로 너무 벗어난 노트는 렌더링 스킵
      if (targetY < -150 && (!note.holdDuration || targetY - note.holdDuration * pixelsPerSecond < -150)) {
        continue;
      }
      if (targetY > height + 100) {
        continue;
      }

      // 3.1 홀드 노트 바 렌더링
      if (note.type === 'hold' && note.holdDuration) {
        const holdHeight = note.holdDuration * pixelsPerSecond;
        const holdTopY = targetY - holdHeight;

        // 홀드 바 몸체
        ctx.save();
        ctx.fillStyle = this.COLOR_HOLD_BODY;
        ctx.strokeStyle = this.COLOR_HOLD;
        ctx.lineWidth = 2;

        const effectiveTopY = Math.min(holdTopY, judgmentY - (note.holdProgress || 0) * holdHeight);
        const currentHeadY = note.activeHold ? judgmentY : targetY;

        ctx.fillRect(laneX + 8, effectiveTopY, noteW - 16, Math.max(4, currentHeadY - effectiveTopY));
        ctx.strokeRect(laneX + 8, effectiveTopY, noteW - 16, Math.max(4, currentHeadY - effectiveTopY));

        // 홀드 끝부분 마커
        ctx.fillStyle = this.COLOR_HOLD;
        ctx.fillRect(laneX, effectiveTopY - noteHeight / 2, noteW, noteHeight / 2);
        ctx.restore();
      }

      // 3.2 노트 머리(Head) 렌더링
      const drawHeadY = note.activeHold ? judgmentY : targetY;

      ctx.save();
      if (note.type === 'special') {
        // 스페셜 탭 노트: 노란색 + 빛나는 효과
        ctx.fillStyle = this.COLOR_SPECIAL;
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 12;
      } else {
        // 일반 탭 / 홀드 헤드: 빨간색
        ctx.fillStyle = this.COLOR_TAP;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
      }

      // 둥근 사각형 노트 머리
      const radius = 6;
      ctx.beginPath();
      ctx.roundRect(laneX, drawHeadY - noteHeight / 2, noteW, noteHeight, radius);
      ctx.fill();

      // 노트 내부 하이라이트 라인
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(laneX + 4, drawHeadY - noteHeight / 2 + 3, noteW - 8, 3);
      ctx.restore();
    }

    // 4. 타격 이펙트 렌더링
    this.hitEffects = this.hitEffects.filter((fx) => now - fx.startTime < fx.duration);
    for (const fx of this.hitEffects) {
      const progress = (now - fx.startTime) / fx.duration;
      const alpha = 1 - progress;
      const laneX = marginLeft + fx.lane * laneWidth;

      ctx.save();
      // 타격 빛번짐
      const hitGrad = ctx.createRadialGradient(
        laneX + laneWidth / 2, judgmentY, 5,
        laneX + laneWidth / 2, judgmentY, laneWidth * 0.8
      );
      hitGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      hitGrad.addColorStop(0.5, `rgba(56, 189, 248, ${alpha * 0.6})`);
      hitGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = hitGrad;
      ctx.beginPath();
      ctx.arc(laneX + laneWidth / 2, judgmentY, laneWidth * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. 판정 텍스트 및 콤보 렌더링 (판정선 바로 위 중앙)
    ctx.save();
    const centerX = marginLeft + trackWidth / 2;
    const feedbackY = judgmentY - 65;

    // 판정 텍스트 (PERFECT, GOOD, FAST, FAIL)
    if (this.lastJudgementText && now - this.lastJudgementText.time < 500) {
      const elapsed = now - this.lastJudgementText.time;
      const scale = 1 + Math.max(0, (100 - elapsed) / 200); // 팝업 애니메이션
      const alpha = Math.min(1, (500 - elapsed) / 150);

      ctx.save();
      ctx.translate(centerX, feedbackY);
      ctx.scale(scale, scale);
      ctx.font = '900 28px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.lastJudgementText.color;
      ctx.shadowColor = this.lastJudgementText.color;
      ctx.shadowBlur = 15;
      ctx.globalAlpha = alpha;
      ctx.fillText(this.lastJudgementText.text, 0, 0);
      ctx.restore();
    }

    // 콤보 숫자 렌더링
    if (this.currentCombo > 0) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 15콤보 이상 시 황금빛 보너스 강조
      const isBonusActive = this.currentCombo >= 15;

      ctx.font = '900 36px "Chakra Petch", sans-serif';
      ctx.fillStyle = isBonusActive ? '#facc15' : '#ffffff';
      ctx.shadowColor = isBonusActive ? '#facc15' : 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = isBonusActive ? 16 : 8;
      ctx.fillText(`${this.currentCombo}`, centerX, feedbackY - 45);

      ctx.font = '700 14px "Chakra Petch", sans-serif';
      ctx.fillStyle = isBonusActive ? '#fde047' : 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(isBonusActive ? 'COMBO (x1.2)' : 'COMBO', centerX, feedbackY - 22);
    }

    ctx.restore();
  }
}
