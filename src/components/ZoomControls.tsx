import React from 'react';
import { useWhiteboardStore } from '../store/useStore';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';

const ZoomControls: React.FC = () => {
  const { viewTransform, setViewTransform } = useWhiteboardStore();
  
  const zoomPercent = Math.round(viewTransform.zoom * 100);

  const handleZoomIn = () => {
    const newZoom = Math.min(5, viewTransform.zoom * 1.25);
    setViewTransform({ zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, viewTransform.zoom / 1.25);
    setViewTransform({ zoom: newZoom });
  };

  const handleFitToScreen = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setViewTransform({
      offsetX: rect.width / 2,
      offsetY: rect.height / 2,
      zoom: 1,
    });
  };

  const handleReset = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setViewTransform({
      offsetX: rect.width / 2,
      offsetY: rect.height / 2,
      zoom: 1,
    });
  };

  return (
    <div
      data-toolbar
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
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
      <button
        onClick={handleZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
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
        <ZoomOut size={17} />
      </button>

      <span
        style={{
          color: '#e2e8f0',
          fontSize: '12px',
          fontWeight: 600,
          minWidth: '42px',
          textAlign: 'center',
          userSelect: 'none',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {zoomPercent}%
      </span>

      <button
        onClick={handleZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
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
        <ZoomIn size={17} />
      </button>

      <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px' }} />

      <button
        onClick={handleFitToScreen}
        title="Fit to screen"
        aria-label="Fit to screen"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
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
        <Maximize size={17} />
      </button>

      <button
        onClick={handleReset}
        title="Reset zoom"
        aria-label="Reset zoom"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
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
        <RotateCcw size={17} />
      </button>
    </div>
  );
};

export default ZoomControls;
