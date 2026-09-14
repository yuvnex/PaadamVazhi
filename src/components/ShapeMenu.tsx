import React from 'react';
import { useWhiteboardStore } from '../store/useStore';
import type { ShapeType } from '../types';

const shapes: { id: ShapeType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'rectangle',
    label: 'Rectangle',
    icon: <svg width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" fill="none" stroke="#999" strokeWidth="1.5" rx="2"/></svg>,
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="#999" strokeWidth="1.5"/></svg>,
  },
  {
    id: 'ellipse',
    label: 'Ellipse',
    icon: <svg width="20" height="20" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="9" ry="6" fill="none" stroke="#999" strokeWidth="1.5"/></svg>,
  },
  {
    id: 'line',
    label: 'Line',
    icon: <svg width="20" height="20" viewBox="0 0 20 20"><line x1="3" y1="17" x2="17" y2="3" stroke="#999" strokeWidth="1.5"/></svg>,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: <svg width="20" height="20" viewBox="0 0 20 20"><line x1="3" y1="17" x2="15" y2="5" stroke="#999" strokeWidth="1.5"/><polyline points="8,4 16,4 16,12" fill="none" stroke="#999" strokeWidth="1.5"/></svg>,
  },
  {
    id: 'triangle',
    label: 'Triangle',
    icon: <svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18" fill="none" stroke="#999" strokeWidth="1.5"/></svg>,
  },
  {
    id: 'diamond',
    label: 'Diamond',
    icon: <svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,1 19,10 10,19 1,10" fill="none" stroke="#999" strokeWidth="1.5"/></svg>,
  },
  {
    id: 'star',
    label: 'Star',
    icon: <svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,1 12.5,7.5 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7.5" fill="none" stroke="#999" strokeWidth="1"/></svg>,
  },
];

const ShapeMenu: React.FC = () => {
  const { shapeType, setShapeType, setPenColor, penColor } = useWhiteboardStore();

  return (
    <div data-popup style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#2a2b2e',
      border: '1px solid #444',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 200,
      minWidth: '200px',
    }}>
      <div style={{ color: '#aaa', fontSize: '11px', marginBottom: '8px', fontWeight: 500 }}>Shapes</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
        {shapes.map((shape) => (
          <button
            key={shape.id}
            onClick={() => setShapeType(shape.id)}
            title={shape.label}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: shapeType === shape.id ? '#3a3b3e' : 'transparent',
              border: shapeType === shape.id ? '1px solid #4A90D9' : '1px solid transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (shapeType !== shape.id) e.currentTarget.style.background = '#252629';
            }}
            onMouseLeave={(e) => {
              if (shapeType !== shape.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            {shape.icon}
          </button>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '10px', 
        paddingTop: '10px', 
        borderTop: '1px solid #3a3b3e',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ color: '#aaa', fontSize: '11px' }}>Color</span>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['#000000', '#F44336', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'].map((c) => (
            <button
              key={c}
              onClick={() => setPenColor(c)}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: c,
                border: penColor === c ? '2px solid #fff' : '1px solid #555',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
          ))}
        </div>
      </div>
      
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

export default ShapeMenu;
