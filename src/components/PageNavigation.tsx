import React from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
} from 'lucide-react';

const PageNavigation: React.FC = () => {
  const {
    board,
    currentPageIndex,
    setCurrentPage,
    addPage,
    setShowMainMenu,
    setShowPageOverview,
    showMainMenu,
  } = useWhiteboardStore();

  const currentPage = currentPageIndex + 1;
  const totalPages = board.pages.length;

  return (
    <div data-toolbar style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      zIndex: 100,
    }}>
      {/* Hamburger menu */}
      <button
        onClick={() => setShowMainMenu(!showMainMenu)}
        title="Menu"
        aria-label="Menu"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: showMainMenu ? '#3a3b3e' : '#1a1b1e',
          border: '1px solid #3a3b3e',
          borderRadius: '10px',
          color: showMainMenu ? '#4A90D9' : '#999',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!showMainMenu) {
            e.currentTarget.style.background = '#252629';
            e.currentTarget.style.color = '#ccc';
          }
        }}
        onMouseLeave={(e) => {
          if (!showMainMenu) {
            e.currentTarget.style.background = '#1a1b1e';
            e.currentTarget.style.color = '#999';
          }
        }}
      >
        <Menu size={18} />
      </button>

      {/* Page navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        background: '#1a1b1e',
        border: '1px solid #3a3b3e',
        borderRadius: '10px',
        padding: '0 4px',
        height: '44px',
      }}>
        <button
          onClick={() => setCurrentPage(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          title="Previous page"
          aria-label="Previous page"
          style={{
            width: '28px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: currentPageIndex === 0 ? '#555' : '#999',
            cursor: currentPageIndex === 0 ? 'default' : 'pointer',
            outline: 'none',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          padding: '0 8px',
          minWidth: '40px',
          textAlign: 'center',
          userSelect: 'none',
        }}>
          {String(currentPage).padStart(2, '0')}/{String(totalPages).padStart(2, '0')}
        </span>

        <button
          onClick={() => setCurrentPage(currentPageIndex + 1)}
          disabled={currentPageIndex === totalPages - 1}
          title="Next page"
          aria-label="Next page"
          style={{
            width: '28px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: currentPageIndex === totalPages - 1 ? '#555' : '#999',
            cursor: currentPageIndex === totalPages - 1 ? 'default' : 'pointer',
            outline: 'none',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Add page */}
      <button
        onClick={addPage}
        title="Add page"
        aria-label="Add page"
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
        <Plus size={18} />
      </button>

      {/* Page overview */}
      <button
        onClick={() => setShowPageOverview(true)}
        title="Page overview"
        aria-label="Page overview"
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
        <LayoutGrid size={18} />
      </button>
    </div>
  );
};

export default PageNavigation;
