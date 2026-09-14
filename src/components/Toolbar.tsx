import React, { useCallback } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  Pen,
  Eraser,
  MousePointer2,
  Square,
  Plus,
  Undo2,
  Redo2,
  Hand,
} from 'lucide-react';
import type { Tool } from '../types';

const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'pen', icon: <Pen size={20} />, label: 'Pen' },
  { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
  { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
  { id: 'shape', icon: <Square size={20} />, label: 'Shape' },
  { id: 'text', icon: <Plus size={20} />, label: 'Add' },
];

const Toolbar: React.FC = () => {
  const {
    currentTool,
    setCurrentTool,
    undo,
    redo,
    historyIndex,
    history,
    showPenSettings,
    setShowPenSettings,
    showEraserSettings,
    setShowEraserSettings,
    showShapeMenu,
    setShowShapeMenu,
    showInsertMenu,
    setShowInsertMenu,
  } = useWhiteboardStore();

  const handleToolClick = useCallback((toolId: Tool) => {
    if (toolId === 'pen') {
      setCurrentTool('pen');
      setShowPenSettings(!showPenSettings);
      setShowEraserSettings(false);
      setShowShapeMenu(false);
      setShowInsertMenu(false);
    } else if (toolId === 'eraser') {
      setCurrentTool('eraser');
      setShowEraserSettings(!showEraserSettings);
      setShowPenSettings(false);
      setShowShapeMenu(false);
      setShowInsertMenu(false);
    } else if (toolId === 'shape') {
      setCurrentTool('shape');
      setShowShapeMenu(!showShapeMenu);
      setShowPenSettings(false);
      setShowEraserSettings(false);
      setShowInsertMenu(false);
    } else if (toolId === 'text') {
      setShowInsertMenu(!showInsertMenu);
      setShowPenSettings(false);
      setShowEraserSettings(false);
      setShowShapeMenu(false);
    } else {
      setCurrentTool(toolId);
      setShowPenSettings(false);
      setShowEraserSettings(false);
      setShowShapeMenu(false);
      setShowInsertMenu(false);
    }
  }, [showPenSettings, showEraserSettings, showShapeMenu, showInsertMenu]);

  return (
    <div data-toolbar style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 10px',
      background: '#1a1b1e',
      borderRadius: '14px',
      border: '1px solid #3a3b3e',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      zIndex: 100,
    }}>
      {tools.map((tool) => {
        const isActive = currentTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            title={tool.label}
            aria-label={tool.label}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive ? '#2a3a5a' : 'transparent',
              border: isActive ? '1.5px solid #4A90D9' : '1.5px solid transparent',
              borderRadius: '10px',
              color: isActive ? '#4A90D9' : '#999',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = '#252629';
                e.currentTarget.style.color = '#ccc';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#999';
              }
            }}
          >
            {tool.icon}
          </button>
        );
      })}
      
      <div style={{ width: '1px', height: '28px', background: '#3a3b3e', margin: '0 4px' }} />
      
      <button
        onClick={undo}
        disabled={historyIndex < 0}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1.5px solid transparent',
          borderRadius: '10px',
          color: historyIndex < 0 ? '#555' : '#999',
          cursor: historyIndex < 0 ? 'default' : 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          opacity: historyIndex < 0 ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (historyIndex >= 0) {
            e.currentTarget.style.background = '#252629';
            e.currentTarget.style.color = '#ccc';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = historyIndex < 0 ? '#555' : '#999';
        }}
      >
        <Undo2 size={20} />
      </button>
      
      <button
        onClick={redo}
        disabled={historyIndex >= history.length - 1}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1.5px solid transparent',
          borderRadius: '10px',
          color: historyIndex >= history.length - 1 ? '#555' : '#999',
          cursor: historyIndex >= history.length - 1 ? 'default' : 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          opacity: historyIndex >= history.length - 1 ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (historyIndex < history.length - 1) {
            e.currentTarget.style.background = '#252629';
            e.currentTarget.style.color = '#ccc';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = historyIndex >= history.length - 1 ? '#555' : '#999';
        }}
      >
        <Redo2 size={20} />
      </button>
      
      <button
        onClick={() => {
          setCurrentTool('hand');
          setShowPenSettings(false);
          setShowEraserSettings(false);
          setShowShapeMenu(false);
          setShowInsertMenu(false);
        }}
        title="Hand (H)"
        aria-label="Hand"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: currentTool === 'hand' ? '#2a3a5a' : 'transparent',
          border: currentTool === 'hand' ? '1.5px solid #4A90D9' : '1.5px solid transparent',
          borderRadius: '10px',
          color: currentTool === 'hand' ? '#4A90D9' : '#999',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (currentTool !== 'hand') {
            e.currentTarget.style.background = '#252629';
            e.currentTarget.style.color = '#ccc';
          }
        }}
        onMouseLeave={(e) => {
          if (currentTool !== 'hand') {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#999';
          }
        }}
      >
        <Hand size={20} />
      </button>
    </div>
  );
};

export default Toolbar;
