import React from 'react';
import { GameResult } from '../types/game';

interface ResultPageProps {
  result: GameResult;
  onReturnToMusicSelect: () => void;
}

const RANK_COLORS: Record<string, string> = {
  S: '#facc15', // 골드
  A: '#22c55e', // 그린
  B: '#38bdf8', // 스카이블루
  C: '#f97316', // 오렌지
  F: '#ef4444'  // 레드
};

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onReturnToMusicSelect
}) => {
  const rankColor = RANK_COLORS[result.rank] || '#fff';

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #090d16 100%)',
      padding: '40px',
      overflow: 'hidden'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '760px',
        width: '100%',
        borderRadius: '24px',
        padding: '36px 44px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        {/* 곡 타이틀 및 아티스트 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="font-chakra" style={{
            color: '#38bdf8',
            fontSize: '14px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            {result.difficulty} MODE
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginTop: '6px' }}>
            {result.songTitle}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px' }}>
            {result.artist}
          </p>
        </div>

        {/* 상단 랭크 & 달성률 하이라이트 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px',
          width: '100%',
          padding: '20px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '28px'
        }}>
          {/* 최종 랭크 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}>RANK</div>
            <div className="font-chakra" style={{
              fontSize: '88px',
              fontWeight: '900',
              lineHeight: '1',
              color: rankColor,
              textShadow: `0 0 40px ${rankColor}`
            }}>
              {result.rank}
            </div>
          </div>

          <div style={{ width: '1px', height: '90px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* 최종 달성률 (100.00% 만점) */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}>ACCURACY</div>
            <div className="font-chakra" style={{
              fontSize: '48px',
              fontWeight: '900',
              color: '#38bdf8',
              letterSpacing: '1px',
              textShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
            }}>
              {result.accuracy.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 20. 결과 표시 세부 항목 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          width: '100%',
          marginBottom: '32px'
        }}>
          {/* MAXIMUM COMBO */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>MAXIMUM COMBO</span>
            <span className="font-chakra" style={{ fontSize: '20px', fontWeight: 'bold', color: '#facc15' }}>
              {result.maxCombo}
            </span>
          </div>

          {/* 처리한 총 노트 개수 */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>TOTAL NOTES</span>
            <span className="font-chakra" style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {result.processedNotes} / {result.totalNotes}
            </span>
          </div>

          {/* 판정 세부 내역: PERFECT */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#facc15', fontSize: '14px', fontWeight: 'bold' }}>PERFECT</span>
            <span className="font-chakra" style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {result.judgements.PERFECT}
            </span>
          </div>

          {/* 판정 세부 내역: GOOD */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 'bold' }}>GOOD</span>
            <span className="font-chakra" style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {result.judgements.GOOD}
            </span>
          </div>

          {/* 판정 세부 내역: FAST */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#c084fc', fontSize: '14px', fontWeight: 'bold' }}>FAST</span>
            <span className="font-chakra" style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {result.judgements.FAST}
            </span>
          </div>

          {/* 판정 세부 내역: FAIL */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '14px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>FAIL</span>
            <span className="font-chakra" style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {result.judgements.FAIL}
            </span>
          </div>
        </div>

        {/* 20. 화면 하단 초록색 음악 선택으로 돌아가기 버튼 (명세 요구사항) */}
        <button
          onClick={onReturnToMusicSelect}
          className="btn-green font-chakra"
          style={{
            width: '100%',
            maxWidth: '380px',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '18px',
            fontWeight: '800',
            letterSpacing: '2px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          음악 선택으로 돌아가기
        </button>
      </div>
    </div>
  );
};
