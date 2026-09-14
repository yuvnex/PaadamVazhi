import React from 'react';
import { useWhiteboardStore } from '../store/useStore';
import { X, Plus, Copy, Trash2, Edit3 } from 'lucide-react';

const PageOverview: React.FC = () => {
  const {
    board,
    currentPageIndex,
    setCurrentPage,
    addPage,
    deletePage,
    duplicatePage,
    renamePage,
    setShowPageOverview,
  } = useWhiteboardStore();

  const handleRename = (index: number) => {
    const name = window.prompt('Rename page:', board.pages[index].name);
    if (name) renamePage(index, name);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      zIndex: 500,
    }} onClick={() => setShowPageOverview(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#2a2b2e',
          border: '1px solid #444',
          borderRadius: '12px',
          padding: '24px',
          width: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>Pages</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#4A90D9',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <Plus size={14} /> Add Page
            </button>
            <button
              onClick={() => setShowPageOverview(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '16px',
        }}>
          {board.pages.map((page, index) => (
            <div
              key={page.id}
              onClick={() => {
                setCurrentPage(index);
                setShowPageOverview(false);
              }}
              style={{
                background: currentPageIndex === index ? '#3a3b3e' : '#1a1b1e',
                border: currentPageIndex === index ? '2px solid #4A90D9' : '1px solid #3a3b3e',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (currentPageIndex !== index) {
                  e.currentTarget.style.borderColor = '#666';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPageIndex !== index) {
                  e.currentTarget.style.borderColor = '#3a3b3e';
                }
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                height: '100px',
                background: '#fff',
                borderRadius: '4px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: '#999',
                overflow: 'hidden',
              }}>
                {page.objects.length === 0 ? 'Empty' : `${page.objects.length} objects`}
              </div>

              {/* Page info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#ccc', fontSize: '12px' }}>{page.name}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRename(index); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                    }}
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicatePage(index); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                    }}
                  >
                    <Copy size={12} />
                  </button>
                  {board.pages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePage(index); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#F44336',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageOverview;
