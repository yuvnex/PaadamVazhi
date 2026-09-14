import React from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  Type,
  Image,
  StickyNote,
  Square,
  Circle,
  ArrowRight,
  Minus,
  FileUp,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { StickyNote as StickyNoteType, TextObject } from '../types';

const InsertMenu: React.FC = () => {
  const { addObject, setCurrentTool, setShowInsertMenu, setShapeType, pushHistory } = useWhiteboardStore();

  const handleInsert = (type: string) => {
    pushHistory();
    
    switch (type) {
      case 'text': {
        const textObj: TextObject = {
          id: uuidv4(),
          type: 'text',
          x: -100,
          y: -100,
          text: 'Double-click to edit',
          fontSize: 20,
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          color: '#000000',
          width: 200,
          height: 30,
          timestamp: Date.now(),
        };
        addObject(textObj);
        break;
      }
      case 'sticky': {
        const colors = ['#FFF9C4', '#F8BBD0', '#C8E6C9', '#BBDEFB', '#FFE0B2', '#E1BEE7'];
        const sticky: StickyNoteType = {
          id: uuidv4(),
          type: 'sticky',
          x: -75,
          y: -75,
          width: 150,
          height: 150,
          color: colors[Math.floor(Math.random() * colors.length)],
          text: 'Note',
          fontSize: 14,
          timestamp: Date.now(),
        };
        addObject(sticky);
        break;
      }
      case 'image': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = new window.Image();
            img.onload = () => {
              addObject({
                id: uuidv4(),
                type: 'image',
                x: -img.width / 4,
                y: -img.height / 4,
                width: img.width / 2,
                height: img.height / 2,
                src: ev.target?.result as string,
                timestamp: Date.now(),
              });
            };
            img.src = ev.target?.result as string;
          };
          reader.readAsDataURL(file);
        };
        input.click();
        break;
      }
      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line':
        setShapeType(type as any);
        setCurrentTool('shape');
        break;
      case 'file': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.click();
        break;
      }
    }
    setShowInsertMenu(false);
  };

  const items = [
    { id: 'text', label: 'Text', icon: <Type size={16} /> },
    { id: 'image', label: 'Image', icon: <Image size={16} /> },
    { id: 'sticky', label: 'Sticky Note', icon: <StickyNote size={16} /> },
    { id: 'rectangle', label: 'Rectangle', icon: <Square size={16} /> },
    { id: 'circle', label: 'Circle', icon: <Circle size={16} /> },
    { id: 'arrow', label: 'Arrow', icon: <ArrowRight size={16} /> },
    { id: 'line', label: 'Line', icon: <Minus size={16} /> },
    { id: 'file', label: 'File', icon: <FileUp size={16} /> },
  ];

  return (
    <div data-popup style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#2a2b2e',
      border: '1px solid #444',
      borderRadius: '12px',
      padding: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 200,
      minWidth: '180px',
    }}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleInsert(item.id)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: '#ccc',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.15s ease',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#3a3b3e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ color: '#999' }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
      
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

export default InsertMenu;
