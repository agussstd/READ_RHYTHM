import React, { useState } from 'react';
import { DifficultyLevel, GameResult, GameSettings, Song } from './types/game';
import { DEFAULT_SONGS } from './data/songs';
import { StartPage } from './pages/StartPage';
import { MusicSelectPage } from './pages/MusicSelectPage';
import { DifficultySelectPage } from './pages/DifficultySelectPage';
import { GamePage } from './pages/GamePage';
import { ResultPage } from './pages/ResultPage';
import { ChartEditorPage } from './pages/ChartEditorPage';
import { SettingsModal } from './components/SettingsModal';

type AppView = 'start' | 'music-select' | 'difficulty-select' | 'game' | 'result' | 'editor';

const DEFAULT_SETTINGS: GameSettings = {
  noteSpeed: 4.0,
  globalOffset: 0,
  bgDim: 0.4,
  hitVolume: 0.8
};

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('start');
  const [selectedSong, setSelectedSong] = useState<Song>(DEFAULT_SONGS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('easy');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('read_rhythm_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('read_rhythm_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    setView('difficulty-select');
  };

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    setView('game');
  };

  const handleGameEnd = (result: GameResult) => {
    setGameResult(result);
    setView('result');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 16. 시작 화면 */}
      {view === 'start' && (
        <StartPage
          onEnter={() => setView('music-select')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenEditor={() => setView('editor')}
        />
      )}

      {/* 17. 음악 선택 화면 */}
      {view === 'music-select' && (
        <MusicSelectPage
          onSelectSong={handleSongSelect}
          onBack={() => setView('start')}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* 18. 난이도 선택 화면 (3초 카운트다운) */}
      {view === 'difficulty-select' && (
        <DifficultySelectPage
          song={selectedSong}
          onSelectDifficulty={handleDifficultySelect}
          onBack={() => setView('music-select')}
        />
      )}

      {/* 19. 게임 플레이 화면 */}
      {view === 'game' && (
        <GamePage
          song={selectedSong}
          difficulty={selectedDifficulty}
          settings={settings}
          onGameEnd={handleGameEnd}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onExit={() => setView('music-select')}
        />
      )}

      {/* 20. 결과 화면 */}
      {view === 'result' && gameResult && (
        <ResultPage
          result={gameResult}
          onReturnToMusicSelect={() => setView('music-select')}
        />
      )}

      {/* 23. Chart Editor 화면 */}
      {view === 'editor' && (
        <ChartEditorPage onBack={() => setView('start')} />
      )}

      {/* 21. 환경설정 모달 (1ms 단위 싱크 조절) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
export default App;
