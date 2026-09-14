import React, { useState, useEffect } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  X,
  GraduationCap,
  CheckCircle2,
  Download,
  Send,
  Loader2,
  BookOpen,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  Layers,
  Info,
} from 'lucide-react';
import { generateBoardPDF, renderPageToDataUrl } from '../utils/pdfExport';
import {
  authenticateWithGoogle,
  redirectToGoogleOAuth,
  fetchGoogleUserProfile,
  fetchGoogleClassroomCourses,
  uploadPdfToGoogleDrive,
  createClassroomPost,
  getStoredAccessToken,
} from '../services/googleClassroom';

export const ClassroomSubmitDialog: React.FC = () => {
  const {
    board,
    settings,
    setShowClassroomSubmitDialog,
    disconnectGoogleClassroom,
    updateSettings,
  } = useWhiteboardStore();

  const classroomProfile = settings.googleClassroom;
  const isConnected = !!(classroomProfile?.isConnected && classroomProfile?.email);
  const courses = classroomProfile?.courses || [];

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [postTitle, setPostTitle] = useState<string>(
    `${board.name || 'Whiteboard Notes'} - ${new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`
  );
  const [postType, setPostType] = useState<'announcement' | 'material' | 'assignment'>('announcement');
  const [description, setDescription] = useState<string>(
    "Attached are the whiteboard slides and notes from today's session."
  );

  // Auth / OAuth states
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Slide previews state
  const [slidePreviews, setSlidePreviews] = useState<string[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(true);

  // Submission state
  const [status, setStatus] = useState<'idle' | 'generating' | 'uploading' | 'posting' | 'success' | 'error'>('idle');
  const [progressText, setProgressText] = useState('');
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState('');
  const [submittedPostLink, setSubmittedPostLink] = useState<string | null>(null);

  // Load slide thumbnails for preview
  useEffect(() => {
    let isMounted = true;
    async function loadPreviews() {
      setIsLoadingPreviews(true);
      const previews: string[] = [];
      for (const page of board.pages) {
        try {
          const url = await renderPageToDataUrl(page, settings, 480, 270);
          previews.push(url);
        } catch {
          previews.push('');
        }
      }
      if (isMounted) {
        setSlidePreviews(previews);
        setIsLoadingPreviews(false);
      }
    }
    loadPreviews();
    return () => {
      isMounted = false;
    };
  }, [board.pages, settings]);

  // Update selected course if courses change
  useEffect(() => {
    if (courses.length > 0 && (!selectedCourseId || !courses.some((c) => c.id === selectedCourseId))) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Auto-verify token on mount if stored
  useEffect(() => {
    const existingToken = getStoredAccessToken();
    if (existingToken && !isConnected) {
      handleVerifyToken(existingToken);
    }
  }, []);

  const handleVerifyToken = async (token: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const profile = await fetchGoogleUserProfile(token);
      const liveCourses = await fetchGoogleClassroomCourses(token);
      updateSettings({
        googleClassroom: {
          isConnected: true,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          courses: liveCourses,
        },
      });
      if (liveCourses.length > 0) {
        setSelectedCourseId(liveCourses[0].id);
      }
    } catch (err: any) {
      console.warn('Auto token verify notice:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Google Sign-In — directly opens Google's account chooser popup
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const token = await authenticateWithGoogle();
      if (!token) {
        throw new Error('Google authorization failed to return an access token.');
      }

      // 1. Fetch real Google User Profile
      const profile = await fetchGoogleUserProfile(token);

      // 2. Fetch all real Google Classroom courses
      const liveCourses = await fetchGoogleClassroomCourses(token);

      updateSettings({
        googleClassroom: {
          isConnected: true,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          courses: liveCourses,
        },
      });

      if (liveCourses.length > 0) {
        setSelectedCourseId(liveCourses[0].id);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setAuthError(err?.message || 'Failed to authenticate with Google Classroom.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRefreshCourses = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      handleGoogleSignIn();
      return;
    }
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const liveCourses = await fetchGoogleClassroomCourses(token);
      updateSettings({
        googleClassroom: {
          ...classroomProfile!,
          courses: liveCourses,
        },
      });
      if (liveCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(liveCourses[0].id);
      }
    } catch (e: any) {
      console.error('Failed to refresh courses:', e);
      setAuthError(e?.message || 'Failed to refresh Google Classroom courses.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourseId) {
      setAuthError('Please select a Google Classroom course to submit your notes.');
      return;
    }

    try {
      setStatus('generating');
      setProgressText(`Preparing ${board.pages.length} whiteboard slide${board.pages.length > 1 ? 's' : ''} as PDF...`);

      // Use the professor's entered name (postTitle) for the generated PDF
      const { blob, filename } = await generateBoardPDF(
        board,
        settings,
        (curr, total) => {
          setProgressText(`Rendering slide ${curr} of ${total}...`);
        },
        postTitle
      );

      setGeneratedPdfBlob(blob);
      setGeneratedFilename(filename);

      const token = getStoredAccessToken();
      if (!token) {
        throw new Error('Google authorization token not found. Please connect to Google Classroom first.');
      }

      // Upload to Google Drive API
      setStatus('uploading');
      setProgressText(`Uploading ${filename} to Google Drive...`);

      const driveRes = await uploadPdfToGoogleDrive(token, blob, filename);
      const driveFileId = driveRes.id;

      // Publish to Google Classroom API
      setStatus('posting');
      const targetCourse = courses.find((c) => c.id === selectedCourseId);
      setProgressText(`Publishing to "${targetCourse?.name || 'Classroom'}"...`);

      const classroomRes = await createClassroomPost(token, selectedCourseId, {
        title: postTitle,
        text: description,
        driveFileId,
        driveFileTitle: filename,
        postType,
      });

      const postLink = classroomRes.alternateLink || `https://classroom.google.com/c/${selectedCourseId}`;
      setSubmittedPostLink(postLink);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setProgressText(err?.message || 'Failed to submit slides to Google Classroom. Please try again.');
    }
  };

  const handleDownloadPdf = async () => {
    if (generatedPdfBlob && generatedFilename) {
      const url = URL.createObjectURL(generatedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedFilename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const { pdf, filename } = await generateBoardPDF(board, settings, undefined, postTitle);
      pdf.save(filename);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 600,
        padding: '20px',
      }}
      onClick={() => setShowClassroomSubmitDialog(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#242528',
          border: '1px solid #3e4045',
          borderRadius: '12px',
          width: isConnected ? '740px' : '480px',
          maxWidth: '95vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          color: '#e5e7eb',
          overflow: 'hidden',
          position: 'relative',
          transition: 'width 0.2s ease',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #35373c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#2a2b2e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#1f2023',
                border: '1px solid #3e4045',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <GraduationCap size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#f3f4f6' }}>
                Google Classroom
              </h2>
              <p style={{ fontSize: '12px', margin: 0, color: '#9ca3af' }}>
                {isConnected
                  ? 'Submit lecture notes and slides directly to your Google Classroom classes'
                  : 'Connect your Google account to access your classes'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowClassroomSubmitDialog(false)}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#35373c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={18} color="#ffffff" />
          </button>
        </div>

        {/* Not Connected View */}
        {!isConnected ? (
          <div
            style={{
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '18px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#1c1d20',
                border: '1px solid #35373c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={28} color="#ffffff" />
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f3f4f6', margin: '0 0 6px 0' }}>
                Sign in to Google Classroom
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#9ca3af',
                  lineHeight: '1.45',
                  margin: 0,
                  maxWidth: '380px',
                }}
              >
                Connect with your Google account to grant access to your enrolled courses and share whiteboard lecture slides directly to your class stream.
              </p>
            </div>

            {authError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fca5a5',
                  fontSize: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <AlertCircle size={16} color="#ffffff" />
                <div style={{ flex: 1, textAlign: 'left' }}>{authError}</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', marginTop: '6px' }}>
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                style={{
                  background: '#ffffff',
                  border: '1px solid #dadce0',
                  borderRadius: '24px',
                  color: '#3c4043',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '10px 24px',
                  cursor: isAuthenticating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transition: 'all 0.15s ease',
                  width: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
                }}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" color="#1a73e8" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.37 7.37 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Direct Redirect Option (Guaranteed to work on IFP/Smart TV/Android tabbed browsers) */}
              <button
                onClick={() => redirectToGoogleOAuth()}
                style={{
                  background: 'transparent',
                  border: '1px dashed #4b5563',
                  borderRadius: '6px',
                  color: '#93c5fd',
                  fontSize: '11px',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60a5fa';
                  e.currentTarget.style.color = '#bfdbfe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#4b5563';
                  e.currentTarget.style.color = '#93c5fd';
                }}
                title="Use if popup is blocked or hangs on a blank screen"
              >
                <ExternalLink size={12} />
                <span>Stuck on blank screen? Use Direct Sign-In</span>
              </button>
            </div>

            <div style={{ marginTop: '8px', borderTop: '1px solid #35373c', paddingTop: '16px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleDownloadPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: '#242528',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#35373c')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#242528')}
              >
                <Download size={13} color="#ffffff" />
                <span>Save PDF Locally</span>
              </button>

              <button
                onClick={() => setShowClassroomSubmitDialog(false)}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#35373c';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Connected View */
          <>
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Account Authentication Banner */}
              <div
                style={{
                  background: '#1c1d20',
                  border: '1px solid #35373c',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {classroomProfile?.avatar ? (
                    <img
                      src={classroomProfile.avatar}
                      alt={classroomProfile.name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #4b5563',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#2a2b2e',
                        border: '1px solid #3e4045',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '15px',
                      }}
                    >
                      {classroomProfile?.name?.[0]?.toUpperCase() || <GraduationCap size={18} color="#ffffff" />}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6' }}>
                      {classroomProfile?.name || 'Google User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      {classroomProfile?.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={handleRefreshCourses}
                    disabled={isAuthenticating}
                    style={{
                      background: '#242528',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#35373c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#242528';
                    }}
                  >
                    <RefreshCw size={13} color="#ffffff" className={isAuthenticating ? 'animate-spin' : ''} />
                    <span>Sync Classes</span>
                  </button>
                  <button
                    onClick={disconnectGoogleClassroom}
                    title="Disconnect Google Account"
                    style={{
                      background: 'transparent',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'color 0.15s ease, border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#f87171';
                      e.currentTarget.style.borderColor = '#f87171';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = '#4b5563';
                    }}
                  >
                    <LogOut size={13} color="#ffffff" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>

              {/* Auth Error Banner */}
              {authError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#fca5a5',
                    fontSize: '12px',
                  }}
                >
                  <AlertCircle size={16} color="#ffffff" />
                  <div style={{ flex: 1 }}>{authError}</div>
                </div>
              )}

              {/* Success Screen */}
              {status === 'success' ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 20px',
                    background: '#1c1d20',
                    borderRadius: '8px',
                    border: '1px solid #35373c',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: '#242528',
                      border: '1px solid #3e4045',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto',
                    }}
                  >
                    <CheckCircle2 size={30} color="#ffffff" />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f3f4f6', margin: '0 0 6px 0' }}>
                    Slides Successfully Published to Google Classroom
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      maxWidth: '480px',
                      margin: '0 auto 18px auto',
                      lineHeight: '1.4',
                    }}
                  >
                    All <strong style={{ color: '#fff' }}>{board.pages.length} slide{board.pages.length > 1 ? 's' : ''}</strong> were
                    exported to <strong style={{ color: '#ffffff' }}>{generatedFilename}</strong> and posted to your class stream.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {submittedPostLink && (
                      <a
                        href={submittedPostLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: '#2a2b2e',
                          border: '1px solid #4b5563',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 500,
                          textDecoration: 'none',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#35373c')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#2a2b2e')}
                      >
                        <ExternalLink size={14} color="#ffffff" />
                        <span>Open in Classroom</span>
                      </a>
                    )}
                    <button
                      onClick={handleDownloadPdf}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: '#242528',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#35373c')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#242528')}
                    >
                      <Download size={14} color="#ffffff" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      onClick={() => setShowClassroomSubmitDialog(false)}
                      style={{
                        padding: '8px 16px',
                        background: '#35373c',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#4b5563')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#35373c')}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Classroom Course Picker Section */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <label
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#d1d5db',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <BookOpen size={14} color="#ffffff" /> <span>Select Google Classroom</span>
                        {courses.length > 0 && (
                          <span style={{ color: '#9ca3af', fontWeight: 400 }}>({courses.length} Available)</span>
                        )}
                      </label>
                      <button
                        onClick={handleRefreshCourses}
                        disabled={isAuthenticating}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0,
                          transition: 'opacity 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        <RefreshCw size={12} color="#ffffff" className={isAuthenticating ? 'animate-spin' : ''} />
                        <span>Sync</span>
                      </button>
                    </div>

                    {courses.length === 0 ? (
                      <div
                        style={{
                          background: '#1c1d20',
                          border: '1px solid #35373c',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                        }}
                      >
                        <Info size={24} color="#ffffff" style={{ margin: '0 auto 6px auto' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6' }}>
                          No Google Classroom courses found
                        </div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px auto 12px auto', maxWidth: '400px' }}>
                          No active classes found under {classroomProfile?.email}. Create a class in Google Classroom first.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <a
                            href="https://classroom.google.com"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#242528',
                              border: '1px solid #4b5563',
                              color: '#ffffff',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              textDecoration: 'none',
                            }}
                          >
                            <ExternalLink size={13} color="#ffffff" />
                            <span>Create Class in Google Classroom</span>
                          </a>
                          <button
                            onClick={handleRefreshCourses}
                            style={{
                              background: '#242528',
                              border: '1px solid #444',
                              borderRadius: '6px',
                              color: '#ffffff',
                              padding: '6px 14px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Refresh Classes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Course Grid */
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                          gap: '8px',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          padding: '1px',
                        }}
                      >
                        {courses.map((c) => {
                          const isSelected = selectedCourseId === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCourseId(c.id)}
                              style={{
                                background: isSelected ? '#2a2c31' : '#1c1d20',
                                border: isSelected ? '1px solid #52525b' : '1px solid #35373c',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                position: 'relative',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#4b5563';
                                  e.currentTarget.style.background = '#222327';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#35373c';
                                  e.currentTarget.style.background = '#1c1d20';
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#9ca3af',
                                  }}
                                />
                                {isSelected && <CheckCircle2 size={14} color="#ffffff" />}
                              </div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: isSelected ? '#fff' : '#e5e7eb',
                                  lineHeight: '1.3',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {c.name}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '11px',
                                  color: '#9ca3af',
                                }}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {c.section || 'Classroom'} {c.room ? `• ${c.room}` : ''}
                                </span>
                                <a
                                  href={`https://classroom.google.com/c/${c.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                  title="Open course in browser"
                                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                >
                                  <ExternalLink size={11} color="#ffffff" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Slide Thumbnails Preview */}
                  <div
                    style={{
                      background: '#1c1d20',
                      border: '1px solid #35373c',
                      borderRadius: '8px',
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Layers size={14} color="#ffffff" />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6' }}>
                          Attached Slides ({board.pages.length})
                        </span>
                        <span
                          style={{
                            background: '#242528',
                            border: '1px solid #3e4045',
                            color: '#9ca3af',
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          Single PDF
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>16:9 Landscape</span>
                    </div>

                    {/* Slides Strip */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '2px',
                      }}
                    >
                      {isLoadingPreviews ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#9ca3af',
                            fontSize: '12px',
                            padding: '6px 0',
                          }}
                        >
                          <Loader2 size={13} className="animate-spin" color="#ffffff" /> Preparing slide thumbnails...
                        </div>
                      ) : (
                        slidePreviews.map((url, idx) => (
                          <div
                            key={idx}
                            style={{
                              flexShrink: 0,
                              width: '100px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px',
                            }}
                          >
                            <div
                              style={{
                                width: '100px',
                                height: '56px',
                                borderRadius: '5px',
                                overflow: 'hidden',
                                border: '1px solid #35373c',
                                background: '#111214',
                                position: 'relative',
                              }}
                            >
                              {url ? (
                                <img
                                  src={url}
                                  alt={`Slide ${idx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#666',
                                    fontSize: '10px',
                                  }}
                                >
                                  Slide {idx + 1}
                                </div>
                              )}
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '2px',
                                  right: '3px',
                                  background: 'rgba(0,0,0,0.7)',
                                  color: '#fff',
                                  fontSize: '9px',
                                  padding: '1px 3px',
                                  borderRadius: '2px',
                                }}
                              >
                                #{idx + 1}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#9ca3af',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {board.pages[idx]?.name || `Page ${idx + 1}`}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Publication Details Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                          Announcement / Lecture Title (PDF Name)
                        </label>
                        <input
                          type="text"
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#1c1d20',
                            border: '1px solid #35373c',
                            borderRadius: '6px',
                            padding: '7px 10px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s ease',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#52525b')}
                          onBlur={(e) => (e.target.style.borderColor = '#35373c')}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                          Publish Type
                        </label>
                        <select
                          value={postType}
                          onChange={(e) => setPostType(e.target.value as any)}
                          style={{
                            width: '100%',
                            background: '#1c1d20',
                            border: '1px solid #35373c',
                            borderRadius: '6px',
                            padding: '7px 10px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s ease',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#52525b')}
                          onBlur={(e) => (e.target.style.borderColor = '#35373c')}
                        >
                          <option value="announcement">Class Announcement</option>
                          <option value="material">Classwork Material</option>
                          <option value="assignment">Assignment Resource</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                        Student Message / Notes
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        style={{
                          width: '100%',
                          background: '#1c1d20',
                          border: '1px solid #35373c',
                          borderRadius: '6px',
                          padding: '7px 10px',
                          color: '#fff',
                          fontSize: '12px',
                          outline: 'none',
                          resize: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          transition: 'border-color 0.15s ease',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#52525b')}
                        onBlur={(e) => (e.target.style.borderColor = '#35373c')}
                      />
                    </div>
                  </div>

                  {/* Progress feedback during submit */}
                  {(status === 'generating' || status === 'uploading' || status === 'posting') && (
                    <div
                      style={{
                        background: '#1c1d20',
                        border: '1px solid #35373c',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    >
                      <Loader2 size={16} className="animate-spin" color="#ffffff" />
                      <span>{progressText}</span>
                    </div>
                  )}

                  {status === 'error' && (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#fca5a5',
                        fontSize: '12px',
                      }}
                    >
                      <AlertCircle size={16} color="#ffffff" />
                      <span>{progressText}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer (Connected View) */}
            {status !== 'success' && (
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid #35373c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#2a2b2e',
                }}
              >
                <button
                  onClick={handleDownloadPdf}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    background: '#242528',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#35373c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#242528')}
                >
                  <Download size={14} color="#ffffff" />
                  <span>Save PDF Locally</span>
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowClassroomSubmitDialog(false)}
                    style={{
                      padding: '7px 14px',
                      background: 'transparent',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      color: '#9ca3af',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease, color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#35373c';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={
                      courses.length === 0 ||
                      !selectedCourseId ||
                      status === 'generating' ||
                      status === 'uploading' ||
                      status === 'posting'
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 18px',
                      background:
                        courses.length === 0
                          ? '#1f2023'
                          : '#242528',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      color: courses.length === 0 ? '#6b7280' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: courses.length === 0 ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (courses.length > 0) {
                        e.currentTarget.style.background = '#35373c';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (courses.length > 0) {
                        e.currentTarget.style.background = '#242528';
                      }
                    }}
                  >
                    <Send size={13} color="#ffffff" />
                    <span>Submit Notes to Class</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassroomSubmitDialog;
