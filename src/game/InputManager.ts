// InputManager: D, F, J, K 4개 키 입력 처리 및 리스너 관리
import { Lane } from '../types/game';

export type KeyHandler = (lane: Lane, timestamp: number) => void;

export const KEY_TO_LANE_MAP: Record<string, Lane> = {
  KeyD: 0,
  KeyF: 1,
  KeyJ: 2,
  KeyK: 3,
  d: 0,
  f: 1,
  j: 2,
  k: 3,
  D: 0,
  F: 1,
  J: 2,
  K: 3
};

export class InputManager {
  private isKeyPressed: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  private onKeyDownCallbacks: KeyHandler[] = [];
  private onKeyUpCallbacks: KeyHandler[] = [];
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private isListening: boolean = false;

  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }

  public startListening(): void {
    if (this.isListening) return;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    this.isListening = true;
  }

  public stopListening(): void {
    if (!this.isListening) return;
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.isListening = false;
    this.isKeyPressed = [false, false, false, false];
  }

  public onKeyDown(callback: KeyHandler): void {
    this.onKeyDownCallbacks.push(callback);
  }

  public onKeyUp(callback: KeyHandler): void {
    this.onKeyUpCallbacks.push(callback);
  }

  public isLanePressed(lane: Lane): boolean {
    return this.isKeyPressed[lane];
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;

    const lane = KEY_TO_LANE_MAP[e.code] ?? KEY_TO_LANE_MAP[e.key];
    if (lane !== undefined) {
      e.preventDefault();
      this.isKeyPressed[lane] = true;
      const now = performance.now();
      for (const cb of this.onKeyDownCallbacks) {
        cb(lane, now);
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const lane = KEY_TO_LANE_MAP[e.code] ?? KEY_TO_LANE_MAP[e.key];
    if (lane !== undefined) {
      e.preventDefault();
      this.isKeyPressed[lane] = false;
      const now = performance.now();
      for (const cb of this.onKeyUpCallbacks) {
        cb(lane, now);
      }
    }
  }

  public reset(): void {
    this.isKeyPressed = [false, false, false, false];
  }
}
