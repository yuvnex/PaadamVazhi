import React, { useState } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import { X, Download, CloudUpload, Loader2, GraduationCap, FileText } from 'lucide-react';
import { exportAsJSON, downloadFile } from '../utils/canvas';
import { downloadBoardAsPDF } from '../utils/pdfExport';

const ExportDialog: React.FC = () => {
  const { board, settings, setShowExportDialog, setShowClassroomSubmitDialog } = useWhiteboardStore();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'export' | 'classroom' | 'cloud' | 'email'>('export');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExport = async (format: string) => {
    switch (format) {
      case 'pdf': {
        setIsExportingPdf(true);
        try {
          await downloadBoardAsPDF(board, settings);
        } finally {
          setIsExportingPdf(false);
        }
        break;
      }
      case 'json': {
        const json = exportAsJSON(board);
        downloadFile(json, `${board.name || 'whiteboard'}.json`);
        break;
      }
      case 'png': {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `${board.name || 'whiteboard'}.png`;
          a.click();
        }
        break;
      }
    }
    if (format !== 'pdf') {
      setShowExportDialog(false);
    }
  };

  const handleCloudUpload = () => {
    setUploadStatus('uploading');
    // Simulate upload - in real app, would call backend service
    setTimeout(() => {
      setUploadStatus('error');
    }, 2000);
  };

  const handleEmail = () => {
    if (!email) return;
    setUploadStatus('uploading');
    // Placeholder for email service
    setTimeout(() => {
      setUploadStatus('error');
    }, 2000);
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
    }} onClick={() => setShowExportDialog(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#2a2b2e',
          border: '1px solid #444',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>Export</h2>
          <button
            onClick={() => setShowExportDialog(false)}
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '20px',
          background: '#1a1b1e',
          borderRadius: '8px',
          padding: '3px',
        }}>
          {(['export', 'classroom', 'cloud', 'email'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setUploadStatus('idle'); }}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: activeTab === tab ? (tab === 'classroom' ? '#1e8e3e' : '#3a3b3e') : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: activeTab === tab ? '#fff' : '#888',
                fontSize: '11px',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                outline: 'none',
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {tab === 'classroom' && <GraduationCap size={12} />}
              {tab === 'classroom' ? 'Classroom' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              {
                format: 'pdf',
                label: 'Export as Single PDF',
                desc: `Combine all ${board.pages.length} slides into 1 document`,
                icon: <FileText size={18} color="#10b981" />,
                isWorking: isExportingPdf,
              },
              {
                format: 'png',
                label: 'Export Current View as PNG',
                desc: 'Raster image of active slide',
                icon: <Download size={18} color="#4A90D9" />,
              },
              {
                format: 'json',
                label: 'Export Project as JSON',
                desc: 'Full vector project backup data',
                icon: <Download size={18} color="#a855f7" />,
              },
            ].map((item) => (
              <button
                key={item.format}
                onClick={() => handleExport(item.format)}
                disabled={item.isWorking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#1a1b1e',
                  border: '1px solid #3a3b3e',
                  borderRadius: '8px',
                  color: '#ccc',
                  cursor: item.isWorking ? 'wait' : 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#252629';
                  e.currentTarget.style.borderColor = '#4A90D9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1a1b1e';
                  e.currentTarget.style.borderColor = '#3a3b3e';
                }}
              >
                {item.isWorking ? <Loader2 size={18} className="animate-spin" color="#10b981" /> : item.icon}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'classroom' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e8e3e 0%, #137333 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                boxShadow: '0 4px 14px rgba(30, 142, 62, 0.4)',
              }}
            >
              <GraduationCap size={26} color="#fff" />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 6px 0' }}>
              Google Classroom Notes Submission
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Select from your enrolled course list ({settings.googleClassroom?.courses?.length || 0} classes available) and automatically publish all {board.pages.length} slides as a single PDF.
            </p>
            <button
              onClick={() => {
                setShowExportDialog(false);
                setShowClassroomSubmitDialog(true);
              }}
              style={{
                width: '100%',
                padding: '11px',
                background: 'linear-gradient(135deg, #1e8e3e 0%, #137333 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(30, 142, 62, 0.3)',
              }}
            >
              <GraduationCap size={16} />
              Open Classroom Submission
            </button>
          </div>
        )}

        {activeTab === 'cloud' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CloudUpload size={32} color="#888" style={{ marginBottom: '12px' }} />
            <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '16px' }}>
              Upload your whiteboard to cloud storage
            </p>
            {uploadStatus === 'idle' && (
              <button
                onClick={handleCloudUpload}
                style={{
                  padding: '10px 24px',
                  background: '#4A90D9',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                Upload
              </button>
            )}
            {uploadStatus === 'uploading' && (
              <div style={{ color: '#999', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Loader2 size={16} className="animate-spin" /> Uploading...
              </div>
            )}
            {uploadStatus === 'error' && (
              <div style={{ color: '#F44336', fontSize: '13px' }}>
                Cloud service not configured. Backend required.
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <div style={{ padding: '10px 0' }}>
            <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1a1b1e',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '12px',
              }}
            />
            {uploadStatus === 'error' && (
              <div style={{ color: '#F44336', fontSize: '12px', marginBottom: '12px' }}>
                Email service not configured. Backend required.
              </div>
            )}
            <button
              onClick={handleEmail}
              disabled={!email}
              style={{
                width: '100%',
                padding: '10px',
                background: email ? '#4A90D9' : '#333',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                cursor: email ? 'pointer' : 'default',
                outline: 'none',
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportDialog;
