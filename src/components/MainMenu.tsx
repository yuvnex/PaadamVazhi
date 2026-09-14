import React from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  CloudUpload,
  ScanLine,
  Mail,
  Settings,
  X,
  GraduationCap,
} from 'lucide-react';
import { exportAsJSON, downloadFile } from '../utils/canvas';

const MainMenu: React.FC = () => {
  const {
    setShowMainMenu,
    setShowSettings,
    setShowExportDialog,
    setShowClassroomSubmitDialog,
    newBoard,
    board,
    loadBoard,
  } = useWhiteboardStore();

  const handleNew = () => {
    if (window.confirm('Create a new whiteboard? Unsaved changes will be lost.')) {
      newBoard();
    }
    setShowMainMenu(false);
  };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.pages) {
            loadBoard(data);
          }
        } catch {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setShowMainMenu(false);
  };

  const handleSave = () => {
    const json = exportAsJSON(board);
    downloadFile(json, `${board.name || 'whiteboard'}.json`);
    setShowMainMenu(false);
  };

  const handleSaveAs = () => {
    const name = window.prompt('Enter a name:', board.name || 'Untitled');
    if (name) {
      const json = exportAsJSON({ ...board, name });
      downloadFile(json, `${name}.json`);
    }
    setShowMainMenu(false);
  };

  const handleUploadCloud = () => {
    setShowExportDialog(true);
    setShowMainMenu(false);
  };

  const handleScan = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          useWhiteboardStore.getState().addObject({
            id: crypto.randomUUID?.() || Date.now().toString(),
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
    setShowMainMenu(false);
  };

  const handleEmail = () => {
    setShowExportDialog(true);
    setShowMainMenu(false);
  };

  const handleClassroom = () => {
    setShowClassroomSubmitDialog(true);
    setShowMainMenu(false);
  };

  const handleSettings = () => {
    setShowSettings(true);
    setShowMainMenu(false);
  };

  const handleExit = () => {
    setShowMainMenu(false);
  };

  const menuItems = [
    { id: 'new', label: 'New', icon: <FilePlus size={16} />, onClick: handleNew },
    { id: 'open', label: 'Open', icon: <FolderOpen size={16} />, onClick: handleOpen },
    { id: 'save', label: 'Save', icon: <Save size={16} />, onClick: handleSave },
    { id: 'saveas', label: 'Save as', icon: <SaveAll size={16} />, onClick: handleSaveAs },
    { id: 'classroom', label: 'Google Classroom', icon: <GraduationCap size={16} color="#ffffff" />, onClick: handleClassroom },
    { id: 'cloud', label: 'Upload To Cloud', icon: <CloudUpload size={16} />, onClick: handleUploadCloud },
    { id: 'scan', label: 'Scan', icon: <ScanLine size={16} />, onClick: handleScan },
    { id: 'email', label: 'Email', icon: <Mail size={16} />, onClick: handleEmail },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} />, onClick: handleSettings },
    { id: 'exit', label: 'Exit', icon: <X size={16} />, onClick: handleExit },
  ];

  return (
    <div data-popup style={{
      position: 'fixed',
      bottom: '70px',
      left: '16px',
      background: '#2a2b2e',
      border: '1px solid #444',
      borderRadius: '10px',
      padding: '6px 0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 300,
      minWidth: '200px',
    }}>
      {menuItems.map((item, index) => (
        <React.Fragment key={item.id}>
          {index === menuItems.length - 1 && (
            <div style={{ height: '1px', background: '#3a3b3e', margin: '4px 0' }} />
          )}
          <button
            onClick={item.onClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              color: '#ccc',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.15s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3a3b3e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ color: '#888', width: '18px', display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default MainMenu;
