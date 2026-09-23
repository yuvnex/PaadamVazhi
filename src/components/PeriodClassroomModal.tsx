import React, { useState } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  X,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  Loader2,
  BookOpen,
  Info,
  Plus,
} from 'lucide-react';
import type { ClassroomCourse } from '../types';
import {
  authenticateWithGoogle,
  fetchGoogleUserProfile,
  fetchGoogleClassroomCourses,
  setStoredAccessToken,
} from '../services/googleClassroom';

const PRESET_SUBJECTS = [
  'English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Social Studies',
  'Tamil',
];

export const PeriodClassroomModal: React.FC = () => {
  const {
    periodSlot,
    periodSession,
    settings,
    updateSettings,
    selectPeriodClassroom,
    dismissPeriodModal,
  } = useWhiteboardStore();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState('');

  if (!periodSlot || periodSlot.type !== 'period') {
    return null;
  }

  const courses = settings.googleClassroom?.courses || [];
  const isConnected = !!(settings.googleClassroom?.isConnected && settings.googleClassroom?.email);
  const activeCourseId = periodSession.activeCourse?.id;

  const handleSelectCourse = (course: ClassroomCourse) => {
    selectPeriodClassroom(course, periodSlot);
  };

  const handleSelectPreset = (name: string) => {
    const course: ClassroomCourse = {
      id: `preset-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
    };
    selectPeriodClassroom(course, periodSlot);
  };

  const handleCustomSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    const course: ClassroomCourse = {
      id: `custom-${Date.now()}`,
      name: trimmed,
    };
    selectPeriodClassroom(course, periodSlot);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const token = await authenticateWithGoogle();
      setStoredAccessToken(token);

      const profile = await fetchGoogleUserProfile(token);
      let liveCourses: ClassroomCourse[] = [];
      try {
        liveCourses = await fetchGoogleClassroomCourses(token);
      } catch (cErr: any) {
        console.warn('Courses fetch warning:', cErr);
      }

      updateSettings({
        googleClassroom: {
          isConnected: true,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          courses: liveCourses.length > 0 ? liveCourses : settings.googleClassroom?.courses || [],
        },
      });
    } catch (e: any) {
      console.error('Sign-in failed:', e);
      setAuthError(e?.message || 'Google Classroom sign-in failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={dismissPeriodModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#1a1b20',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#16171c',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.2px',
              }}
            >
              Select Classroom
            </h2>
            <div
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginTop: '3px',
              }}
            >
              {periodSlot.name} • {periodSlot.startTime} – {periodSlot.endTime}
            </div>
          </div>

          <button
            onClick={dismissPeriodModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'transparent';
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {authError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} />
              <span>{authError}</span>
            </div>
          )}

          {/* Section: Standard Subjects for quick IFP one-tap selection */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: '#64748b',
                marginBottom: '10px',
              }}
            >
              Quick Select Subject
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {PRESET_SUBJECTS.map((subjectName) => {
                const isSelected =
                  periodSession.activeCourse?.name?.toLowerCase() === subjectName.toLowerCase();

                return (
                  <button
                    key={subjectName}
                    onClick={() => handleSelectPreset(subjectName)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: isSelected
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected
                        ? '1px solid rgba(255, 255, 255, 0.25)'
                        : '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '8px',
                      color: isSelected ? '#ffffff' : '#e2e8f0',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                      }
                    }}
                  >
                    <BookOpen size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {subjectName}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#52b788',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Subject Input */}
            <form
              onSubmit={handleCustomSubjectSubmit}
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Or type custom subject..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!customSubject.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: customSubject.trim() ? '#242b35' : 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  color: customSubject.trim() ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: customSubject.trim() ? 'pointer' : 'default',
                  transition: 'all 0.12s ease',
                }}
              >
                <Plus size={14} /> Set
              </button>
            </form>
          </div>

          {/* Section: Google Classroom Integration */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#64748b',
                }}
              >
                Google Classroom Sync
              </div>
              {isConnected && (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#86efac',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ● Connected ({settings.googleClassroom?.email})
                </span>
              )}
            </div>

            {courses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {courses.map((course) => {
                  const isSelected = activeCourseId === course.id;
                  return (
                    <button
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: isSelected
                          ? 'rgba(255, 255, 255, 0.09)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '1px solid rgba(255, 255, 255, 0.22)'
                          : '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GraduationCap size={16} style={{ color: '#94a3b8' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                            {course.name}
                          </div>
                          {(course.section || course.room) && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                              {[course.section, course.room].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={15} style={{ color: '#64748b' }} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#f1f5f9' }}>
                    Connect Google Classroom
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Sync student stream courses to automatically upload period notes.
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isAuthenticating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ffffff',
                    border: '1px solid #dadce0',
                    borderRadius: '6px',
                    color: '#3c4043',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  {isAuthenticating ? (
                    <Loader2 size={14} className="animate-spin" color="#3c4043" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            background: '#15161a',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            <Info size={13} />
            <span>Consecutive periods for the same subject merge notes automatically.</span>
          </div>

          <button
            onClick={dismissPeriodModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '6px',
              transition: 'color 0.12s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeriodClassroomModal;
