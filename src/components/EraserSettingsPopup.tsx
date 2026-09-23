import React from 'react';
import { useWhiteboardStore } from '../store/useStore';
import { Eraser } from 'lucide-react';
import type { EraserSize } from '../types';

const EraserSettingsPopup: React.FC = () => {
  const { eraserSize, setEraserSize, setShowEraserSettings } = useWhiteboardStore();

  const sizes: { id: EraserSize; label: string; size: number }[] = [
    { id: 'small', label: 'Small', size: 10 },
    { id: 'medium', label: 'Medium', size: 20 },
    { id: 'large', label: 'Large', size: 40 },
  ];

  return (
    <div data-popup style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(24, 27, 34, 0.98)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      borderRadius: '14px',
      padding: '0',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(20px)',
      zIndex: 200,
      minWidth: '200px',
      overflow: 'hidden',
    }}>
      {/* Eraser icon + label row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <Eraser size={18} color="#38bdf8" />
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>Eraser</span>
      </div>

      <div style={{ padding: '8px 12px' }}>
        {/* Eraser size options */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          {sizes.map((s) => (
            <button
              key={s.id}
              onClick={() => setEraserSize(s.id)}
              style={{
                padding: '8px 12px',
                background: eraserSize === s.id ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                border: eraserSize === s.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: eraserSize === s.id ? '#38bdf8' : '#9ca3af',
                fontSize: '11px',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: `${s.size}px`,
                height: `${s.size}px`,
                borderRadius: '50%',
                background: eraserSize === s.id ? '#fff' : '#888',
              }} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            // Clear all objects on page
            const store = useWhiteboardStore.getState();
            store.pushHistory();
            const page = store.board.pages[store.currentPageIndex];
            if (page) {
              store.deleteObjects(page.objects.map((o) => o.id));
            }
            setShowEraserSettings(false);
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#ccc',
            fontSize: '12px',
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#3a3b3e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: '14px' }}>››</span> Clear
        </button>
      </div>

      {/* Arrow */}
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: '8px solid #2a2b2e',
      }} />
    </div>
  );
};

export default EraserSettingsPopup;
