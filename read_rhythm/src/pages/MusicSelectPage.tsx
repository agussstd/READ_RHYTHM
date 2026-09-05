import React, { useState } from 'react';
import { MusicCategory, Song } from '../types/game';
import { DEFAULT_SONGS } from '../data/songs';

interface MusicSelectPageProps {
  onSelectSong: (song: Song) => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

const CATEGORIES: MusicCategory[] = ['VOCALOID', 'J-POP', 'VARIETY'];

export const MusicSelectPage: React.FC<MusicSelectPageProps> = ({
  onSelectSong,
  onBack,
  onOpenSettings
}) => {
  const [activeCategory, setActiveCategory] = useState<MusicCategory>('VOCALOID');
  const [selectedSongId, setSelectedSongId] = useState<string>(DEFAULT_SONGS[0].id);

  const filteredSongs = DEFAULT_SONGS.filter((s) => s.category === activeCategory);
  const currentSong = DEFAULT_SONGS.find((s) => s.id === selectedSongId) || filteredSongs[0];

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at top, #172554 0%, #090d16 100%)',
      padding: '24px 40px',
      overflow: 'hidden'
    }}>
      {/* 상단 네비게이션 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ← BACK
          </button>
          <h1 className="font-chakra" style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '2px', color: '#fff' }}>
            SELECT MUSIC
          </h1>
        </div>

        {/* 카테고리 탭 (J-POP, VOCALOID, VARIETY) */}
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '12px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                const first = DEFAULT_SONGS.find((s) => s.category === cat);
                if (first) setSelectedSongId(first.id);
              }}
              className="font-chakra"
              style={{
                background: activeCategory === cat ? '#38bdf8' : 'transparent',
                color: activeCategory === cat ? '#000' : '#94a3b8',
                border: 'none',
                padding: '8px 24px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 설정 버튼 */}
        <button
          onClick={onOpenSettings}
          title="설정"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          ⚙
        </button>
      </div>

      {/* 중앙 메인 영역: 세로형 직사각형 곡 리스트 (17. 명세 요구사항) */}
      <div style={{ flex: 1, display: 'flex', gap: '40px', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* 세로형 직사각형 카드 캐러셀/그리드 */}
        <div style={{
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          padding: '20px 10px',
          maxWidth: '100%',
          alignItems: 'center'
        }}>
          {filteredSongs.map((song) => {
            const isSelected = song.id === selectedSongId;
            return (
              <div
                key={song.id}
                onClick={() => setSelectedSongId(song.id)}
                onDoubleClick={() => onSelectSong(song)}
                className="glass-panel"
                style={{
                  width: '260px',
                  height: '420px', // 세로형 직사각형
                  borderRadius: '20px',
                  cursor: 'pointer',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  transform: isSelected ? 'scale(1.05)' : 'scale(0.95)',
                  boxShadow: isSelected ? '0 15px 35px rgba(56, 189, 248, 0.3)' : '0 8px 20px rgba(0,0,0,0.4)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* 썸네일 이미지 영역 */}
                <div style={{
                  width: '100%',
                  height: '220px',
                  borderRadius: '12px',
                  backgroundColor: '#1e293b',
                  backgroundImage: `url(https://img.youtube.com/vi/${song.youtubeVideoId}/hqdefault.jpg)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                  marginBottom: '16px'
                }} />

                {/* 곡 정보 */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    marginBottom: '4px'
                  }}>
                    {song.category}
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '6px',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {song.title}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {song.artist}
                  </p>
                </div>

                {/* 선택 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSong(song);
                  }}
                  className="font-chakra"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: isSelected ? 'linear-gradient(135deg, #38bdf8, #0284c7)' : 'rgba(255, 255, 255, 0.1)',
                    color: isSelected ? '#000' : '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSelected ? 'SELECT DIFFICULTY ▶' : 'SELECT'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
