export type Tool = 'pen' | 'eraser' | 'select' | 'shape' | 'hand' | 'text';

export type PenType = 'thin' | 'thick' | 'marker' | 'highlighter' | 'pencil';

export type ShapeType = 'rectangle' | 'circle' | 'ellipse' | 'line' | 'arrow' | 'triangle' | 'diamond' | 'star';

export type EraserSize = 'small' | 'medium' | 'large';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  type: 'stroke';
  points: Point[];
  color: string;
  thickness: number;
  penType: PenType;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: number;
}

export interface BoardShape {
  id: string;
  type: 'shape';
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string | null;
  dashed: boolean;
  rotation: number;
  timestamp: number;
}

export interface TextObject {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface ImageObject {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  timestamp: number;
}

export interface StickyNote {
  id: string;
  type: 'sticky';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text: string;
  fontSize: number;
  timestamp: number;
}

export type BoardObject = Stroke | BoardShape | TextObject | ImageObject | StickyNote;

export interface Page {
  id: string;
  name: string;
  objects: BoardObject[];
  backgroundColor: string;
}

export interface Board {
  id: string;
  name: string;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}

export interface ViewTransform {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export interface HistoryEntry {
  pages: Page[];
  pageIndex: number;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  room?: string;
  studentsCount?: number;
  color?: string;
}

export interface GoogleClassroomProfile {
  isConnected: boolean;
  email: string;
  name: string;
  avatar?: string;
  courses: ClassroomCourse[];
}

export interface Settings {
  appearance: 'dark' | 'light' | 'system';
  canvasBackground: 'white' | 'grid' | 'dots' | 'blank';
  pressureSensitivity: boolean;
  strokeSmoothing: boolean;
  defaultPen: PenType;
  defaultThickness: number;
  autoSave: boolean;
  confirmBeforeDeleting: boolean;
  touchInput: boolean;
  googleClassroom: GoogleClassroomProfile;
}

export const DEFAULT_COLORS = [
  '#ffffff', '#4060E8', '#9E9E9E', '#FFD700',
  '#000000', '#00BCD4', '#FF9800', '#42A5F5',
  '#4CAF50', '#E040FB', '#F44336', '#8BC34A',
];

export const DEFAULT_CLASSROOM_COURSES: ClassroomCourse[] = [];

export const DEFAULT_SETTINGS: Settings = {
  appearance: 'dark',
  canvasBackground: 'white',
  pressureSensitivity: true,
  strokeSmoothing: true,
  defaultPen: 'thick',
  defaultThickness: 8,
  autoSave: true,
  confirmBeforeDeleting: true,
  touchInput: true,
  googleClassroom: {
    isConnected: false,
    email: '',
    name: '',
    courses: [],
  },
};

