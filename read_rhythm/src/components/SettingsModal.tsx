import React from 'react';
import { GameSettings } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSave: (newSettings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [localSettings, setLocalSettings] = React.useState<GameSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleOffsetChange = (delta: number) => {
    const updated = {
      ...localSettings,
      globalOffset: localSettings.globalOffset + delta
    };
    setLocalSettings(updated);
    onSave(updated);
  };

  const handleSpeedChange = (delta: number) => {
    const newSpeed = Math.max(1.0, Math.min(10.0, parseFloat((localSettings.noteSpeed + delta).toFixed(1))));
    const updated = {
      ...localSettings,
      noteSpeed: newSpeed
    };
    setLocalSettings(updated);
    onSave(updated);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '440px',
        borderRadius: '16px',
        padding: '28px',
        color: '#fff',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="font-chakra" style={{ fontSize: '22px', fontWeight: 'bold', color: '#38bdf8' }}>
            SYSTEM SETTINGS
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* 1ms 싱크 조절 (핵심 요구사항) */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '15px', color: '#cbd5e1' }}>노트 싱크 오프셋 (Sync Offset)</span>
            <span className="font-chakra" style={{ fontSize: '16px', fontWeight: 'bold', color: '#facc15' }}>
              {localSettings.globalOffset >= 0 ? `+${localSettings.globalOffset}` : localSettings.globalOffset} ms
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => handleOffsetChange(-10)}
              style={{ padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
            >
              -10ms
            </button>
            <button
              onClick={() => handleOffsetChange(-1)}
              style={{ padding: '8px 14px', background: '#0284c7', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              -1ms
            </button>
            <input
              type="range"
              min="-200"
              max="200"
              step="1"
              value={localSettings.globalOffset}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                const updated = { ...localSettings, globalOffset: val };
                setLocalSettings(updated);
                onSave(updated);
              }}
              style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            <button
              onClick={() => handleOffsetChange(1)}
              style={{ padding: '8px 14px', background: '#0284c7', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              +1ms
            </button>
            <button
              onClick={() => handleOffsetChange(10)}
              style={{ padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
            >
              +10ms
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            * 1ms 단위로 정밀 싱크를 조절할 수 있습니다 (판정선에 늦게 닿으면 -, 일찍 닿으면 +)
          </p>
        </div>

        {/* 노트 낙하 속도 (배속) */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '15px', color: '#cbd5e1' }}>노트 낙하 배속 (Speed)</span>
            <span className="font-chakra" style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8' }}>
              {localSettings.noteSpeed.toFixed(1)}x
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => handleSpeedChange(-0.1)}
              style={{ padding: '8px 14px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
            >
              -0.1
            </button>
            <input
              type="range"
              min="1.0"
              max="9.9"
              step="0.1"
              value={localSettings.noteSpeed}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const updated = { ...localSettings, noteSpeed: val };
                setLocalSettings(updated);
                onSave(updated);
              }}
              style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            <button
              onClick={() => handleSpeedChange(0.1)}
              style={{ padding: '8px 14px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
            >
              +0.1
            </button>
          </div>
        </div>

        {/* 키 바인딩 안내 */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          marginBottom: '24px',
          fontSize: '13px'
        }}>
          <div style={{ color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>조작 키 (4-Key Fixed)</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ padding: '4px 10px', background: '#334155', borderRadius: '4px', fontWeight: 'bold' }}>D (Lane 1)</span>
            <span style={{ padding: '4px 10px', background: '#334155', borderRadius: '4px', fontWeight: 'bold' }}>F (Lane 2)</span>
            <span style={{ padding: '4px 10px', background: '#334155', borderRadius: '4px', fontWeight: 'bold' }}>J (Lane 3)</span>
            <span style={{ padding: '4px 10px', background: '#334155', borderRadius: '4px', fontWeight: 'bold' }}>K (Lane 4)</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-green"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          설정 저장 및 닫기
        </button>
      </div>
    </div>
  );
};
