import { useEffect, useRef } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import { getCurrentScheduleInfo } from '../utils/periodSchedule';

export function usePeriodScheduler() {
  const prevSlotIdRef = useRef<string | null>(null);

  useEffect(() => {
    const evaluateSchedule = () => {
      const state = useWhiteboardStore.getState();
      const currentNow = new Date(Date.now() + state.simulationTimeOffsetMs);
      const scheduleInfo = getCurrentScheduleInfo(currentNow);
      const activeSlot = scheduleInfo.currentSlot;
      const prevSlotId = prevSlotIdRef.current;

      // Update active period slot in store
      if (activeSlot?.id !== state.periodSlot?.id) {
        state.setPeriodSlot(activeSlot);
      }

      // Detect transition out of a period into Break, Lunch, or After School
      if (prevSlotId && (!activeSlot || activeSlot.type !== 'period')) {
        // We were in a period, but now we're in break/lunch/after-school
        if (state.periodSession.activeCourse && state.periodSession.accumulatedPeriods.length > 0) {
          state.autoUploadCurrentPeriodSession();
        }
      }

      // Detect start of a new period
      if (activeSlot && activeSlot.type === 'period') {
        if (state.lastHandledPeriodId !== activeSlot.id) {
          // At the exact start of every new period, display modal: "Select a Classroom to Continue"
          state.setShowPeriodClassroomModal(true);
        }
      }

      prevSlotIdRef.current = activeSlot?.id || (scheduleInfo.status === 'after_school' ? 'after_school' : 'before_school');
    };

    // Run immediately on mount
    evaluateSchedule();

    // Check every second for exact boundary detection
    const interval = setInterval(evaluateSchedule, 1000);
    return () => clearInterval(interval);
  }, []);
}
