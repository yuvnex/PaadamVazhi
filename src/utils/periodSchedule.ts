export type PeriodSlotType = 'period' | 'break' | 'lunch';

export interface PeriodSlot {
  id: string;
  periodNumber?: number;
  name: string;
  shortName: string;
  startTime: string; // e.g. "09:20 AM"
  endTime: string;   // e.g. "10:00 AM"
  startMinutes: number; // minutes from midnight
  endMinutes: number;   // minutes from midnight
  type: PeriodSlotType;
}

// Convert "09:20" to minutes from midnight
export function timeToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

/**
 * College Timetable Schedule:
 * 1. 09:20 AM – 10:00 AM: 1st Period
 * 2. 10:00 AM – 10:45 AM: 2nd Period
 * 3. 10:45 AM – 11:30 AM: 3rd Period
 * 4. 11:30 AM – 11:45 AM: Break
 * 5. 11:45 AM – 12:30 PM: 4th Period
 * 6. 12:30 PM – 01:15 PM: 5th Period
 * 7. 01:15 PM – 01:20 PM: Break
 * 8. 01:20 PM – 02:05 PM: Lunch
 * 9. 02:05 PM – 02:50 PM: 6th Period
 * 10. 02:50 PM – 03:35 PM: 7th Period
 * 11. 03:35 PM – 03:50 PM: Break
 * 12. 03:50 PM – 04:30 PM: 8th Period
 */
export const COLLEGE_TIMETABLE: PeriodSlot[] = [
  {
    id: 'period-1',
    periodNumber: 1,
    name: '1st Period',
    shortName: 'P1',
    startTime: '09:20 AM',
    endTime: '10:00 AM',
    startMinutes: 9 * 60 + 20, // 560
    endMinutes: 10 * 60,       // 600
    type: 'period',
  },
  {
    id: 'period-2',
    periodNumber: 2,
    name: '2nd Period',
    shortName: 'P2',
    startTime: '10:00 AM',
    endTime: '10:45 AM',
    startMinutes: 10 * 60,      // 600
    endMinutes: 10 * 60 + 45,   // 645
    type: 'period',
  },
  {
    id: 'period-3',
    periodNumber: 3,
    name: '3rd Period',
    shortName: 'P3',
    startTime: '10:45 AM',
    endTime: '11:30 AM',
    startMinutes: 10 * 60 + 45, // 645
    endMinutes: 11 * 60 + 30,   // 690
    type: 'period',
  },
  {
    id: 'break-1',
    name: 'Morning Break',
    shortName: 'Break',
    startTime: '11:30 AM',
    endTime: '11:45 AM',
    startMinutes: 11 * 60 + 30, // 690
    endMinutes: 11 * 60 + 45,   // 705
    type: 'break',
  },
  {
    id: 'period-4',
    periodNumber: 4,
    name: '4th Period',
    shortName: 'P4',
    startTime: '11:45 AM',
    endTime: '12:30 PM',
    startMinutes: 11 * 60 + 45, // 705
    endMinutes: 12 * 60 + 30,   // 750
    type: 'period',
  },
  {
    id: 'period-5',
    periodNumber: 5,
    name: '5th Period',
    shortName: 'P5',
    startTime: '12:30 PM',
    endTime: '01:15 PM',
    startMinutes: 12 * 60 + 30, // 750
    endMinutes: 13 * 60 + 15,   // 795
    type: 'period',
  },
  {
    id: 'break-2',
    name: 'Short Break',
    shortName: 'Break',
    startTime: '01:15 PM',
    endTime: '01:20 PM',
    startMinutes: 13 * 60 + 15, // 795
    endMinutes: 13 * 60 + 20,   // 800
    type: 'break',
  },
  {
    id: 'lunch',
    name: 'Lunch Break',
    shortName: 'Lunch',
    startTime: '01:20 PM',
    endTime: '02:05 PM',
    startMinutes: 13 * 60 + 20, // 800
    endMinutes: 14 * 60 + 5,    // 845
    type: 'lunch',
  },
  {
    id: 'period-6',
    periodNumber: 6,
    name: '6th Period',
    shortName: 'P6',
    startTime: '02:05 PM',
    endTime: '02:50 PM',
    startMinutes: 14 * 60 + 5,  // 845
    endMinutes: 14 * 60 + 50,   // 890
    type: 'period',
  },
  {
    id: 'period-7',
    periodNumber: 7,
    name: '7th Period',
    shortName: 'P7',
    startTime: '02:50 PM',
    endTime: '03:35 PM',
    startMinutes: 14 * 60 + 50, // 890
    endMinutes: 15 * 60 + 35,   // 935
    type: 'period',
  },
  {
    id: 'break-3',
    name: 'Afternoon Break',
    shortName: 'Break',
    startTime: '03:35 PM',
    endTime: '03:50 PM',
    startMinutes: 15 * 60 + 35, // 935
    endMinutes: 15 * 60 + 50,   // 950
    type: 'break',
  },
  {
    id: 'period-8',
    periodNumber: 8,
    name: '8th Period',
    shortName: 'P8',
    startTime: '03:50 PM',
    endTime: '04:30 PM',
    startMinutes: 15 * 60 + 50, // 950
    endMinutes: 16 * 60 + 30,   // 990
    type: 'period',
  },
];

