import React, { useState } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  GraduationCap,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Loader2,
  LogIn,
} from 'lucide-react';
import type { ClassroomCourse } from '../types';
import {
  authenticateWithGoogle,
  fetchGoogleUserProfile,
  fetchGoogleClassroomCourses,
  setStoredAccessToken,
} from '../services/googleClassroom';

export const PeriodClassroomModal: React.FC = () => {
  const {
    periodSlot,
    periodSession,
    settings,
    updateSettings,
    selectPeriodClassroom,
  } = useWhiteboardStore();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!periodSlot || periodSlot.type !== 'period') {
    return null;
  }

  const courses = settings.googleClassroom?.courses || [];
  const isConnected = !!(settings.googleClassroom?.isConnected && settings.googleClassroom?.email);
  const activeCourseId = periodSession.activeCourse?.id;

  const handleSelectCourse = (course: ClassroomCourse) => {
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
        backgroundColor: 'rgba(10, 12, 16, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(180deg, #1f2229 0%, #16181f 100%)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: '24px 28px 20px',
            background: 'linear-gradient(135deg, rgba(30, 142, 62, 0.22) 0%, rgba(26, 115, 232, 0.18) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.3px',
                border: '1px solid rgba(34, 197, 94, 0.35)',
              }}
            >
              <Clock size={13} />
              {periodSlot.startTime} – {periodSlot.endTime}
            </span>
            <span
              style={{
                color: '#94a3b8',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Layers size={13} />
              {periodSlot.name}
            </span>
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <GraduationCap size={24} style={{ color: '#4ade80' }} />
            Select a Classroom to Continue
          </h2>

          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.45' }}>
            Choose the course for <strong>{periodSlot.name}</strong>. Notes written during this period will be automatically saved and published to the selected classroom.
          </p>
        </div>

        {/* Course List Section */}
        <div
          style={{
            padding: '20px 28px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {authError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
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

          {courses.length > 0 ? (
            <>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#64748b',
                  marginBottom: '2px',
                }}
              >
                Available Classes ({courses.length})
              </div>

              {courses.map((course) => {
                const isSelectedConsecutive = activeCourseId === course.id;
                const courseColor = course.color || '#1a73e8';

                return (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 18px',
                      background: isSelectedConsecutive
                        ? 'rgba(34, 197, 94, 0.08)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelectedConsecutive
                        ? '1.5px solid rgba(34, 197, 94, 0.45)'
                        : '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isSelectedConsecutive
                        ? 'rgba(34, 197, 94, 0.14)'
                        : 'rgba(255, 255, 255, 0.07)';
                      e.currentTarget.style.borderColor = isSelectedConsecutive
                        ? '#4ade80'
                        : 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelectedConsecutive
                        ? 'rgba(34, 197, 94, 0.08)'
                        : 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = isSelectedConsecutive
                        ? 'rgba(34, 197, 94, 0.45)'
                        : 'rgba(255, 255, 255, 0.07)';
                    }}
                  >
                    {/* Course Color Pill */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: courseColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '17px',
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${courseColor}40`,
                      }}
                    >
                      {course.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Course Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '3px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {course.name}
                        </span>
                        {isSelectedConsecutive && (
                          <span
                            style={{
                              fontSize: '11px',
                              background: 'rgba(34, 197, 94, 0.2)',
                              color: '#4ade80',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Continuous Session
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          display: 'flex',
                          gap: '12px',
                        }}
                      >
                        {course.section && <span>Sec: {course.section}</span>}
                        {course.room && <span>Room: {course.room}</span>}
                        {!course.section && !course.room && <span>Google Classroom Course</span>}
                      </div>
                    </div>

                    <ChevronRight size={18} style={{ color: '#64748b' }} />
                  </button>
                );
              })}
            </>
          ) : (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              <GraduationCap size={36} style={{ color: '#64748b', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
                No Google Classroom Connected
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                Sign in to your Google Classroom account to automatically sync your lecture courses, or add default classroom subjects below.
              </p>

              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1e8e3e 0%, #137333 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(30, 142, 62, 0.3)',
                }}
              >
                {isAuthenticating ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {isAuthenticating ? 'Connecting to Google...' : 'Sign In with Google Classroom'}
              </button>
            </div>
          )}
        </div>

        {/* Footer info & options */}
        <div
          style={{
            padding: '16px 28px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <Sparkles size={14} style={{ color: '#38bdf8' }} />
            <span>Consecutive periods for the same class are combined automatically.</span>
          </div>

          {!isConnected && (
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#cbd5e1',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Connect Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodClassroomModal;
