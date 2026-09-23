import React, { useState, useEffect } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import {
  COLLEGE_TIMETABLE,
  getCurrentScheduleInfo,
} from '../utils/periodSchedule';
import {
  GraduationCap,
  Calendar,
  ChevronDown,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Coffee,
  Utensils,
  Moon,
} from 'lucide-react';

export const PeriodStatusBar: React.FC = () => {
  const {
    periodSession,
    periodUploadStatus,
    simulationTimeOffsetMs,
    setSimulationTimeOffsetMs,
    setShowPeriodClassroomModal,
    autoUploadCurrentPeriodSession,
  } = useWhiteboardStore();

  const [now, setNow] = useState(new Date(Date.now() + simulationTimeOffsetMs));
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Update clock every second (accounting for simulation offset if set)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date(Date.now() + simulationTimeOffsetMs));
    }, 1000);
    return () => clearInterval(timer);
  }, [simulationTimeOffsetMs]);

  const scheduleInfo = getCurrentScheduleInfo(now);
  const activeCourse = periodSession.activeCourse;
  const accumulatedCount = periodSession.accumulatedPeriods.length;

  const handleSimulateTime = (targetMinutes: number) => {
    const realNow = new Date();
    const currentRealMinutes = realNow.getHours() * 60 + realNow.getMinutes();
    const diffMinutes = targetMinutes - currentRealMinutes;
    const offsetMs = diffMinutes * 60 * 1000;
    setSimulationTimeOffsetMs(offsetMs);
  };

  const handleResetSimulation = () => {
    setSimulationTimeOffsetMs(0);
  };

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return (
    <>
      {/* Top Header Bar */}
      <div
        style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 100,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          userSelect: 'none',
        }}
      >
        {/* Upload Status Toast / Pill */}
        {periodUploadStatus.state !== 'idle' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'rgba(24, 27, 34, 0.96)',
              border:
                periodUploadStatus.state === 'success'
                  ? '1px solid rgba(82, 183, 136, 0.35)'
                  : periodUploadStatus.state === 'error'
                  ? '1px solid rgba(239, 68, 68, 0.35)'
                  : '1px solid rgba(255, 255, 255, 0.15)',
              color:
                periodUploadStatus.state === 'success'
                  ? '#e2e8f0'
                  : periodUploadStatus.state === 'error'
                  ? '#fca5a5'
                  : '#cbd5e1',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {periodUploadStatus.state === 'generating' && <Loader2 size={13} className="animate-spin" color="#cbd5e1" />}
            {periodUploadStatus.state === 'uploading' && <Loader2 size={13} className="animate-spin" color="#cbd5e1" />}
            {periodUploadStatus.state === 'success' && <CheckCircle2 size={14} color="#52b788" />}
            {periodUploadStatus.state === 'error' && <AlertCircle size={14} color="#f87171" />}
            <span>{periodUploadStatus.message}</span>
            {periodUploadStatus.postLink && (
              <a
                href={periodUploadStatus.postLink}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#e2e8f0', marginLeft: '4px', textDecoration: 'underline', display: 'flex', alignItems: 'center' }}
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Period & Classroom Badge */}
        <button
          onClick={() => setShowScheduleModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(33, 35, 41, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '5px 14px 5px 10px',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            transition: 'all 0.15s ease',
          }}
          title="Click to view college timetable & schedule controls"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.background = 'rgba(40, 42, 50, 0.95)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.background = 'rgba(33, 35, 41, 0.88)';
          }}
        >
          {/* Status icon / dot - clean matte dot without neon glow */}
          {scheduleInfo.status === 'in_period' ? (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#52b788',
                display: 'inline-block',
              }}
            />
          ) : scheduleInfo.status === 'in_break' ? (
            <Coffee size={13} style={{ color: '#d97706' }} />
          ) : scheduleInfo.status === 'in_lunch' ? (
            <Utensils size={13} style={{ color: '#d97706' }} />
          ) : (
            <Moon size={13} style={{ color: '#94a3b8' }} />
          )}

          {/* Period Title */}
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
            {scheduleInfo.currentSlot?.name ||
              (scheduleInfo.status === 'in_break' ? 'Break' :
               scheduleInfo.status === 'in_lunch' ? 'Lunch' : 'Off-Hours')}
          </span>

          {/* Active Course badge if assigned */}
          {activeCourse && scheduleInfo.status === 'in_period' && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#f1f5f9',
                backgroundColor: '#263342',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '2px 8px',
                borderRadius: '8px',
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeCourse.name}
              {accumulatedCount > 1 && ` (${accumulatedCount}P)`}
            </span>
          )}

          {/* Countdown indicator */}
          {scheduleInfo.currentSlot && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {scheduleInfo.minutesRemaining}m left
            </span>
          )}

          {/* Clock */}
          <div
            style={{
              marginLeft: '4px',
              paddingLeft: '8px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#e2e8f0',
              letterSpacing: '0.5px',
            }}
          >
            {hours}:{minutes}
          </div>

          <ChevronDown size={14} style={{ color: '#64748b' }} />
        </button>
      </div>

      {/* College Timetable & Controls Modal */}
      {showScheduleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '540px',
              background: '#191b20',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
              overflow: 'hidden',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
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
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={18} style={{ color: '#94a3b8' }} />
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontWeight: 600 }}>
                  College Timetable & Period Status
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Timetable List */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                Daily Timetable Schedule
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {COLLEGE_TIMETABLE.map((slot) => {
                  const isCurrent = scheduleInfo.currentSlot?.id === slot.id;
                  const isBreak = slot.type === 'break' || slot.type === 'lunch';

                  return (
                    <div
                      key={slot.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: isBreak ? '8px 12px' : '10px 14px',
                        borderRadius: '8px',
                        background: isCurrent
                          ? 'rgba(255, 255, 255, 0.08)'
                          : isBreak
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(255, 255, 255, 0.035)',
                        border: isCurrent
                          ? '1px solid rgba(255, 255, 255, 0.2)'
                          : '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isCurrent ? (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#52b788',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: isBreak ? '#d97706' : '#475569',
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isCurrent ? 600 : 500,
                            color: isCurrent ? '#ffffff' : isBreak ? '#94a3b8' : '#e2e8f0',
                          }}
                        >
                          {slot.name}
                        </span>
                        {isCurrent && activeCourse && (
                          <span
                            style={{
                              fontSize: '11px',
                              background: '#232b36',
                              border: '1px solid rgba(255, 255, 255, 0.16)',
                              color: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 600,
                              letterSpacing: '0.3px',
                            }}
                          >
                            {activeCourse.name}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {slot.startTime} – {slot.endTime}
                        </span>
                        {/* Simulation Jump Button */}
                        <button
                          onClick={() => handleSimulateTime(slot.startMinutes + 1)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#94a3b8',
                            fontSize: '11px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = '#94a3b8';
                          }}
                          title={`Simulate time inside ${slot.name}`}
                        >
                          Test
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions & Simulation Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: '#141519',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {simulationTimeOffsetMs !== 0 ? (
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                      ⚡ Simulated Time Active ({hours}:{minutes}:{seconds})
                    </span>
                  ) : (
                    <span>Real-time System Clock ({hours}:{minutes}:{seconds})</span>
                  )}
                </span>

                {simulationTimeOffsetMs !== 0 && (
                  <button
                    onClick={handleResetSimulation}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={12} /> Reset to Live
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {scheduleInfo.status === 'in_period' && (
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setShowPeriodClassroomModal(true);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                    }}
                  >
                    <GraduationCap size={15} style={{ color: '#cbd5e1' }} />
                    {activeCourse ? 'Change Classroom' : 'Select Classroom'}
                  </button>
                )}

                {activeCourse && (
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      autoUploadCurrentPeriodSession('manual_trigger');
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#1d3326',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#254231';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#1d3326';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                    }}
                  >
                    <CheckCircle2 size={15} color="#86efac" />
                    Upload Notes Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PeriodStatusBar;
