import React, { useCallback, useRef } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import type { PenType } from '../types';

const COLORS = [
  { color: '#ffffff', label: 'White' },
  { color: '#4060E8', label: 'Blue' },
  { color: '#9E9E9E', label: 'Gray' },
  { color: '#FFD700', label: 'Yellow' },
  { color: '#000000', label: 'Black' },
  { color: '#00BCD4', label: 'Cyan' },
  { color: '#FF9800', label: 'Orange' },
  { color: 'linear-gradient(135deg, #42A5F5, #1565C0)', label: 'Blue' },
  { color: '#4CAF50', label: 'Green' },
  { color: 'linear-gradient(135deg, #E040FB, #FF5722, #FFD700, #4CAF50)', label: 'Rainbow' },
  { color: '#F44336', label: 'Red' },
  { color: 'linear-gradient(135deg, #E040FB, #4CAF50, #2196F3, #FFD700)', label: 'Multi' },
];

const PEN_TYPES: { id: PenType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'thin',
    label: 'Thin pen',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 21L8 16L20 4L21 3L20 2L18 3L6 15L3 21Z" fill="#888" stroke="#888" strokeWidth="1"/>
        <line x1="5" y1="19" x2="3" y2="21" stroke="#888" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'thick',
    label: 'Thick pen',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 21L9 15L21 3L22 2L20 0L18 2L6 14L3 21Z" fill="#aaa" stroke="#888" strokeWidth="1.5"/>
        <rect x="16" y="0" width="5" height="5" rx="1" fill="#666" transform="rotate(45 18.5 2.5)"/>
        <line x1="4" y1="20" x2="2" y2="22" stroke="#888" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'marker',
    label: 'Marker',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="2" width="6" height="14" rx="2" fill="#888"/>
        <rect x="10" y="16" width="4" height="6" rx="1" fill="#666"/>
      </svg>
    ),
  },
  {
    id: 'highlighter',
    label: 'Highlighter',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="1" width="8" height="12" rx="2" fill="#888"/>
        <rect x="9" y="13" width="6" height="5" rx="1" fill="#666"/>
        <rect x="10" y="18" width="4" height="4" rx="1" fill="#555"/>
      </svg>
    ),
  },
  {
    id: 'pencil',
    label: 'Pencil',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 21L8 16L21 3L22 2L20 0L18 2L5 15L3 21Z" fill="none" stroke="#888" strokeWidth="1.5"/>
        <path d="M15 5L19 9" stroke="#888" strokeWidth="1"/>
        <circle cx="3" cy="21" r="1" fill="#888"/>
      </svg>
    ),
  },
];

