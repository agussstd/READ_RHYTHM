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
      this.judgements[result.type] += 1;

      const comboInfo = this.comboManager.processJudgement(result.type);
      if (this.renderer) {
        this.renderer.setCombo(comboInfo.combo);
        this.renderer.triggerHit(note.lane, result);
      }

      const currentAcc = this.accuracyManager.addJudgement(
        result.type,
        comboInfo.multiplier,
        note.type
      );

      if (this.callbacks.onUpdateStats) {
        this.callbacks.onUpdateStats({
          currentTime: this.timingManager.getCurrentGameTime(),
          combo: comboInfo.combo,
          maxCombo: comboInfo.maxCombo,
          accuracy: currentAcc
        });
      }

      this.checkAllNotesProcessed();
    });
  }

  private setupInputHandlers(): void {
    this.inputManager.onKeyDown((lane) => {
      if (!this.isRunning) return;
      const gameTime = this.timingManager.getCurrentGameTime();
      const result = this.noteManager.handleLaneKeyDown(lane, gameTime);
      if (!result && this.renderer) {
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

    this.judgements = { PERFECT: 0, GOOD: 0, FAST: 0, FAIL: 0 };
    this.comboManager.reset();
    this.accuracyManager.reset();
    this.accuracyManager.initializeChart(chart.notes);
    this.noteManager.loadChart(chart.notes);

    await this.timingManager.initPlayer(
      containerId,
      song.youtubeVideoId,
      () => {},
      () => {
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

    this.noteManager.update(gameTime, (lane) => this.inputManager.isLanePressed(lane));

    if (this.renderer) {
      this.renderer.render(
        this.noteManager.getAllNotes(),
        gameTime,
        this.settings.noteSpeed,
        (lane) => this.inputManager.isLanePressed(lane)
      );
    }

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
