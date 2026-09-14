import type { BoardObject, Point, Stroke, BoardShape, TextObject, ImageObject, StickyNote } from '../types';

// Hit test a point against a board object
export function hitTest(obj: BoardObject, point: Point, tolerance: number = 5): boolean {
  const px = point.x;
  const py = point.y;
  
  switch (obj.type) {
    case 'stroke': {
      const stroke = obj as Stroke;
      for (let i = 0; i < stroke.points.length - 1; i++) {
        const p1 = stroke.points[i];
        const p2 = stroke.points[i + 1];
        const dist = pointToSegmentDistance(px, py, p1.x, p1.y, p2.x, p2.y);
        if (dist <= (stroke.thickness / 2 + tolerance)) return true;
      }
      // Also check bounding box
      if (stroke.points.length === 1) {
        const p = stroke.points[0];
        return Math.abs(px - p.x) <= tolerance && Math.abs(py - p.y) <= tolerance;
      }
      return false;
    }
    case 'shape': {
      const shape = obj as BoardShape;
      const margin = tolerance + (shape.strokeWidth / 2);
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        return (
          px >= shape.x - margin &&
          px <= shape.x + shape.width + margin &&
          py >= shape.y - margin &&
          py <= shape.y + shape.height + margin
        );
      }
      // Check if near border
      const left = Math.abs(px - shape.x) <= margin && py >= shape.y - margin && py <= shape.y + shape.height + margin;
      const right = Math.abs(px - (shape.x + shape.width)) <= margin && py >= shape.y - margin && py <= shape.y + shape.height + margin;
      const top = Math.abs(py - shape.y) <= margin && px >= shape.x - margin && px <= shape.x + shape.width + margin;
      const bottom = Math.abs(py - (shape.y + shape.height)) <= margin && px >= shape.x - margin && px <= shape.x + shape.width + margin;
      
      if (shape.shapeType === 'circle' || shape.shapeType === 'ellipse') {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        if (rx === 0 || ry === 0) return false;
        const norm = ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2;
        if (shape.fillColor && shape.fillColor !== 'transparent') {
          return norm <= 1 + margin / Math.min(rx, ry);
        }
        return Math.abs(norm - 1) <= margin / Math.min(rx, ry);
      }
      
      return left || right || top || bottom;
    }
    case 'text': {
      const text = obj as TextObject;
      return (
        px >= text.x &&
        px <= text.x + text.width &&
        py >= text.y &&
        py <= text.y + text.height
      );
    }
    case 'image': {
      const img = obj as ImageObject;
      return (
        px >= img.x &&
        px <= img.x + img.width &&
        py >= img.y &&
        py <= img.y + img.height
      );
    }
    case 'sticky': {
      const sticky = obj as StickyNote;
      return (
        px >= sticky.x &&
        px <= sticky.x + sticky.width &&
        py >= sticky.y &&
        py <= sticky.y + sticky.height
      );
    }
    default:
      return false;
  }
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

// Get bounding box for an object
export function getBoundingBox(obj: BoardObject): { x: number; y: number; width: number; height: number } {
  switch (obj.type) {
    case 'stroke': {
      const stroke = obj as Stroke;
      if (stroke.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of stroke.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case 'shape':
    case 'text':
    case 'image':
    case 'sticky':
      return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

// Smooth a stroke's points
export function smoothStroke(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const smoothed: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    smoothed.push({
      x: curr.x * 0.5 + prev.x * 0.25 + next.x * 0.25,
      y: curr.y * 0.5 + prev.y * 0.25 + next.y * 0.25,
      pressure: curr.pressure,
    });
  }
  smoothed.push(points[points.length - 1]);
  return smoothed;
}

// Export board as JSON
export function exportAsJSON(board: any): string {
  return JSON.stringify(board, null, 2);
}

// Import board from JSON
export function importFromJSON(json: string): any | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Convert canvas to data URL
export function canvasToDataURL(canvas: HTMLCanvasElement, format: string = 'image/png'): string {
  return canvas.toDataURL(format);
}

// Download file helper
export function downloadFile(data: string | Blob, filename: string, mimeType?: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
