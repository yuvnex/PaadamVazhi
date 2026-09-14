import React, { useRef } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import { Palette } from 'lucide-react';

const PRESET_COLORS = [
  { color: '#000000', label: 'Black' },
  { color: '#1a1a2e', label: 'Dark Navy' },
  { color: '#16213e', label: 'Midnight' },
  { color: '#2d2d2d', label: 'Charcoal' },
  { color: '#ffffff', label: 'White' },
  { color: '#f5f5f5', label: 'Light Gray' },
  { color: '#e8e8e8', label: 'Gray' },
  { color: '#1e3a5f', label: 'Navy' },
  { color: '#0d2818', label: 'Dark Green' },
  { color: '#2b1a1a', label: 'Dark Red' },
  { color: '#1a1a3e', label: 'Dark Purple' },
  { color: '#3e2a1a', label: 'Dark Brown' },
];

const BackgroundPicker: React.FC = () => {
  const { board, currentPageIndex, setPageBackgroundColor } = useWhiteboardStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const currentPage = board.pages[currentPageIndex];
  const currentColor = currentPage?.backgroundColor || '#000000';

  const handleColorChange = (color: string) => {
    setPageBackgroundColor(color);
  };

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageBackgroundColor(e.target.value);
  };

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: PointerEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as HTMLElement)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, [isOpen]);

  return (
    <div data-popup style={{
      position: 'fixed',
      bottom: '16px',
      left: '280px',
      zIndex: 100,
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Background color"
        aria-label="Background color"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1b1e',
          border: '1px solid #3a3b3e',
          borderRadius: '10px',
          color: '#999',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#252629';
          e.currentTarget.style.color = '#ccc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#1a1b1e';
          e.currentTarget.style.color = '#999';
        }}
      >
        <Palette size={18} />
        {/* Color indicator dot */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: currentColor,
          border: currentColor === '#ffffff' ? '1px solid #555' : '1px solid #666',
        }} />
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          data-popup
          style={{
            position: 'absolute',
            bottom: '54px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#2a2b2e',
            border: '1px solid #444',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 300,
            width: '200px',
          }}
        >
          <div style={{ color: '#aaa', fontSize: '11px', marginBottom: '8px', fontWeight: 500 }}>
            Background Color
          </div>
          
          {/* Current color display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
            padding: '6px 8px',
            background: '#1a1b1e',
            borderRadius: '6px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: currentColor,
              border: currentColor === '#ffffff' ? '1px solid #555' : '1px solid #666',
              flexShrink: 0,
            }} />
            <span style={{ color: '#ccc', fontSize: '12px', fontFamily: 'monospace' }}>
              {currentColor.toUpperCase()}
            </span>
          </div>

          {/* Preset colors grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '4px',
            marginBottom: '10px',
          }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.color}
                onClick={() => handleColorChange(c.color)}
                title={c.label}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: c.color,
                  border: currentColor === c.color ? '2px solid #4A90D9' : c.color === '#ffffff' ? '1px solid #555' : '1px solid #444',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            ))}
          </div>

          {/* Custom color picker */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #3a3b3e',
          }}>
            <input
              ref={colorInputRef}
              type="color"
              value={currentColor}
              onChange={handleCustomColor}
              style={{
                width: '28px',
                height: '28px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: 0,
                background: 'transparent',
              }}
            />
            <span style={{ color: '#999', fontSize: '12px' }}>Custom color</span>
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
      )}
    </div>
  );
};

export default BackgroundPicker;
