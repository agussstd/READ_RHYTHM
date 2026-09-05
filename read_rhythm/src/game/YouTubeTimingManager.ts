// YouTube Timing Manager: YouTube IFrame API를 메인 타임 클록으로 사용
// Web Audio API를 사용하지 않고 오직 YouTube Player의 getCurrentTime()을 기준으로 시간 동기화

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export class YouTubeTimingManager {
  private player: any = null;
  private isReady: boolean = false;
  private isPlaying: boolean = false;
  private lastKnownTime: number = 0;
  private lastUpdateTimestamp: number = 0;
  private songOffset: number = 0; // ms
  private userOffset: number = 0; // ms
  private onEndedCallback?: () => void;
  private onReadyCallback?: () => void;

  constructor() {
    this.ensureYouTubeAPILoaded();
  }

  private ensureYouTubeAPILoaded(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (window.YT && typeof window.YT.Player === 'function') {
          resolve();
          return true;
        }
        return false;
      };

      if (checkReady()) return;

      const existingTag = document.getElementById('youtube-iframe-api');
      if (!existingTag) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const previousOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousOnReady) previousOnReady();
        checkReady();
      };

      const interval = setInterval(() => {
        if (checkReady()) {
          clearInterval(interval);
        }
      }, 50);
    });
  }

  public async initPlayer(
    containerId: string,
    videoId: string,
    onReady?: () => void,
    onEnded?: () => void
  ): Promise<void> {
    await this.ensureYouTubeAPILoaded();
    this.onReadyCallback = onReady;
    this.onEndedCallback = onEnded;

    if (this.player) {
      try {
        this.player.destroy();
      } catch (e) {
        console.warn('Error destroying player', e);
      }
      this.player = null;
    }

    this.isReady = false;
    this.isPlaying = false;
    this.lastKnownTime = 0;
    this.lastUpdateTimestamp = performance.now();

    return new Promise((resolve) => {
      this.player = new window.YT.Player(containerId, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: () => {
            this.isReady = true;
            if (this.onReadyCallback) this.onReadyCallback();
            resolve();
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1, ENDED = 0, PAUSED = 2, BUFFERING = 3
            if (event.data === 1) {
              this.isPlaying = true;
              this.lastKnownTime = this.player.getCurrentTime();
              this.lastUpdateTimestamp = performance.now();
            } else if (event.data === 0) {
              this.isPlaying = false;
              if (this.onEndedCallback) this.onEndedCallback();
            } else {
              this.isPlaying = false;
            }
          },
          onError: (err: any) => {
            console.error('YouTube Player Error:', err);
          }
        }
      });
    });
  }

  public setOffsets(songOffsetMs: number, userOffsetMs: number) {
    this.songOffset = songOffsetMs;
    this.userOffset = userOffsetMs;
  }

  public play(): void {
    if (this.player && this.isReady) {
      this.player.playVideo();
    }
  }

  public pause(): void {
    if (this.player && this.isReady) {
      this.player.pauseVideo();
      this.isPlaying = false;
    }
  }

  public seekTo(seconds: number): void {
    if (this.player && this.isReady) {
      this.player.seekTo(seconds, true);
      this.lastKnownTime = seconds;
      this.lastUpdateTimestamp = performance.now();
    }
  }

  /**
   * 핵심 메인 타임 클록 (초 단위 반환)
   * 오프셋(songOffset + userOffset)이 감안된 정밀 시간 반환
   * YouTube getCurrentTime()의 갱신 주기(약 100~250ms) 한계를
   * performance.now() 보간을 통해 정밀 마이크로초 단위로 보정하되,
   * 버퍼링 및 드리프트를 getCurrentTime()과 주기적으로 재동기화함.
   */
  public getCurrentGameTime(): number {
    if (!this.player || !this.isReady) {
      return 0;
    }

    const now = performance.now();

    if (this.isPlaying) {
      try {
        const rawTime = this.player.getCurrentTime();
        if (typeof rawTime === 'number' && !isNaN(rawTime)) {
          // YouTube 플레이어의 시간이 전진했을 때 기준점 업데이트
          if (rawTime !== this.lastKnownTime) {
            this.lastKnownTime = rawTime;
            this.lastUpdateTimestamp = now;
          }
        }
      } catch (e) {
        // IFrame 통신 일시 오류 무시
      }

      // 프레임간 시간 보간 (최대 0.3초 한도)
      const elapsedSinceUpdate = Math.min((now - this.lastUpdateTimestamp) / 1000, 0.3);
      const interpolatedTime = this.lastKnownTime + elapsedSinceUpdate;

      // 총 오프셋 (초 단위) 적용
      const totalOffsetSec = (this.songOffset + this.userOffset) / 1000;
      return Math.max(0, interpolatedTime - totalOffsetSec);
    }

    return Math.max(0, this.lastKnownTime - (this.songOffset + this.userOffset) / 1000);
  }

  public getDuration(): number {
    if (this.player && this.isReady) {
      try {
        return this.player.getDuration() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public destroy(): void {
    if (this.player) {
      try {
        this.player.destroy();
      } catch {}
      this.player = null;
    }
    this.isReady = false;
    this.isPlaying = false;
  }
}
