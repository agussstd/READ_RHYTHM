import React, { useState, useEffect, useRef } from 'react';
import { ChartData, DifficultyLevel, Lane, NoteData, NoteType, Song } from '../types/game';
import { YouTubeTimingManager } from '../game/YouTubeTimingManager';
import { DEFAULT_SONGS } from '../data/songs';

interface ChartEditorPageProps {
  onBack: () => void;
}

type BeatSnap = '1/4' | '1/8' | '1/16' | '1/32';

export const ChartEditorPage: React.FC<ChartEditorPageProps> = ({ onBack }) => {
  const [selectedSong, setSelectedSong] = useState<Song>(DEFAULT_SONGS[0]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [bpm, setBpm] = useState<number>(130);
  const [offset, setOffset] = useState<number>(0);
  const [beatSnap, setBeatSnap] = useState<BeatSnap>('1/8');
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>('tap');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const timingRef = useRef<YouTubeTimingManager | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const manager = new YouTubeTimingManager();
    timingRef.current = manager;

    manager.initPlayer('editor-youtube-container', selectedSong.youtubeVideoId, () => {});

    const updateLoop = () => {
      if (timingRef.current) {
        setCurrentTime(timingRef.current.getCurrentGameTime());
      }
      animRef.current = requestAnimationFrame(updateLoop);
    };
    animRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      manager.destroy();
    };
  }, [selectedSong]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      const laneMap: Record<string, Lane> = {
        KeyD: 0,
        KeyF: 1,
        KeyJ: 2,
        KeyK: 3
      };

      if (laneMap[e.code] !== undefined) {
        e.preventDefault();
        addNoteAtCurrentTime(laneMap[e.code]);
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, bpm, beatSnap, selectedNoteType]);

  const snapDurationMap: Record<BeatSnap, number> = {
    '1/4': 1,
    '1/8': 0.5,
    '1/16': 0.25,
    '1/32': 0.125
  };

  const getSnappedTime = (timeSec: number): number => {
    const beatSec = 60 / bpm;
    const snapUnit = beatSec * snapDurationMap[beatSnap];
    return Math.round(timeSec / snapUnit) * snapUnit;
  };

  const addNoteAtCurrentTime = (lane: Lane) => {
    const snapped = parseFloat(getSnappedTime(currentTime).toFixed(3));
    const newNote: NoteData = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: snapped,
      lane,
      type: selectedNoteType,
      holdDuration: selectedNoteType === 'hold' ? 0.8 : undefined
    };

    setNotes((prev) => [...prev.filter((n) => !(Math.abs(n.time - snapped) < 0.05 && n.lane === lane)), newNote].sort((a, b) => a.time - b.time));
  };

  const togglePlay = () => {
    if (!timingRef.current) return;
    if (isPlaying) {
      timingRef.current.pause();
      setIsPlaying(false);
    } else {
      timingRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleExportJson = () => {
    const chart: ChartData = {
      songId: selectedSong.id,
      difficulty,
      bpm,
      offset,
      notes: [...notes].sort((a, b) => a.time - b.time)
    };

    const blob = new Blob([JSON.stringify(chart, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${difficulty}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed: ChartData = JSON.parse(evt.target?.result as string);
        if (parsed.notes) {
          setNotes(parsed.notes);
          if (parsed.bpm) setBpm(parsed.bpm);
          if (parsed.offset) setOffset(parsed.offset);
          if (parsed.difficulty) setDifficulty(parsed.difficulty);
        }
      } catch (err) {
        alert('올바른 채보 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#090d16',
      color: '#fff',
      padding: '16px 24px',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' }}>
            ← 나가기
          </button>
          <h2 className="font-chakra" style={{ fontSize: '20px', color: '#38bdf8' }}>CHART EDITOR</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ background: '#1e293b', border: '1px solid #334155', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            JSON 불러오기
            <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
          </label>
          <button onClick={handleExportJson} className="btn-green" style={{ border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            JSON 다운로드
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden' }}>
        <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            <div id="editor-youtube-container" style={{ width: '100%', height: '100%' }} />
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={togglePlay}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: isPlaying ? '#ef4444' : '#22c55e',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isPlaying ? 'PAUSE (Space)' : 'PLAY (Space)'}
              </button>
              <span className="font-chakra" style={{ marginLeft: '16px', fontSize: '18px', color: '#38bdf8' }}>
                {currentTime.toFixed(3)}s
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>Beat Snap</label>
                <select
                  value={beatSnap}
                  onChange={(e) => setBeatSnap(e.target.value as BeatSnap)}
                  style={{ width: '100%', padding: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                >
                  <option value="1/4">1/4 Snap</option>
                  <option value="1/8">1/8 Snap</option>
                  <option value="1/16">1/16 Snap</option>
                  <option value="1/32">1/32 Snap</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>난이도</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  style={{ width: '100%', padding: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                >
                  <option value="easy">かんたん (Easy)</option>
                  <option value="normal">ふつう (Normal)</option>
                  <option value="hard">むずかしい (Hard)</option>
                  <option value="master">マスター (Master)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>노트 종류</label>
                <select
                  value={selectedNoteType}
                  onChange={(e) => setSelectedNoteType(e.target.value as NoteType)}
                  style={{ width: '100%', padding: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                >
                  <option value="tap">일반 탭 (빨간색)</option>
                  <option value="special">스페셜 (노란색)</option>
                  <option value="hold">홀드 (빨간색)</option>
                </select>
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#94a3b8' }}>
              키보드 <strong>D, F, J, K</strong>를 누르면 재생 위치에 스냅된 노트가 추가됩니다.
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: 1, padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', color: '#cbd5e1' }}>노트 목록 (총 {notes.length}개)</h3>
            <button onClick={() => setNotes([])} style={{ background: '#7f1d1d', border: 'none', color: '#fca5a5', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
              전체 삭제
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {notes.map((note) => {
              const laneLetters = ['D', 'F', 'J', 'K'];
              const isClose = Math.abs(currentTime - note.time) < 0.2;
              return (
                <div
                  key={note.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: isClose ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    border: isClose ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className="font-chakra" style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                      {note.time.toFixed(3)}s
                    </span>
                    <span style={{
                      backgroundColor: '#334155',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      Lane {laneLetters[note.lane]}
                    </span>
                    <span style={{
                      color: note.type === 'special' ? '#facc15' : '#f87171'
                    }}>
                      [{note.type.toUpperCase()}]
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
