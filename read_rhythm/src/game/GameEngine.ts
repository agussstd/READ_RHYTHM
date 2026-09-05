// GameEngine: 게임 핵심 루프(requestAnimationFrame), 상태 동기화 및 생명주기 관리
import { ChartData, GameResult, GameSettings, JudgementCount, Song } from '../types/game';
import { YouTubeTimingManager } from './YouTubeTimingManager';
import { NoteManager } from './NoteManager';
import { InputManager } from './InputManager';
import { ComboManager } from './ComboManager';
import { AccuracyManager } from './AccuracyManager';
import { CanvasRenderer } from './CanvasRenderer';
import { JudgementResult } from './JudgementManager';

export interface GameEngineCallbacks {
  onUpdateStats?: (stats: {
    currentTime: number;
    combo: number;
    maxCombo: number;
    accuracy: number;
  }) => void;
  onGameEnd?: (result: GameResult) => void;
}

export class GameEngine {
  private timingManager: YouTubeTimingManager;
  private noteManager: NoteManager;
  private inputManager: InputManager;
  private comboManager: ComboManager;
  private accuracyManager: AccuracyManager;
  private renderer?: CanvasRenderer;

  private currentSong?: Song;
  private currentChart?: ChartData;
  private settings: GameSettings;
  private callbacks: GameEngineCallbacks = {};

  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private judgements: JudgementCount = {
    PERFECT: 0,
    GOOD: 0,
    FAST: 0,
    FAIL: 0
  };

  constructor(settings: GameSettings) {
    this.settings = settings;
    this.timingManager = new YouTubeTimingManager();
    this.noteManager = new NoteManager();
    this.inputManager = new InputManager();
    this.comboManager = new ComboManager();
    this.accuracyManager = new AccuracyManager();

    this.setupNoteJudgementHandler();
    this.setupInputHandlers();
  }

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.renderer = new CanvasRenderer(canvas);
  }

  public getTimingManager(): YouTubeTimingManager {
    return this.timingManager;
  }

  public updateSettings(newSettings: GameSettings): void {
    this.settings = newSettings;
    if (this.currentChart) {
      this.timingManager.setOffsets(this.currentChart.offset, newSettings.globalOffset);
    }
  }

  private setupNoteJudgementHandler(): void {
    this.noteManager.setJudgedCallback((note, result: JudgementResult) => {
      // 1. 판정 카운트 기록
      this.judgements[result.type] += 1;

      // 2. 콤보 처리
      const comboInfo = this.comboManager.processJudgement(result.type);
      if (this.renderer) {
        this.renderer.setCombo(comboInfo.combo);
        this.renderer.triggerHit(note.lane, result);
      }

      // 3. 100.00% 만점 기준 달성률 가점 연산
      const currentAcc = this.accuracyManager.addJudgement(
        result.type,
        comboInfo.multiplier,
        note.type
      );

      // 통계 콜백 전송
      if (this.callbacks.onUpdateStats) {
        this.callbacks.onUpdateStats({
          currentTime: this.timingManager.getCurrentGameTime(),
          combo: comboInfo.combo,
          maxCombo: comboInfo.maxCombo,
          accuracy: currentAcc
        });
      }

      // 모든 노트가 처리되었고 영상 끝부분인 경우 자동 종료 확인
      this.checkAllNotesProcessed();
    });
  }

  private setupInputHandlers(): void {
    this.inputManager.onKeyDown((lane) => {
      if (!this.isRunning) return;
      const gameTime = this.timingManager.getCurrentGameTime();
      const result = this.noteManager.handleLaneKeyDown(lane, gameTime);
      if (!result && this.renderer) {
        // 빈 곳 타격 이펙트
        this.renderer.triggerHit(lane);
      }
    });

    this.inputManager.onKeyUp((lane) => {
      if (!this.isRunning) return;
      const gameTime = this.timingManager.getCurrentGameTime();
      this.noteManager.handleLaneKeyUp(lane, gameTime);
    });
  }

  public async prepareGame(
    containerId: string,
    song: Song,
    chart: ChartData,
    callbacks: GameEngineCallbacks
  ): Promise<void> {
    this.currentSong = song;
    this.currentChart = chart;
    this.callbacks = callbacks;

    // 모듈 초기화
    this.judgements = { PERFECT: 0, GOOD: 0, FAST: 0, FAIL: 0 };
    this.comboManager.reset();
    this.accuracyManager.reset();
    this.accuracyManager.initializeChart(chart.notes);
    this.noteManager.loadChart(chart.notes);

    // 유튜브 플레이어 초기화
    await this.timingManager.initPlayer(
      containerId,
      song.youtubeVideoId,
      () => {
        // Ready
      },
      () => {
        // Ended
        this.finishGame();
      }
    );

    this.timingManager.setOffsets(chart.offset, this.settings.globalOffset);
  }

  public startGame(): void {
    this.isRunning = true;
    this.inputManager.startListening();
    this.timingManager.play();

    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private loop(): void {
    if (!this.isRunning) return;

    const gameTime = this.timingManager.getCurrentGameTime();

    // 1. 노트 상태 업데이트 (미스/홀드 검사)
    this.noteManager.update(gameTime, (lane) => this.inputManager.isLanePressed(lane));

    // 2. 캔버스 렌더링
    if (this.renderer) {
      this.renderer.render(
        this.noteManager.getAllNotes(),
        gameTime,
        this.settings.noteSpeed,
        (lane) => this.inputManager.isLanePressed(lane)
      );
    }

    // 3. 주기적 통계 갱신
    if (this.callbacks.onUpdateStats) {
      this.callbacks.onUpdateStats({
        currentTime: gameTime,
        combo: this.comboManager.getCurrentCombo(),
        maxCombo: this.comboManager.getMaxCombo(),
        accuracy: this.accuracyManager.getCurrentAccuracy()
      });
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private checkAllNotesProcessed(): void {
    const total = this.accuracyManager.getTotalNotesCount();
    const processed = this.accuracyManager.getProcessedNotesCount();
    if (total > 0 && processed >= total) {
      // 마지막 노트 처리 후 2초 뒤 자동 종료 (영상 감상 후 종료되도록 할 수도 있음)
      setTimeout(() => {
        if (this.isRunning) {
          this.finishGame();
        }
      }, 2500);
    }
  }

  public finishGame(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.inputManager.stopListening();
    this.timingManager.pause();

    const finalAccuracy = this.accuracyManager.getCurrentAccuracy();
    const rank = this.accuracyManager.calculateRank(finalAccuracy);

    const result: GameResult = {
      songTitle: this.currentSong?.title || 'Unknown Title',
      artist: this.currentSong?.artist || 'Unknown Artist',
      difficulty: this.currentChart?.difficulty || 'easy',
      rank,
      accuracy: finalAccuracy,
      maxCombo: this.comboManager.getMaxCombo(),
      totalNotes: this.accuracyManager.getTotalNotesCount(),
      processedNotes: this.accuracyManager.getProcessedNotesCount(),
      judgements: { ...this.judgements }
    };

    if (this.callbacks.onGameEnd) {
      this.callbacks.onGameEnd(result);
    }
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.inputManager.stopListening();
    this.timingManager.destroy();
  }
}
