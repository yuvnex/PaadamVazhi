import React from 'react';
import { useWhiteboardStore } from '../store/useStore';
import { X, GraduationCap, CloudUpload as UploadCloud } from 'lucide-react';

const SettingsDialog: React.FC = () => {
  const {
    settings,
    updateSettings,
    setShowSettings,
    disconnectGoogleClassroom,
    setShowClassroomSubmitDialog,
  } = useWhiteboardStore();

  const inputStyle: React.CSSProperties = {
    background: '#1a1b1e',
    border: '1px solid #444',
    borderRadius: '6px',
    color: '#fff',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    color: '#aaa',
    fontSize: '12px',
    marginBottom: '4px',
    display: 'block',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: '#4A90D9',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    borderBottom: '1px solid #3a3b3e',
    paddingBottom: '6px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
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
    }} onClick={() => setShowSettings(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#2a2b2e',
          border: '1px solid #444',
          borderRadius: '12px',
          padding: '24px',
          width: '420px',
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
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Appearance */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Appearance</div>
          <div style={rowStyle}>
            <span style={labelStyle}>Theme</span>
            <select
              value={settings.appearance}
              onChange={(e) => updateSettings({ appearance: e.target.value as any })}
              style={inputStyle}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Canvas */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Canvas</div>
          <div style={rowStyle}>
            <span style={labelStyle}>Background</span>
            <select
              value={settings.canvasBackground}
              onChange={(e) => updateSettings({ canvasBackground: e.target.value as any })}
              style={inputStyle}
            >
              <option value="white">White</option>
              <option value="grid">Grid</option>
              <option value="dots">Dots</option>
              <option value="blank">Blank</option>
            </select>
          </div>
        </div>

        {/* Drawing */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Drawing</div>
          <div style={rowStyle}>
            <span style={labelStyle}>Pressure Sensitivity</span>
            <input
              type="checkbox"
              checked={settings.pressureSensitivity}
              onChange={(e) => updateSettings({ pressureSensitivity: e.target.checked })}
              style={{ accentColor: '#4A90D9' }}
            />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Stroke Smoothing</span>
            <input
              type="checkbox"
              checked={settings.strokeSmoothing}
              onChange={(e) => updateSettings({ strokeSmoothing: e.target.checked })}
              style={{ accentColor: '#4A90D9' }}
            />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Default Pen</span>
            <select
              value={settings.defaultPen}
              onChange={(e) => updateSettings({ defaultPen: e.target.value as any })}
              style={inputStyle}
            >
              <option value="thin">Thin Pen</option>
              <option value="thick">Thick Pen</option>
              <option value="marker">Marker</option>
              <option value="highlighter">Highlighter</option>
              <option value="pencil">Pencil</option>
            </select>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Default Thickness</span>
            <input
              type="range"
              min="1"
              max="40"
              value={settings.defaultThickness}
              onChange={(e) => updateSettings({ defaultThickness: Number(e.target.value) })}
              style={{ width: '120px', accentColor: '#4A90D9' }}
            />
          </div>
        </div>

        {/* Behavior */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Behavior</div>
          <div style={rowStyle}>
            <span style={labelStyle}>Auto-save</span>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              style={{ accentColor: '#4A90D9' }}
            />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Confirm before deleting</span>
            <input
              type="checkbox"
              checked={settings.confirmBeforeDeleting}
              onChange={(e) => updateSettings({ confirmBeforeDeleting: e.target.checked })}
              style={{ accentColor: '#4A90D9' }}
            />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Touch Input</span>
            <input
              type="checkbox"
              checked={settings.touchInput}
              onChange={(e) => updateSettings({ touchInput: e.target.checked })}
              style={{ accentColor: '#4A90D9' }}
            />
          </div>
        </div>

        {/* Google Classroom Integration */}
        <div style={sectionStyle}>
          <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80' }}>
              <GraduationCap size={16} /> Google Classroom
            </span>
            {settings.googleClassroom?.isConnected && (
              <span style={{ fontSize: '11px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>
                ● Connected
              </span>
            )}
          </div>

          {settings.googleClassroom?.isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#1a1b1e', border: '1px solid #383a40', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {settings.googleClassroom.name || 'Google Account'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {settings.googleClassroom.email}
                  </div>
                </div>
                <button
                  onClick={disconnectGoogleClassroom}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#f87171',
                    fontSize: '11px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>

              {/* Submit to Classroom CTA */}
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowClassroomSubmitDialog(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1e8e3e 0%, #137333 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(30, 142, 62, 0.3)',
                }}
              >
                <UploadCloud size={16} />
                Submit Notes to Classroom ({settings.googleClassroom.courses?.length || 0} Real Classes)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, lineHeight: '1.4' }}>
                Connect your Google account via OAuth 2.0 to grant permissions, fetch your real classes, and publish whiteboard slides as a single PDF.
              </p>
              
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowClassroomSubmitDialog(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1e8e3e 0%, #137333 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <GraduationCap size={16} />
                Connect to Google Classroom
              </button>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Keyboard Shortcuts</div>
          {[
            ['P', 'Pen'],
            ['E', 'Eraser'],
            ['V', 'Select'],
            ['H', 'Hand'],
            ['R', 'Rectangle'],
            ['C', 'Circle'],
            ['L', 'Line'],
            ['T', 'Text'],
            ['Ctrl/Cmd + Z', 'Undo'],
            ['Ctrl/Cmd + Shift + Z', 'Redo'],
            ['Delete', 'Delete selected'],
            ['Ctrl/Cmd + S', 'Save'],
            ['Escape', 'Close popup'],
          ].map(([key, action]) => (
            <div key={key} style={rowStyle}>
              <span style={labelStyle}>{action}</span>
              <span style={{
                background: '#1a1b1e',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '2px 8px',
                color: '#999',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}>
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
