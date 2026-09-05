import React from 'react';

interface StartPageProps {
  onEnter: () => void;
  onOpenSettings: () => void;
  onOpenEditor: () => void;
}

export const StartPage: React.FC<StartPageProps> = ({
  onEnter,
  onOpenSettings,
  onOpenEditor
}) => {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 40%, #1e1b4b 0%, #090d16 85%)',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '24px', right: '32px', display: 'flex', gap: '16px', zIndex: 10 }}>
        <button
          onClick={onOpenEditor}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#94a3b8',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        >
          ⚙️ Chart Editor
        </button>
        <button
          onClick={onOpenSettings}
          title="설정"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'rotate(45deg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'rotate(0deg)'; }}
        >
          ⚙
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 className="font-chakra" style={{
          fontSize: '76px',
          fontWeight: '900',
          letterSpacing: '6px',
          background: 'linear-gradient(180deg, #ffffff 30%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 10px 40px rgba(56, 189, 248, 0.3)',
          marginBottom: '10px'
        }}>
          READ_RHYTHM
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '18px',
          letterSpacing: '4px',
          fontWeight: '500'
        }}>
          WEB 4-KEY BROWSER RHYTHM EXPERIENCE
        </p>
      </div>

      {/* 16. 중앙 초록색 ENTER 버튼 */}
      <button
        onClick={onEnter}
        className="btn-enter font-chakra"
        style={{
          width: '260px',
          height: '70px',
          borderRadius: '35px',
          fontSize: '28px',
          fontWeight: '800',
          letterSpacing: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        ENTER
      </button>

      <div style={{
        position: 'absolute',
        bottom: '30px',
        color: '#475569',
        fontSize: '14px',
        letterSpacing: '1px'
      }}>
        CONTROL KEYS: [ D ] &nbsp; [ F ] &nbsp; [ J ] &nbsp; [ K ]
      </div>
    </div>
  );
};
