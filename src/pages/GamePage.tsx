import React, { useEffect, useRef, useState } from 'react';
import { DifficultyLevel, DIFFICULTY_NAMES, GameResult, GameSettings, Song } from '../types/game';
import { GameEngine } from '../game/GameEngine';
import { fetchChart } from '../data/songs';

interface GamePageProps {
  song: Song;
  difficulty: DifficultyLevel;
  settings: GameSettings;
  onGameEnd: (result: GameResult) => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({
  song,
  difficulty,
  settings,
  onGameEnd,
  onOpenSettings,
  onExit
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const youtubeContainerId = 'youtube-player-container';

  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100.0);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    const setupEngine = async () => {
      const engine = new GameEngine(settings);
      engineRef.current = engine;

      if (canvasRef.current) {
        const rect = canvasRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
        }
        engine.setCanvas(canvasRef.current);
      }

      const chart = await fetchChart(song.id, difficulty);
      if (isCancelled) return;

      await engine.prepareGame(youtubeContainerId, song, chart, {
        onUpdateStats: (stats) => {
          setMaxCombo(stats.maxCombo);
          setAccuracy(stats.accuracy);
        },
        onGameEnd: (result) => {
          onGameEnd(result);
        }
      });

      if (isCancelled) return;

      setIsEngineReady(true);
      engine.startGame();
    };

    setupEngine();

    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        const rect = canvasRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
        }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [song, difficulty]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSettings(settings);
    }
  }, [settings]);

  const modeDisplayName = DIFFICULTY_NAMES[difficulty].toUpperCase();

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      backgroundColor: '#090d16',
      overflow: 'hidden'
    }}>
      {/* 19.1 채보 영역: 왼쪽 끝에서 10~15% 여백 */}
      <div style={{
        flex: '0 0 52%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: '6vw'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </div>

      {/* 19.2 & 19.3 우측 영역: 상단 정보창 + 유튜브 재생 (오른쪽 끝 10~15% 여백) */}
      <div style={{
        flex: '0 0 48%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: '6vw',
        paddingLeft: '2vw',
        boxSizing: 'border-box'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '30px',
          display: 'flex',
          gap: '12px',
          zIndex: 100
        }}>
          <button
            onClick={onOpenSettings}
            title="싱크 및 게임 설정"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
          >
            ⚙
          </button>
          <button
            onClick={onExit}
            title="게임 나가기"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* 19.3 상단 정보 표시 영역: 중앙 정렬 세로 순서
            1. [모드] : [음악 이름]
            2. MAXIMUM COMBO : [숫자]
            3. SUCCESSFUL RATING : [비율%]
        */}
        <div className="glass-panel font-chakra" style={{
          width: '100%',
          maxWidth: '560px',
          padding: '18px 24px',
          borderRadius: '14px',
          marginBottom: '20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#f1f5f9',
            letterSpacing: '1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}>
            {modeDisplayName} : {song.title}
          </div>

          <div style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#facc15',
            letterSpacing: '2px',
            textShadow: '0 0 12px rgba(250, 204, 21, 0.4)'
          }}>
            MAXIMUM COMBO : {maxCombo}
          </div>

          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#38bdf8',
            letterSpacing: '1.5px',
            textShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
          }}>
            SUCCESSFUL RATING : {accuracy.toFixed(2)}%
          </div>
        </div>

        {/* 19.2 유튜브 재생 영역 */}
        <div style={{
          width: '100%',
          maxWidth: '560px',
          aspectRatio: '16 / 9',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#000',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          <div id={youtubeContainerId} style={{ width: '100%', height: '100%' }} />

          {!isEngineReady && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontFamily: 'Chakra Petch',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              LOADING YOUTUBE MEDIA...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
