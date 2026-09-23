import React, { useState, useRef, useEffect } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  Palette,
} from 'lucide-react';

const BOARD_BG_PRESETS = [
  { color: '#121316', label: 'Classic Slate Black' },
  { color: '#1a3325', label: 'Chalkboard Green' },
  { color: '#162032', label: 'Deep Navy' },
  { color: '#1e2026', label: 'Charcoal' },
  { color: '#252932', label: 'Graphite' },
  { color: '#2a221b', label: 'Warm Chalkboard' },
  { color: '#ffffff', label: 'White' },
  { color: '#f5f5f0', label: 'Ivory Paper' },
  { color: '#e8eaed', label: 'Soft Light Gray' },
  { color: '#1a2838', label: 'Classroom Blue' },
  { color: '#0d2826', label: 'Dark Teal' },
  { color: '#2d181c', label: 'Dark Wine' },
];

const PageNavigation: React.FC = () => {
  const {
    board,
    currentPageIndex,
    setCurrentPage,
    addPage,
    setShowMainMenu,
    setShowPageOverview,
    showMainMenu,
    setPageBackgroundColor,
  } = useWhiteboardStore();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const currentPage = currentPageIndex + 1;
  const totalPages = board.pages.length;
  const currentColor = board.pages[currentPageIndex]?.backgroundColor || '#121316';

  // Close color picker on outside click
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e: PointerEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as HTMLElement)) {
        setShowColorPicker(false);
      }
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, [showColorPicker]);

  return (
    <div
      data-toolbar
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(28, 31, 38, 0.94)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '14px',
        padding: '5px 8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      {/* 1. Hamburger menu button */}
      <button
        onClick={() => setShowMainMenu(!showMainMenu)}
        title="Menu"
        aria-label="Menu"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: showMainMenu ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
          border: showMainMenu ? '1.5px solid #38bdf8' : '1.5px solid transparent',
          borderRadius: '10px',
          color: showMainMenu ? '#38bdf8' : '#9ca3af',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!showMainMenu) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          if (!showMainMenu) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }
        }}
      >
        <Menu size={18} />
      </button>

      {/* 2. Page Navigation Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '0 2px',
          height: '38px',
        }}
      >
        <button
          onClick={() => setCurrentPage(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          title="Previous page"
          aria-label="Previous page"
          style={{
            width: '26px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: currentPageIndex === 0 ? '#4b5563' : '#9ca3af',
            cursor: currentPageIndex === 0 ? 'default' : 'pointer',
            outline: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (currentPageIndex > 0) e.currentTarget.style.color = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            if (currentPageIndex > 0) e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span
          style={{
            color: '#f3f4f6',
            fontSize: '13px',
            fontWeight: 600,
            padding: '0 6px',
            minWidth: '42px',
            textAlign: 'center',
            letterSpacing: '0.5px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(currentPage).padStart(2, '0')}/{String(totalPages).padStart(2, '0')}
        </span>

        <button
          onClick={() => setCurrentPage(currentPageIndex + 1)}
          disabled={currentPageIndex === totalPages - 1}
          title="Next page"
          aria-label="Next page"
          style={{
            width: '26px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: currentPageIndex === totalPages - 1 ? '#4b5563' : '#9ca3af',
            cursor: currentPageIndex === totalPages - 1 ? 'default' : 'pointer',
            outline: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (currentPageIndex < totalPages - 1) e.currentTarget.style.color = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            if (currentPageIndex < totalPages - 1) e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 3. Add Page */}
      <button
        onClick={addPage}
        title="Add page"
        aria-label="Add page"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1.5px solid transparent',
          borderRadius: '10px',
          color: '#9ca3af',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
        }}
      >
        <Plus size={18} />
      </button>

      {/* 4. Page Overview Grid */}
      <button
        onClick={() => setShowPageOverview(true)}
        title="Page overview"
        aria-label="Page overview"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1.5px solid transparent',
          borderRadius: '10px',
          color: '#9ca3af',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
        }}
      >
        <LayoutGrid size={18} />
      </button>

      {/* 5. Board Background Palette (Integrated directly in dock - Image 2 match) */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Board Background Color"
          aria-label="Board Background Color"
          style={{
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: showColorPicker ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
            border: showColorPicker ? '1.5px solid #38bdf8' : '1.5px solid transparent',
            borderRadius: '10px',
            color: showColorPicker ? '#38bdf8' : '#9ca3af',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.15s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (!showColorPicker) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (!showColorPicker) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }
          }}
        >
          <Palette size={18} />
          {/* Active color indicator dot */}
          <span
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: currentColor,
              border: currentColor === '#ffffff' ? '1px solid #64748b' : '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          />
        </button>

        {/* Color Picker Popup: Floats directly above the Palette button without overlaying other elements */}
        {showColorPicker && (
          <div
            ref={popupRef}
            data-popup
            style={{
              position: 'absolute',
              bottom: '50px',
              left: '0',
              background: 'rgba(24, 27, 34, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(20px)',
              zIndex: 350,
              width: '230px',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div
              style={{
                color: '#94a3b8',
                fontSize: '11px',
                marginBottom: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Board Background
            </div>

            {/* Current Color Preview */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: currentColor,
                  border: currentColor === '#ffffff' ? '1px solid #475569' : '1px solid rgba(255,255,255,0.25)',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
              <span
                style={{
                  color: '#e2e8f0',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 500,
                }}
              >
                {currentColor.toUpperCase()}
              </span>
            </div>

            {/* Curated Board Color Presets (Non-neon, professional educational/IFP templates) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '6px',
                marginBottom: '12px',
              }}
            >
              {BOARD_BG_PRESETS.map((c) => {
                const isSelected = currentColor.toLowerCase() === c.color.toLowerCase();
                return (
                  <button
                    key={c.color}
                    onClick={() => setPageBackgroundColor(c.color)}
                    title={c.label}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: c.color,
                      border: isSelected
                        ? '2px solid #38bdf8'
                        : c.color === '#ffffff'
                        ? '1px solid #64748b'
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'transform 0.12s ease, border-color 0.12s ease',
                      boxShadow: isSelected ? '0 0 0 2px rgba(56, 189, 248, 0.3)' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <input
                ref={colorInputRef}
                type="color"
                value={currentColor}
                onChange={(e) => setPageBackgroundColor(e.target.value)}
                style={{
                  width: '30px',
                  height: '30px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  padding: 0,
                  background: 'transparent',
                }}
              />
              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>
                Custom Color
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageNavigation;
