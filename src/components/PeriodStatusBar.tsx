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
              background:
                periodUploadStatus.state === 'success'
                  ? 'rgba(34, 197, 94, 0.2)'
                  : periodUploadStatus.state === 'error'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(59, 130, 246, 0.2)',
              border:
                periodUploadStatus.state === 'success'
                  ? '1px solid rgba(34, 197, 94, 0.4)'
                  : periodUploadStatus.state === 'error'
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid rgba(59, 130, 246, 0.4)',
              color:
                periodUploadStatus.state === 'success'
                  ? '#4ade80'
                  : periodUploadStatus.state === 'error'
                  ? '#f87171'
                  : '#60a5fa',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {periodUploadStatus.state === 'generating' && <Loader2 size={13} className="animate-spin" />}
            {periodUploadStatus.state === 'uploading' && <Loader2 size={13} className="animate-spin" />}
            {periodUploadStatus.state === 'success' && <CheckCircle2 size={14} />}
            {periodUploadStatus.state === 'error' && <AlertCircle size={14} />}
            <span>{periodUploadStatus.message}</span>
            {periodUploadStatus.postLink && (
              <a
                href={periodUploadStatus.postLink}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#fff', marginLeft: '4px', textDecoration: 'underline', display: 'flex', alignItems: 'center' }}
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
          {/* Status icon / dot */}
          {scheduleInfo.status === 'in_period' ? (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                display: 'inline-block',
              }}
            />
          ) : scheduleInfo.status === 'in_break' ? (
            <Coffee size={13} style={{ color: '#f59e0b' }} />
          ) : scheduleInfo.status === 'in_lunch' ? (
            <Utensils size={13} style={{ color: '#f59e0b' }} />
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
                color: '#fff',
                backgroundColor: activeCourse.color || '#1a73e8',
                padding: '2px 8px',
                borderRadius: '10px',
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
              background: '#1a1b1f',
              border: '1px solid #333',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
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
                borderBottom: '1px solid #2a2b30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                  College Timetable & Period Status
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
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
                        padding: isBreak ? '6px 12px' : '10px 14px',
                        borderRadius: '8px',
                        background: isCurrent
                          ? 'rgba(34, 197, 94, 0.12)'
                          : isBreak
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(255, 255, 255, 0.04)',
                        border: isCurrent ? '1px solid #22c55e' : '1px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isCurrent ? (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#22c55e',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: isBreak ? '#f59e0b' : '#475569',
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isCurrent ? 600 : 500,
                            color: isCurrent ? '#4ade80' : isBreak ? '#94a3b8' : '#e2e8f0',
                          }}
                        >
                          {slot.name}
                        </span>
                        {isCurrent && activeCourse && (
                          <span
                            style={{
                              fontSize: '11px',
                              background: activeCourse.color || '#1a73e8',
                              color: '#fff',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              fontWeight: 600,
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
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: '#cbd5e1',
                            fontSize: '10px',
                            padding: '3px 6px',
                            cursor: 'pointer',
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
                background: '#141518',
                borderTop: '1px solid #2a2b30',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
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
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={12} /> Reset to Live
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
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
                      gap: '6px',
                      background: '#2563eb',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <GraduationCap size={14} />
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
                      gap: '6px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '8px',
                      color: '#4ade80',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <CheckCircle2 size={14} />
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
