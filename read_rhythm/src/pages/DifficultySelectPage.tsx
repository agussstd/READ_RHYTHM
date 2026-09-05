import React, { useState, useEffect } from 'react';
import { DifficultyLevel, DIFFICULTY_COLORS, DIFFICULTY_NAMES, Song } from '../types/game';

interface DifficultySelectPageProps {
  song: Song;
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  onBack: () => void;
}

const DIFFICULTIES: DifficultyLevel[] = ['easy', 'normal', 'hard', 'master'];

export const DifficultySelectPage: React.FC<DifficultySelectPageProps> = ({
  song,
  onSelectDifficulty,
  onBack
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [chosenDifficulty, setChosenDifficulty] = useState<DifficultyLevel | null>(null);

  // 3초 카운트다운 (3 -> 2 -> 1 -> START)
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && chosenDifficulty) {
      // 카운트다운 종료 시 게임 시작 콜백
      onSelectDifficulty(chosenDifficulty);
    }
  }, [countdown, chosenDifficulty, onSelectDifficulty]);

  const handleDifficultyClick = (diff: DifficultyLevel) => {
    setChosenDifficulty(diff);
    setCountdown(3); // 3초 카운트다운 시작
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1e1b4b 0%, #090d16 100%)',
      padding: '40px',
      overflow: 'hidden'
    }}>
      {/* 3초 카운트다운 오버레이 */}
      {countdown !== null && countdown > 0 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="countdown-number font-chakra" style={{
            fontSize: '160px',
            fontWeight: '900',
            color: chosenDifficulty ? DIFFICULTY_COLORS[chosenDifficulty] : '#38bdf8',
            textShadow: `0 0 50px ${chosenDifficulty ? DIFFICULTY_COLORS[chosenDifficulty] : '#38bdf8'}`
          }}>
            {countdown}
          </div>
          <div className="font-chakra" style={{
            fontSize: '24px',
            letterSpacing: '6px',
            color: '#cbd5e1',
            marginTop: '20px'
          }}>
            GET READY...
          </div>
        </div>
      )}

      {/* 상단 뒤로가기 및 제목 */}
      <div style={{ position: 'absolute', top: '30px', left: '40px' }}>
        <button
          onClick={onBack}
          disabled={countdown !== null}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: countdown !== null ? 'not-allowed' : 'pointer'
          }}
        >
          ← BACK TO MUSIC
        </button>
      </div>

      {/* 선택된 곡 카드 정보 */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span style={{
          background: 'rgba(56, 189, 248, 0.2)',
          color: '#38bdf8',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          {song.category}
        </span>
        <h2 style={{ fontSize: '38px', fontWeight: '900', marginTop: '12px', marginBottom: '6px', color: '#fff' }}>
          {song.title}
        </h2>
        <p style={{ fontSize: '18px', color: '#94a3b8' }}>
          {song.artist}
        </p>
      </div>

      {/* 4가지 난이도 선택 버튼 그리드 (18. 명세 색상 적용) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        maxWidth: '960px',
        width: '100%'
      }}>
        {DIFFICULTIES.map((diff) => {
          const color = DIFFICULTY_COLORS[diff];
          const name = DIFFICULTY_NAMES[diff];

          return (
            <button
              key={diff}
              onClick={() => handleDifficultyClick(diff)}
              disabled={countdown !== null}
              className="glass-panel"
              style={{
                background: `linear-gradient(180deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))`,
                border: `2px solid ${color}`,
                borderRadius: '16px',
                padding: '36px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 8px 24px ${color}33`,
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = `0 16px 36px ${color}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${color}33`;
              }}
            >
              <span className="font-chakra" style={{
                color: color,
                fontSize: '15px',
                fontWeight: '800',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '10px'
              }}>
                {diff}
              </span>
              <span style={{
                fontSize: '30px',
                fontWeight: '900',
                color: '#fff',
                marginBottom: '16px'
              }}>
                {name}
              </span>
              <div style={{
                backgroundColor: color,
                color: '#000',
                padding: '6px 18px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '1px'
              }}>
                PLAY
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