const PenSettingsPopup: React.FC = () => {
  const {
    penColor,
    penThickness,
    penType,
    setPenColor,
    setPenThickness,
    setPenType,
  } = useWhiteboardStore();

  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const isTouch = 'touches' in e;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const y = clientY - rect.top;
    const ratio = 1 - Math.max(0, Math.min(1, y / rect.height));
    const thickness = 1 + ratio * 39; // 1 to 40
    setPenThickness(Math.round(thickness * 100) / 100);
  }, []);

  const handleSliderInteraction = useCallback((e: React.MouseEvent) => {
    handleSliderChange(e);
    const onMove = (ev: MouseEvent) => {
      if (sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const y = ev.clientY - rect.top;
        const ratio = 1 - Math.max(0, Math.min(1, y / rect.height));
        setPenThickness(Math.round((1 + ratio * 39) * 100) / 100);
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const handleTouchSlider = useCallback((e: React.TouchEvent) => {
    handleSliderChange(e);
    const onMove = (ev: TouchEvent) => {
      if (sliderRef.current && ev.touches.length > 0) {
        const rect = sliderRef.current.getBoundingClientRect();
        const y = ev.touches[0].clientY - rect.top;
        const ratio = 1 - Math.max(0, Math.min(1, y / rect.height));
        setPenThickness(Math.round((1 + ratio * 39) * 100) / 100);
      }
    };
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }, []);

  const sliderRatio = Math.max(0, Math.min(1, (penThickness - 1) / 39));

  const penLabel = PEN_TYPES.find((p) => p.id === penType)?.label || 'Thick pen';

  return (
    <div
      data-popup
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#2a2b2e',
        border: '1px solid #444',
        borderRadius: '12px',
        padding: '0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 200,
        width: '360px',
        overflow: 'hidden',
      }}
    >
      {/* Header with pen icons and label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid #3a3b3e',
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 23L10 18L24 4L25 3L26 1L23 2L9 16L5 23Z" fill="#ccc" stroke="#aaa" strokeWidth="1"/>
            <rect x="20" y="0" width="6" height="6" rx="1" fill="#4CAF50" transform="rotate(45 23 3)"/>
          </svg>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 28L12 20L28 4L29 3L30 1L27 2L11 18L4 28Z" fill="#ddd" stroke="#bbb" strokeWidth="1"/>
            <rect x="22" y="0" width="7" height="7" rx="1" fill="#F44336" transform="rotate(45 25.5 3.5)"/>
          </svg>
        </div>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{penLabel}</span>
      </div>

      {/* Main content */}
      <div style={{
        display: 'flex',
        padding: '12px 16px',
        gap: '16px',
      }}>
        {/* Color palette */}
        <div>
          <div style={{ color: '#aaa', fontSize: '11px', marginBottom: '8px', fontWeight: 500 }}>Color</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '6px',
            width: '100px',
          }}>
            {COLORS.map((c) => {
              const isSelected = penColor === c.color;
              return (
                <button
                  key={c.color}
                  title={c.label}
                  onClick={() => setPenColor(c.color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c.color,
                    border: isSelected ? '2.5px solid #4A90D9' : c.color === '#ffffff' ? '2px solid #555' : '2px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: isSelected ? '0 0 0 2px #1a1b1e' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Thickness slider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
          <div style={{ color: '#aaa', fontSize: '11px', marginBottom: '4px', fontWeight: 500 }}>Thickness</div>
          <div style={{ color: '#fff', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>
            {penThickness.toFixed(2)}
          </div>
          <div
            ref={sliderRef}
            onMouseDown={handleSliderInteraction}
            onTouchStart={handleTouchSlider}
            style={{
              width: '8px',
              height: '140px',
              background: '#444',
              borderRadius: '4px',
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {/* Active fill */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${sliderRatio * 100}%`,
              background: '#4A90D9',
              borderRadius: '4px',
            }} />
            {/* Handle */}
            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: `${sliderRatio * 100}%`,
              transform: 'translate(-50%, 50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#fff',
              border: '2px solid #4A90D9',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              cursor: 'grab',
            }} />
          </div>
        </div>

        {/* Pen type selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px' }}>
          <div style={{ color: '#aaa', fontSize: '11px', marginBottom: '8px', fontWeight: 500 }}>Pen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {PEN_TYPES.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setPenType(pt.id)}
                title={pt.label}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: penType === pt.id ? '#3a3b3e' : 'transparent',
                  border: penType === pt.id ? '1.5px solid #666' : '1.5px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {pt.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div style={{
        padding: '8px 16px 12px',
        borderTop: '1px solid #3a3b3e',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <span style={{ color: '#aaa', fontSize: '11px', fontWeight: 500 }}>Preview</span>
        <svg width="200" height="30" viewBox="0 0 200 30">
          <path
            d="M 10 25 Q 30 5, 50 15 T 90 15 T 130 15 T 170 15 T 190 15"
            fill="none"
            stroke={penColor === '#ffffff' ? '#ccc' : penColor}
            strokeWidth={penThickness}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={penType === 'highlighter' ? 0.3 : penType === 'marker' ? 0.8 : 1}
          />
        </svg>
      </div>

      {/* Arrow pointing down */}
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

export default PenSettingsPopup;
