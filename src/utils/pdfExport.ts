import { jsPDF } from 'jspdf';
import type { Board, Page, BoardObject, Stroke, BoardShape, TextObject, StickyNote, ImageObject, Point, Settings } from '../types';

// Helper: check if color is dark
function isColorDark(hex: string): boolean {
  if (!hex || hex === 'transparent') return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStrokePath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  thickness: number,
  penType: string
) {
  if (points.length < 2) return;
  
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  
  let alpha = 1;
  let lineWidth = thickness;
  
  switch (penType) {
    case 'marker':
      alpha = 0.8;
      lineWidth = thickness * 1.2;
      break;
    case 'highlighter':
      alpha = 0.35;
      lineWidth = thickness * 2.2;
      break;
    case 'pencil':
      alpha = 0.85;
      lineWidth = thickness * 0.7;
      break;
    case 'thin':
      lineWidth = Math.max(thickness * 0.35, 1);
      break;
  }
  
  ctx.globalAlpha = alpha;
  ctx.lineWidth = lineWidth;
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  
  if (points.length > 1) {
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  
  ctx.stroke();
  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, shape: BoardShape) {
  ctx.save();
  ctx.strokeStyle = shape.strokeColor;
  ctx.lineWidth = shape.strokeWidth;
  
  if (shape.dashed) {
    ctx.setLineDash([shape.strokeWidth * 2, shape.strokeWidth]);
  }
  
  if (shape.fillColor && shape.fillColor !== 'transparent') {
    ctx.fillStyle = shape.fillColor;
  }

  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;

  switch (shape.shapeType) {
    case 'rectangle': {
      const r = Math.min(6, Math.abs(shape.width) / 4, Math.abs(shape.height) / 4);
      roundRect(ctx, shape.x, shape.y, shape.width, shape.height, r);
      if (shape.fillColor && shape.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
      break;
    }
    case 'circle':
    case 'ellipse': {
      const rx = Math.abs(shape.width) / 2;
      const ry = Math.abs(shape.height) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      if (shape.fillColor && shape.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
      break;
    }
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(shape.x, shape.y);
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
      ctx.stroke();
      break;
    }
    case 'arrow': {
      ctx.beginPath();
      ctx.moveTo(shape.x, shape.y);
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
      ctx.stroke();
      const angle = Math.atan2(shape.height, shape.width);
      const headLen = 15;
      ctx.beginPath();
      ctx.moveTo(shape.x + shape.width, shape.y + shape.height);
      ctx.lineTo(
        shape.x + shape.width - headLen * Math.cos(angle - Math.PI / 6),
        shape.y + shape.height - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(shape.x + shape.width, shape.y + shape.height);
      ctx.lineTo(
        shape.x + shape.width - headLen * Math.cos(angle + Math.PI / 6),
        shape.y + shape.height - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      break;
    }
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(cx, shape.y);
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
      ctx.lineTo(shape.x, shape.y + shape.height);
      ctx.closePath();
      if (shape.fillColor && shape.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
      break;
    }
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(cx, shape.y);
      ctx.lineTo(shape.x + shape.width, cy);
      ctx.lineTo(cx, shape.y + shape.height);
      ctx.lineTo(shape.x, cy);
      ctx.closePath();
      if (shape.fillColor && shape.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
      break;
    }
    case 'star': {
      const spikes = 5;
      const outerR = Math.min(Math.abs(shape.width), Math.abs(shape.height)) / 2;
      const innerR = outerR * 0.4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (shape.fillColor && shape.fillColor !== 'transparent') ctx.fill();
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function drawObject(ctx: CanvasRenderingContext2D, obj: BoardObject) {
  ctx.save();
  switch (obj.type) {
    case 'stroke': {
      const stroke = obj as Stroke;
      if (stroke.points.length > 0) {
        drawStrokePath(ctx, stroke.points, stroke.color, stroke.thickness, stroke.penType);
      }
      break;
    }
    case 'shape': {
      drawShape(ctx, obj as BoardShape);
      break;
    }
    case 'text': {
      const text = obj as TextObject;
      ctx.fillStyle = text.color;
      ctx.font = `${text.fontStyle || 'normal'} ${text.fontWeight || 'normal'} ${text.fontSize || 24}px ${text.fontFamily || 'sans-serif'}`;
      ctx.textAlign = text.textAlign || 'left';
      const lines = text.text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, text.x, text.y + (text.fontSize || 24) * (i + 1));
      });
      break;
    }
    case 'sticky': {
      const sticky = obj as StickyNote;
      ctx.fillStyle = sticky.color || '#fff3a8';
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 6;
      roundRect(ctx, sticky.x, sticky.y, sticky.width, sticky.height, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#222';
      ctx.font = `${sticky.fontSize || 16}px sans-serif`;
      ctx.textAlign = 'left';
      const lines = sticky.text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, sticky.x + 10, sticky.y + 24 + (sticky.fontSize || 16) * i);
      });
      break;
    }
    case 'image': {
      const img = obj as ImageObject;
      if (img.src) {
        const imageElement = new Image();
        imageElement.src = img.src;
        try {
          ctx.drawImage(imageElement, img.x, img.y, img.width, img.height);
        } catch {
          ctx.fillStyle = '#eee';
          ctx.fillRect(img.x, img.y, img.width, img.height);
        }
      }
      break;
    }
  }
  ctx.restore();
}

/**
 * Renders a single whiteboard page onto a canvas and returns its data URL.
 */
export async function renderPageToDataUrl(
  page: Page,
  settings: Settings,
  width = 1920,
  height = 1080
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const bgColor = page.backgroundColor || '#000000';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const isDark = isColorDark(bgColor);
  const canvasWidth = 3000;
  const canvasHeight = 2000;

  // Draw background pattern if enabled
  if (settings.canvasBackground === 'dots') {
    ctx.fillStyle = isDark ? '#444' : '#ddd';
    for (let x = 0; x < width; x += 24) {
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (settings.canvasBackground === 'grid') {
    ctx.strokeStyle = isDark ? '#333' : '#e0e0e0';
    ctx.lineWidth = 0.75;
    for (let x = 0; x <= width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Transform to center whiteboard coordinates
  ctx.save();
  ctx.translate(width / 2, height / 2);
  const scaleFactor = Math.min(width / canvasWidth, height / canvasHeight) * 1.35;
  ctx.scale(scaleFactor, scaleFactor);

  // Draw all objects on this page
  for (const obj of page.objects) {
    drawObject(ctx, obj);
  }
  ctx.restore();

  // Draw Slide Header / Footer badge on the slide
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(page.name || 'Whiteboard Slide', 24, height - 20);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Converts ALL slides in a whiteboard into a single, high-quality, multi-page PDF document.
 */
export async function generateBoardPDF(
  board: Board,
  settings: Settings,
  onProgress?: (current: number, total: number) => void,
  customTitle?: string
): Promise<{ pdf: jsPDF; blob: Blob; filename: string; pageCount: number }> {
  const width = 1920;
  const height = 1080;
  const total = board.pages.length;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [width, height],
    compress: true,
  });

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const page = board.pages[i];
    const dataUrl = await renderPageToDataUrl(page, settings, width, height);

    if (i > 0) {
      pdf.addPage([width, height], 'landscape');
    }

    pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST');
  }

  const rawName = (customTitle?.trim() || board.name || 'Whiteboard_Notes').trim();
  const cleanBase = rawName.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'Whiteboard_Notes';
  const filename = cleanBase.toLowerCase().endsWith('.pdf') ? cleanBase : `${cleanBase}.pdf`;
  const blob = pdf.output('blob');

  return {
    pdf,
    blob,
    filename,
    pageCount: total,
  };
}

/**
 * Triggers an instant download of all slides as a unified multi-page PDF.
 */
export async function downloadBoardAsPDF(
  board: Board,
  settings: Settings,
  onProgress?: (current: number, total: number) => void,
  customTitle?: string
): Promise<string> {
  const { pdf, filename } = await generateBoardPDF(board, settings, onProgress, customTitle);
  pdf.save(filename);
  return filename;
}