export interface CurrentScheduleInfo {
  currentSlot: PeriodSlot | null;
  nextSlot: PeriodSlot | null;
  status: 'in_period' | 'in_break' | 'in_lunch' | 'before_school' | 'after_school';
  minutesRemaining: number;
  secondsRemaining: number;
  currentMinutes: number;
  formattedTime: string;
}

export function getCurrentScheduleInfo(date: Date = new Date()): CurrentScheduleInfo {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const currentMinutes = hours * 60 + minutes;
  const currentTotalSeconds = currentMinutes * 60 + seconds;

  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedTime = `${String(formattedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;

  const firstSlot = COLLEGE_TIMETABLE[0];
  const lastSlot = COLLEGE_TIMETABLE[COLLEGE_TIMETABLE.length - 1];

  if (currentMinutes < firstSlot.startMinutes) {
    const diffSec = firstSlot.startMinutes * 60 - currentTotalSeconds;
    return {
      currentSlot: null,
      nextSlot: firstSlot,
      status: 'before_school',
      minutesRemaining: Math.ceil(diffSec / 60),
      secondsRemaining: diffSec,
      currentMinutes,
      formattedTime,
    };
  }

  if (currentMinutes >= lastSlot.endMinutes) {
    return {
      currentSlot: null,
      nextSlot: null,
      status: 'after_school',
      minutesRemaining: 0,
      secondsRemaining: 0,
      currentMinutes,
      formattedTime,
    };
  }

  // Find slot that contains current time
  for (let i = 0; i < COLLEGE_TIMETABLE.length; i++) {
    const slot = COLLEGE_TIMETABLE[i];
    if (currentMinutes >= slot.startMinutes && currentMinutes < slot.endMinutes) {
      const nextSlot = i + 1 < COLLEGE_TIMETABLE.length ? COLLEGE_TIMETABLE[i + 1] : null;
      const diffSec = slot.endMinutes * 60 - currentTotalSeconds;

      let status: CurrentScheduleInfo['status'] = 'in_period';
      if (slot.type === 'break') status = 'in_break';
      if (slot.type === 'lunch') status = 'in_lunch';

      return {
        currentSlot: slot,
        nextSlot,
        status,
        minutesRemaining: Math.max(0, Math.ceil(diffSec / 60)),
        secondsRemaining: Math.max(0, diffSec),
        currentMinutes,
        formattedTime,
      };
    }
  }

  // Fallback
  return {
    currentSlot: null,
    nextSlot: COLLEGE_TIMETABLE.find(s => s.startMinutes > currentMinutes) || null,
    status: 'before_school',
    minutesRemaining: 0,
    secondsRemaining: 0,
    currentMinutes,
    formattedTime,
  };
}

/**
 * Checks if two periods are consecutive with no break or lunch in between.
 * E.g., Period 1 and 2 (at 10:00), Period 2 and 3 (at 10:45), Period 4 and 5 (at 12:30), Period 6 and 7 (at 14:50).
 */
export function arePeriodsDirectlyConsecutive(slotA: PeriodSlot, slotB: PeriodSlot): boolean {
  if (slotA.type !== 'period' || slotB.type !== 'period') return false;
  return slotA.endMinutes === slotB.startMinutes;
}

/**
 * Formats a period sequence display, e.g. [2] -> "2nd Period", [2, 3] -> "2nd & 3rd Period", [6, 7] -> "6th & 7th Period"
 */
export function formatPeriodNumbers(periodNumbers: number[]): string {
  if (periodNumbers.length === 0) return 'Lecture';
  const suffixes = (n: number) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  if (periodNumbers.length === 1) {
    return `${suffixes(periodNumbers[0])} Period`;
  }

  if (periodNumbers.length === 2) {
    return `${suffixes(periodNumbers[0])} & ${suffixes(periodNumbers[1])} Period`;
  }

  return `${periodNumbers.map(suffixes).join(', ')} Period`;
}
