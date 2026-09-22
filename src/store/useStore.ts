import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Tool,
  PenType,
  ShapeType,
  EraserSize,
  ViewTransform,
  BoardObject,
  Page,
  Board,
  HistoryEntry,
  Settings,
  ClassroomCourse,
  PeriodUploadStatus,
  PeriodSessionState,
} from '../types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_CLASSROOM_COURSES,
} from '../types';
import type { PeriodSlot } from '../utils/periodSchedule';
import { formatPeriodNumbers } from '../utils/periodSchedule';
import { uploadPeriodNotesToClassroom } from '../services/periodUploadService';

interface WhiteboardState {
  // Board
  board: Board;
  currentPageIndex: number;
  
  // Tool
  currentTool: Tool;
  penType: PenType;
  penColor: string;
  penThickness: number;
  eraserSize: EraserSize;
  shapeType: ShapeType;
  
  // Selection
  selectedObjectIds: string[];
  
  // View
  viewTransform: ViewTransform;
  
  // History
  history: HistoryEntry[];
  historyIndex: number;
  
  // UI
  showPenSettings: boolean;
  showEraserSettings: boolean;
  showShapeMenu: boolean;
  showInsertMenu: boolean;
  showMainMenu: boolean;
  showSettings: boolean;
  showPageOverview: boolean;
  showExportDialog: boolean;
  showClassroomSubmitDialog: boolean;
  
  // Period Schedule & Classroom Workflow
  periodSlot: PeriodSlot | null;
  periodSession: PeriodSessionState;
  showPeriodClassroomModal: boolean;
  periodUploadStatus: PeriodUploadStatus;
  lastHandledPeriodId: string | null;
  simulationTimeOffsetMs: number;
  
  // Settings
  settings: Settings;
  
  // Actions
  setCurrentTool: (tool: Tool) => void;
  setPenType: (type: PenType) => void;
  setPenColor: (color: string) => void;
  setPenThickness: (thickness: number) => void;
  setEraserSize: (size: EraserSize) => void;
  setShapeType: (type: ShapeType) => void;
  setSelectedObjects: (ids: string[]) => void;
  setViewTransform: (transform: Partial<ViewTransform>) => void;
  
  // Object CRUD
  addObject: (obj: BoardObject) => void;
  updateObject: (id: string, updates: Partial<BoardObject>) => void;
  deleteObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;
  
  // Page actions
  addPage: () => void;
  deletePage: (index: number) => void;
  setCurrentPage: (index: number) => void;
  renamePage: (index: number, name: string) => void;
  duplicatePage: (index: number) => void;
  setPageBackgroundColor: (color: string) => void;
  
  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // UI toggles
  setShowPenSettings: (show: boolean) => void;
  setShowEraserSettings: (show: boolean) => void;
  setShowShapeMenu: (show: boolean) => void;
  setShowInsertMenu: (show: boolean) => void;
  setShowMainMenu: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowPageOverview: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setShowClassroomSubmitDialog: (show: boolean) => void;
  setShowPeriodClassroomModal: (show: boolean) => void;
  setPeriodSlot: (slot: PeriodSlot | null) => void;
  setPeriodUploadStatus: (status: PeriodUploadStatus) => void;
  setSimulationTimeOffsetMs: (offsetMs: number) => void;
  selectPeriodClassroom: (course: ClassroomCourse, slot: PeriodSlot) => Promise<void>;
  autoUploadCurrentPeriodSession: (reason?: string) => Promise<void>;
  dismissPeriodModal: () => void;
  
  // Classroom actions
  connectGoogleClassroom: (email: string, name?: string) => void;
  disconnectGoogleClassroom: () => void;
  addClassroomCourse: (course: { name: string; section?: string; room?: string }) => void;
  
  // Board
  newBoard: () => void;
  loadBoard: (board: Board) => void;
  
  // Settings
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Current page objects helper
  getCurrentPage: () => Page;
  getCurrentObjects: () => BoardObject[];
}

const createPage = (name?: string): Page => ({
  id: uuidv4(),
  name: name || 'Page 1',
  objects: [],
  backgroundColor: '#000000',
});

