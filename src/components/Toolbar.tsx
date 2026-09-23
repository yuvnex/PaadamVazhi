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
  }, [showPenSettings, showEraserSettings, showShapeMenu, showInsertMenu, setCurrentTool, setShowPenSettings, setShowEraserSettings, setShowShapeMenu, setShowInsertMenu]);

  return (
    <div
      data-toolbar
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '5px 8px',
        background: 'rgba(28, 31, 38, 0.94)',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      {tools.map((tool) => {
        const isActive = currentTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            title={tool.label}
            aria-label={tool.label}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
              border: isActive ? '1.5px solid #38bdf8' : '1.5px solid transparent',
              borderRadius: '10px',
              color: isActive ? '#38bdf8' : '#9ca3af',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }
            }}
          >
            {tool.icon}
          </button>
        );
      })}

      <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 3px' }} />

      {/* Undo */}
      <button
        onClick={undo}
        disabled={historyIndex < 0}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1.5px solid transparent',
          borderRadius: '10px',
          color: historyIndex < 0 ? '#4b5563' : '#9ca3af',
          cursor: historyIndex < 0 ? 'default' : 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          opacity: historyIndex < 0 ? 0.35 : 1,
        }}
        onMouseEnter={(e) => {
          if (historyIndex >= 0) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = historyIndex < 0 ? '#4b5563' : '#9ca3af';
        }}
      >
        <Undo2 size={19} />
      </button>

      {/* Redo */}
      <button
        onClick={redo}
        disabled={historyIndex >= history.length - 1}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1.5px solid transparent',
          borderRadius: '10px',
          color: historyIndex >= history.length - 1 ? '#4b5563' : '#9ca3af',
          cursor: historyIndex >= history.length - 1 ? 'default' : 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          opacity: historyIndex >= history.length - 1 ? 0.35 : 1,
        }}
        onMouseEnter={(e) => {
          if (historyIndex < history.length - 1) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = historyIndex >= history.length - 1 ? '#4b5563' : '#9ca3af';
        }}
      >
        <Redo2 size={19} />
      </button>

      {/* Hand / Pan */}
      <button
        onClick={() => {
          setCurrentTool('hand');
          setShowPenSettings(false);
          setShowEraserSettings(false);
          setShowShapeMenu(false);
          setShowInsertMenu(false);
        }}
        title="Hand / Pan (H)"
        aria-label="Hand"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: currentTool === 'hand' ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
          border: currentTool === 'hand' ? '1.5px solid #38bdf8' : '1.5px solid transparent',
          borderRadius: '10px',
          color: currentTool === 'hand' ? '#38bdf8' : '#9ca3af',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (currentTool !== 'hand') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          if (currentTool !== 'hand') {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }
        }}
      >
        <Hand size={19} />
      </button>
    </div>
  );
};

export default Toolbar;
