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
      zoom: 0.8,
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
    <div data-toolbar style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: '#1a1b1e',
      border: '1px solid #3a3b3e',
      borderRadius: '10px',
      padding: '4px',
      zIndex: 100,
    }}>
      <button
        onClick={handleZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '6px',
          color: '#999',
          cursor: 'pointer',
          outline: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#252629'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <ZoomOut size={16} />
      </button>

      <span style={{
        color: '#999',
        fontSize: '12px',
        minWidth: '40px',
        textAlign: 'center',
        userSelect: 'none',
      }}>
        {zoomPercent}%
      </span>

      <button
        onClick={handleZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '6px',
          color: '#999',
          cursor: 'pointer',
          outline: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#252629'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <ZoomIn size={16} />
      </button>

      <div style={{ width: '1px', height: '20px', background: '#3a3b3e' }} />

      <button
        onClick={handleFitToScreen}
        title="Fit to screen"
        aria-label="Fit to screen"
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '6px',
          color: '#999',
          cursor: 'pointer',
          outline: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#252629'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Maximize size={16} />
      </button>

      <button
        onClick={handleReset}
        title="Reset zoom"
        aria-label="Reset zoom"
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '6px',
          color: '#999',
          cursor: 'pointer',
          outline: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#252629'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
};

export default ZoomControls;