const createBoard = (): Board => ({
  id: uuidv4(),
  name: 'Untitled Whiteboard',
  pages: [createPage('Page 1')],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  board: createBoard(),
  currentPageIndex: 0,
  
  currentTool: 'pen',
  penType: 'thick',
  penColor: '#000000',
  penThickness: 8,
  eraserSize: 'medium',
  shapeType: 'rectangle',
  
  selectedObjectIds: [],
  
  viewTransform: { offsetX: 0, offsetY: 0, zoom: 1 },
  
  history: [],
  historyIndex: -1,
  
  showPenSettings: false,
  showEraserSettings: false,
  showShapeMenu: false,
  showInsertMenu: false,
  showMainMenu: false,
  showSettings: false,
  showPageOverview: false,
  showExportDialog: false,
  showClassroomSubmitDialog: false,
  
  // Period Schedule & Classroom Workflow
  periodSlot: null,
  periodSession: {
    currentPeriodNumber: null,
    currentPeriodId: null,
    activeCourse: null,
    accumulatedPeriods: [],
    startedAt: null,
  },
  showPeriodClassroomModal: false,
  periodUploadStatus: {
    state: 'idle',
  },
  lastHandledPeriodId: null,
  simulationTimeOffsetMs: 0,
  
  settings: DEFAULT_SETTINGS,
  
  setCurrentTool: (tool) => set({ currentTool: tool, selectedObjectIds: [] }),
  setPenType: (type) => set({ penType: type }),
  setPenColor: (color) => set({ penColor: color }),
  setPenThickness: (thickness) => set({ penThickness: thickness }),
  setEraserSize: (size) => set({ eraserSize: size }),
  setShapeType: (type) => set({ shapeType: type }),
  setSelectedObjects: (ids) => set({ selectedObjectIds: ids }),
  setViewTransform: (transform) => set((state) => ({
    viewTransform: { ...state.viewTransform, ...transform },
  })),
  
  addObject: (obj) => {
    set((state) => {
      const pages = [...state.board.pages];
      const page = { ...pages[state.currentPageIndex] };
      page.objects = [...page.objects, obj];
      pages[state.currentPageIndex] = page;
      return {
        board: { ...state.board, pages, updatedAt: Date.now() },
      };
    });
  },
  
  updateObject: (id, updates) => {
    set((state) => {
      const pages = [...state.board.pages];
      const page = { ...pages[state.currentPageIndex] };
      page.objects = page.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } as BoardObject : obj
      );
      pages[state.currentPageIndex] = page;
      return {
        board: { ...state.board, pages, updatedAt: Date.now() },
      };
    });
  },
  
  deleteObjects: (ids) => {
    set((state) => {
      const pages = [...state.board.pages];
      const page = { ...pages[state.currentPageIndex] };
      page.objects = page.objects.filter((obj) => !ids.includes(obj.id));
      pages[state.currentPageIndex] = page;
      return {
        board: { ...state.board, pages, updatedAt: Date.now() },
        selectedObjectIds: state.selectedObjectIds.filter((id) => !ids.includes(id)),
      };
    });
  },
  
  duplicateObjects: (ids) => {
    const state = get();
    const page = state.board.pages[state.currentPageIndex];
    const objectsToDuplicate = page.objects.filter((obj) => ids.includes(obj.id));
    const newObjects = objectsToDuplicate.map((obj) => ({
      ...obj,
      id: uuidv4(),
      x: obj.x + 20,
      y: obj.y + 20,
    }));
    newObjects.forEach((obj) => get().addObject(obj));
  },
  
  addPage: () => {
    set((state) => {
      const pages = [...state.board.pages, createPage(`Page ${state.board.pages.length + 1}`)];
      return {
        board: { ...state.board, pages, updatedAt: Date.now() },
        currentPageIndex: pages.length - 1,
      };
    });
  },
  
  deletePage: (index) => {
    set((state) => {
      if (state.board.pages.length <= 1) return state;
      const pages = state.board.pages.filter((_, i) => i !== index);
      const newIndex = Math.min(state.currentPageIndex, pages.length - 1);
      return {
        board: { ...state.board, pages, updatedAt: Date.now() },
        currentPageIndex: newIndex,
      };
    });
  },
  
  setCurrentPage: (index) => {
    set((state) => ({
      currentPageIndex: Math.max(0, Math.min(index, state.board.pages.length - 1)),
      selectedObjectIds: [],
      viewTransform: { offsetX: 0, offsetY: 0, zoom: 1 },
    }));
  },
  
  renamePage: (index, name) => {
    set((state) => {
      const pages = [...state.board.pages];
      pages[index] = { ...pages[index], name };
      return { board: { ...state.board, pages, updatedAt: Date.now() } };
    });
  },
  
  duplicatePage: (index) => {
    set((state) => {
      const sourcePage = state.board.pages[index];
      const newPage: Page = {
        id: uuidv4(),
        name: `${sourcePage.name} (copy)`,
        objects: sourcePage.objects.map((obj) => ({ ...obj, id: uuidv4() })),
        backgroundColor: sourcePage.backgroundColor,
      };
      const pages = [...state.board.pages];
      pages.splice(index + 1, 0, newPage);
      return {
        board: { ...state.board, pages, updatedAt: Date.now() },
        currentPageIndex: index + 1,
      };
    });
  },

  setPageBackgroundColor: (color) => {
    set((state) => {
      const pages = [...state.board.pages];
      pages[state.currentPageIndex] = {
        ...pages[state.currentPageIndex],
        backgroundColor: color,
      };
      return {
        board: { ...state.board, pages, updatedAt: Date.now() },
      };
    });
  },
  
  pushHistory: () => {
    set((state) => {
      const entry: HistoryEntry = {
        pages: JSON.parse(JSON.stringify(state.board.pages)),
        pageIndex: state.currentPageIndex,
      };
      const history = state.history.slice(0, state.historyIndex + 1);
      history.push(entry);
      // Limit history to 100 entries
      if (history.length > 100) history.shift();
      return { history, historyIndex: history.length - 1 };
    });
  },
  
  undo: () => {
    set((state) => {
      if (state.historyIndex < 0) return state;
      const entry = state.history[state.historyIndex];
      const newPageIndex = Math.min(entry.pageIndex, entry.pages.length - 1);
      return {
        board: { ...state.board, pages: JSON.parse(JSON.stringify(entry.pages)) },
        currentPageIndex: newPageIndex,
        historyIndex: state.historyIndex - 1,
        selectedObjectIds: [],
      };
    });
  },
  
  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const entry = state.history[state.historyIndex + 2] || state.history[state.historyIndex + 1];
      if (!entry) return state;
      return {
        board: { ...state.board, pages: JSON.parse(JSON.stringify(entry.pages)) },
        currentPageIndex: entry.pageIndex,
        historyIndex: state.historyIndex + 1,
        selectedObjectIds: [],
      };
    });
  },
  
  setShowPenSettings: (show) => set({ showPenSettings: show }),
  setShowEraserSettings: (show) => set({ showEraserSettings: show }),
  setShowShapeMenu: (show) => set({ showShapeMenu: show }),
  setShowInsertMenu: (show) => set({ showInsertMenu: show }),
  setShowMainMenu: (show) => set({ showMainMenu: show }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowPageOverview: (show) => set({ showPageOverview: show }),
  setShowExportDialog: (show) => set({ showExportDialog: show }),
  setShowClassroomSubmitDialog: (show) => set({ showClassroomSubmitDialog: show }),
  setShowPeriodClassroomModal: (show) => set({ showPeriodClassroomModal: show }),
  setPeriodSlot: (slot) => set({ periodSlot: slot }),
  setPeriodUploadStatus: (status) => set({ periodUploadStatus: status }),
  setSimulationTimeOffsetMs: (offsetMs) => set({ simulationTimeOffsetMs: offsetMs }),
  dismissPeriodModal: () => set({ showPeriodClassroomModal: false }),

  selectPeriodClassroom: async (course: ClassroomCourse, slot: PeriodSlot) => {
    const state = get();
    const currentSession = state.periodSession;
    const isSameCourse = currentSession.activeCourse?.id === course.id;
    const periodNum = slot.periodNumber || 1;

    if (isSameCourse && currentSession.activeCourse) {
      // Consecutive period with the same classroom!
      // Requirement 4: Continue accumulating notes, keep same classroom, do NOT upload.
      const newAccumulated = currentSession.accumulatedPeriods.includes(periodNum)
        ? currentSession.accumulatedPeriods
        : [...currentSession.accumulatedPeriods, periodNum].sort((a, b) => a - b);

      set({
        periodSlot: slot,
        periodSession: {
          ...currentSession,
          currentPeriodNumber: periodNum,
          currentPeriodId: slot.id,
          accumulatedPeriods: newAccumulated,
        },
        lastHandledPeriodId: slot.id,
        showPeriodClassroomModal: false,
      });
      return;
    }

    // If there was an active course with notes previously, auto-upload the accumulated notes for that previous course
    if (currentSession.activeCourse && currentSession.accumulatedPeriods.length > 0) {
      await state.autoUploadCurrentPeriodSession('classroom_changed');
    }

    // Start tracking notes for this new period
    set({
      periodSlot: slot,
      periodSession: {
        currentPeriodNumber: periodNum,
        currentPeriodId: slot.id,
        activeCourse: course,
        accumulatedPeriods: [periodNum],
        startedAt: Date.now(),
      },
      lastHandledPeriodId: slot.id,
      showPeriodClassroomModal: false,
    });
  },

  autoUploadCurrentPeriodSession: async () => {
    const state = get();
    const session = state.periodSession;
    if (!session.activeCourse || session.accumulatedPeriods.length === 0) {
      return;
    }

    const courseToUpload = session.activeCourse;
    const periodsToUpload = [...session.accumulatedPeriods];
    const periodLabel = formatPeriodNumbers(periodsToUpload);
    const boardSnapshot = state.board;

    set({
      periodUploadStatus: {
        state: 'generating',
        message: `Packaging notes for ${courseToUpload.name}...`,
        courseName: courseToUpload.name,
        periodLabel,
        timestamp: Date.now(),
      },
    });

    const res = await uploadPeriodNotesToClassroom({
      board: boardSnapshot,
      settings: state.settings,
      course: courseToUpload,
      periodNumbers: periodsToUpload,
      onProgress: (phase, msg) => {
        set({
          periodUploadStatus: {
            state: phase === 'posting' ? 'uploading' : phase,
            message: msg,
            courseName: courseToUpload.name,
            periodLabel,
            timestamp: Date.now(),
          },
        });
      },
    });

    if (res.success) {
      if (res.skippedEmpty) {
        set({
          periodUploadStatus: {
            state: 'idle',
            message: `Whiteboard was empty for ${periodLabel}; upload skipped.`,
            timestamp: Date.now(),
          },
        });
      } else {
        set({
          periodUploadStatus: {
            state: 'success',
            message: `Notes for ${periodLabel} successfully published to ${courseToUpload.name}!`,
            courseName: courseToUpload.name,
            periodLabel,
            postLink: res.postLink,
            timestamp: Date.now(),
          },
        });
        // Create fresh whiteboard for next period
        get().newBoard();
      }
    } else {
      set({
        periodUploadStatus: {
          state: 'error',
          message: res.error || 'Auto-upload to Google Classroom failed.',
          courseName: courseToUpload.name,
          periodLabel,
          timestamp: Date.now(),
        },
      });
    }

    // Reset current period session tracking
    set({
      periodSession: {
        currentPeriodNumber: null,
        currentPeriodId: null,
        activeCourse: null,
        accumulatedPeriods: [],
        startedAt: null,
      },
    });
  },
  
  connectGoogleClassroom: (email: string, name?: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        googleClassroom: {
          ...state.settings.googleClassroom,
          isConnected: true,
          email,
          name: name || email.split('@')[0] || 'Professor',
          courses: state.settings.googleClassroom?.courses?.length
            ? state.settings.googleClassroom.courses
            : DEFAULT_CLASSROOM_COURSES,
        },
      },
    }));
  },
  
  disconnectGoogleClassroom: () => {
    localStorage.removeItem('gclass_access_token');
    set((state) => ({
      settings: {
        ...state.settings,
        googleClassroom: {
          isConnected: false,
          email: '',
          name: '',
          avatar: undefined,
          courses: [],
        },
      },
    }));
  },
  
  addClassroomCourse: (course) => {
    set((state) => {
      const colors = ['#1e8e3e', '#1a73e8', '#d93025', '#f29900', '#9334e6', '#00897b'];
      const newCourse = {
        id: uuidv4(),
        name: course.name,
        section: course.section || 'General',
        room: course.room || 'Online',
        studentsCount: 30,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      const existingCourses = state.settings.googleClassroom?.courses || [];
      return {
        settings: {
          ...state.settings,
          googleClassroom: {
            ...state.settings.googleClassroom,
            courses: [...existingCourses, newCourse],
          },
        },
      };
    });
  },
  
  newBoard: () => {
    set({
      board: createBoard(),
      currentPageIndex: 0,
      history: [],
      historyIndex: -1,
      selectedObjectIds: [],
      viewTransform: { offsetX: 0, offsetY: 0, zoom: 1 },
    });
  },
  
  loadBoard: (board) => {
    set({
      board,
      currentPageIndex: 0,
      history: [],
      historyIndex: -1,
      selectedObjectIds: [],
      viewTransform: { offsetX: 0, offsetY: 0, zoom: 1 },
    });
  },
  
  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },
  
  getCurrentPage: () => {
    const state = get();
    return state.board.pages[state.currentPageIndex];
  },
  
  getCurrentObjects: () => {
    const state = get();
    return state.board.pages[state.currentPageIndex]?.objects || [];
  },
}));
