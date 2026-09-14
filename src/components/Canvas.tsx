import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useWhiteboardStore } from '../store/useStore';
import { hitTest, getBoundingBox, smoothStroke } from '../utils/canvas';
import type { Point, Stroke, BoardShape, TextObject, ImageObject, StickyNote, BoardObject } from '../types';
import { v4 as uuidv4 } from 'uuid';

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<Point>({ x: 0, y: 0 });
  const currentStroke = useRef<Point[]>([]);
  const dragStart = useRef<Point | null>(null);
  const dragOffsets = useRef<Map<string, Point>>(new Map());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);

  const {
    currentTool,
    penType,
    penColor,
    penThickness,
    eraserSize,
    shapeType,
    selectedObjectIds,
    viewTransform,
    currentPageIndex,
    board,
    setSelectedObjects,
    addObject,
    updateObject,
    deleteObjects,
    setViewTransform,
    pushHistory,
    settings,
  } = useWhiteboardStore();

  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [shapePreview, setShapePreview] = useState<BoardShape | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);

  // Helper: check if a hex color is dark
  const isColorDark = (hex: string): boolean => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  // Convert screen coords to canvas coords
  const screenToCanvas = useCallback((sx: number, sy: number): Point => {
    return {
      x: (sx - viewTransform.offsetX) / viewTransform.zoom,
      y: (sy - viewTransform.offsetY) / viewTransform.zoom,
    };
  }, [viewTransform]);

  // Resize canvas
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#292A2E';
    ctx.fillRect(0, 0, w, h);

    // Apply view transform
    ctx.save();
    ctx.translate(viewTransform.offsetX, viewTransform.offsetY);
    ctx.scale(viewTransform.zoom, viewTransform.zoom);

    // Draw canvas area
    const canvasWidth = 3000;
    const canvasHeight = 2000;
    const page = board.pages[currentPageIndex];
    const bgColor = page?.backgroundColor || '#000000';
    ctx.fillStyle = bgColor;
    // Shadow only visible against non-matching background
    const isDark = isColorDark(bgColor);
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20;
    ctx.fillRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
    ctx.shadowBlur = 0;

    // Draw grid dots if setting
    if (settings.canvasBackground === 'dots') {
      ctx.fillStyle = isDark ? '#555' : '#ddd';
      for (let x = -canvasWidth / 2; x < canvasWidth / 2; x += 20) {
        for (let y = -canvasHeight / 2; y < canvasHeight / 2; y += 20) {
          ctx.beginPath();
          ctx.arc(x, y, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (settings.canvasBackground === 'grid') {
      ctx.strokeStyle = isDark ? '#444' : '#e8e8e8';
      ctx.lineWidth = 0.5;
      for (let x = -canvasWidth / 2; x <= canvasWidth / 2; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, -canvasHeight / 2);
        ctx.lineTo(x, canvasHeight / 2);
        ctx.stroke();
      }
      for (let y = -canvasHeight / 2; y <= canvasHeight / 2; y += 20) {
        ctx.beginPath();
        ctx.moveTo(-canvasWidth / 2, y);
        ctx.lineTo(canvasWidth / 2, y);
        ctx.stroke();
      }
    }

    // Clip to canvas area
    ctx.save();
    ctx.beginPath();
    ctx.rect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
    ctx.clip();

    if (page) {
      // Draw objects
      for (const obj of page.objects) {
        drawObject(ctx, obj);
      }
    }

    // Draw shape preview
    if (shapePreview) {
      drawObject(ctx, shapePreview);
    }

    // Draw current stroke
    if (isDrawing.current && currentTool === 'pen' && currentStroke.current.length > 1) {
      drawStrokePath(ctx, currentStroke.current, penColor, penThickness, penType);
    }

    ctx.restore();

    // Draw selection boxes
    if (selectedObjectIds.length > 0 && page) {
      for (const id of selectedObjectIds) {
        const obj = page.objects.find((o) => o.id === id);
        if (obj) {
          drawSelectionBox(ctx, obj);
        }
      }
    }

    // Draw selection rectangle
    if (selectionBox) {
      ctx.strokeStyle = '#4A90D9';
      ctx.lineWidth = 1 / viewTransform.zoom;
      ctx.setLineDash([4 / viewTransform.zoom, 4 / viewTransform.zoom]);
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [board, currentPageIndex, viewTransform, selectedObjectIds, currentTool, penColor, penThickness, penType, shapePreview, selectionBox, settings]);

  // Render loop with requestAnimationFrame
  useEffect(() => {
    const loop = () => {
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  // Draw a single object
  const drawObject = (ctx: CanvasRenderingContext2D, obj: BoardObject) => {
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
        ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
        ctx.textAlign = text.textAlign;
        const lines = text.text.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, text.x, text.y + text.fontSize * (i + 1));
        });
        break;
      }
      case 'sticky': {
        const sticky = obj as StickyNote;
        ctx.fillStyle = sticky.color;
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 4;
        roundRect(ctx, sticky.x, sticky.y, sticky.width, sticky.height, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#333';
        ctx.font = `${sticky.fontSize}px sans-serif`;
        ctx.textAlign = 'left';
        const lines = sticky.text.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, sticky.x + 8, sticky.y + 20 + sticky.fontSize * i);
        });
        break;
      }
      case 'image': {
        const img = obj as ImageObject;
        // placeholder
        ctx.fillStyle = '#eee';
        ctx.fillRect(img.x, img.y, img.width, img.height);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(img.x, img.y, img.width, img.height);
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Image', img.x + img.width / 2, img.y + img.height / 2);
        break;
      }
    }
    ctx.restore();
  };

  const drawStrokePath = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    color: string,
    thickness: number,
    penType: string
  ) => {
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
        alpha = 0.3;
        lineWidth = thickness * 2;
        break;
      case 'pencil':
        alpha = 0.85;
        lineWidth = thickness * 0.7;
        break;
      case 'thin':
        lineWidth = Math.max(thickness * 0.3, 1);
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
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: BoardShape) => {
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
      case 'circle': {
        const rx = Math.abs(shape.width) / 2;
        const ry = Math.abs(shape.height) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (shape.fillColor && shape.fillColor !== 'transparent') ctx.fill();
        ctx.stroke();
        break;
      }
      case 'ellipse': {
        const rx = Math.abs(shape.width) / 2;
        const ry = Math.abs(shape.height) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
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
        // Arrowhead
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
    ctx.setLineDash([]);
    ctx.restore();
  };

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, obj: BoardObject) => {
    const box = getBoundingBox(obj);
    const pad = 6;
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 1.5 / viewTransform.zoom;
    ctx.setLineDash([]);
    ctx.strokeRect(
      box.x - pad,
      box.y - pad,
      box.width + pad * 2,
      box.height + pad * 2
    );

    // Draw corner handles
    const handleSize = 6 / viewTransform.zoom;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 1.5 / viewTransform.zoom;
    const corners = [
      [box.x - pad, box.y - pad],
      [box.x + box.width + pad, box.y - pad],
      [box.x - pad, box.y + box.height + pad],
      [box.x + box.width + pad, box.y + box.height + pad],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    }
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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
  };

  // Get eraser radius
  const getEraserRadius = () => {
    switch (eraserSize) {
      case 'small': return 10;
      case 'medium': return 20;
      case 'large': return 40;
    }
  };

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const point = screenToCanvas(sx, sy);

    canvas.setPointerCapture(e.pointerId);

    if (currentTool === 'hand' || e.button === 1) {
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (currentTool === 'pen') {
      isDrawing.current = true;
      currentStroke.current = [{ ...point, pressure: e.pressure }];
      return;
    }

    if (currentTool === 'eraser') {
      pushHistory();
      const page = board.pages[currentPageIndex];
      if (!page) return;
      const radius = getEraserRadius();
      const toDelete: string[] = [];
      for (const obj of page.objects) {
        if (hitTest(obj, point, radius)) {
          toDelete.push(obj.id);
        }
      }
      if (toDelete.length > 0) {
        deleteObjects(toDelete);
      }
      return;
    }

    if (currentTool === 'select') {
      // Check if clicking on an object
      const page = board.pages[currentPageIndex];
      if (!page) return;
      
      let found = false;
      for (let i = page.objects.length - 1; i >= 0; i--) {
        const obj = page.objects[i];
        if (hitTest(obj, point, 8)) {
          if (e.shiftKey) {
            // Toggle selection
            const newIds = selectedObjectIds.includes(obj.id)
              ? selectedObjectIds.filter((id) => id !== obj.id)
              : [...selectedObjectIds, obj.id];
            setSelectedObjects(newIds);
          } else if (!selectedObjectIds.includes(obj.id)) {
            setSelectedObjects([obj.id]);
          }
          
          // Start drag
          dragStart.current = { x: point.x, y: point.y };
          dragOffsets.current = new Map();
          for (const id of selectedObjectIds.includes(obj.id) ? selectedObjectIds : [obj.id]) {
            const o = page.objects.find((obj) => obj.id === id);
            if (o) {
              dragOffsets.current.set(id, { x: o.x - point.x, y: o.y - point.y });
            }
          }
          isDrawing.current = true;
          found = true;
          break;
        }
      }
      
      if (!found) {
        // Start selection rectangle
        setSelectedObjects([]);
        dragStart.current = point;
        isDrawing.current = true;
      }
      return;
    }

    if (currentTool === 'text') {
      pushHistory();
      const textObj: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: point.x,
        y: point.y - 15,
        text: 'Type here...',
        fontSize: 16,
        fontFamily: 'sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        color: penColor,
        width: 200,
        height: 24,
        timestamp: Date.now(),
      };
      addObject(textObj);
      setEditingText(textObj.id);
      return;
    }

    if (currentTool === 'shape') {
      isDrawing.current = true;
      dragStart.current = point;
      const shape: BoardShape = {
        id: uuidv4(),
        type: 'shape',
        shapeType,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor: penColor,
        strokeWidth: penThickness,
        fillColor: null,
        dashed: false,
        rotation: 0,
        timestamp: Date.now(),
      };
      setShapePreview(shape);
      return;
    }
  }, [currentTool, screenToCanvas, board, currentPageIndex, selectedObjectIds, penColor, penThickness, shapeType, eraserSize]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const point = screenToCanvas(sx, sy);

    if (isPanning.current) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setViewTransform({
        offsetX: viewTransform.offsetX + dx,
        offsetY: viewTransform.offsetY + dy,
      });
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (currentTool === 'pen' && isDrawing.current) {
      currentStroke.current.push({ ...point, pressure: e.pressure });
      return;
    }

    if (currentTool === 'eraser' && e.buttons === 1) {
      const page = board.pages[currentPageIndex];
      if (!page) return;
      const radius = getEraserRadius();
      const toDelete: string[] = [];
      for (const obj of page.objects) {
        if (hitTest(obj, point, radius)) {
          toDelete.push(obj.id);
        }
      }
      if (toDelete.length > 0) {
        deleteObjects(toDelete);
      }
      return;
    }

    if (currentTool === 'select' && isDrawing.current) {
      const page = board.pages[currentPageIndex];
      if (!page) return;
      
      if (dragStart.current && dragOffsets.current.size > 0) {
        // Move selected objects
        for (const [id, offset] of dragOffsets.current) {
          updateObject(id, {
            x: point.x + offset.x,
            y: point.y + offset.y,
          });
        }
      } else if (dragStart.current) {
        // Selection rectangle
        const sx = Math.min(dragStart.current.x, point.x);
        const sy = Math.min(dragStart.current.y, point.y);
        const ex = Math.max(dragStart.current.x, point.x);
        const ey = Math.max(dragStart.current.y, point.y);
        setSelectionBox({ x: sx, y: sy, w: ex - sx, h: ey - sy });
        
        // Select objects within box
        const ids: string[] = [];
        for (const obj of page.objects) {
          const box = getBoundingBox(obj);
          if (box.x >= sx && box.y >= sy && box.x + box.width <= ex && box.y + box.height <= ey) {
            ids.push(obj.id);
          }
        }
        setSelectedObjects(ids);
      }
      return;
    }

    if (currentTool === 'shape' && isDrawing.current && dragStart.current) {
      const w = point.x - dragStart.current.x;
      const h = point.y - dragStart.current.y;
      setShapePreview((prev) => {
        if (!prev) return null;
        return { ...prev, width: w, height: h };
      });
      return;
    }
  }, [currentTool, screenToCanvas, viewTransform, board, currentPageIndex, eraserSize]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }

    if (isPanning.current) {
      isPanning.current = false;
      return;
    }

    if (currentTool === 'pen' && isDrawing.current) {
      isDrawing.current = false;
      if (currentStroke.current.length > 1) {
        pushHistory();
        const smoothed = smoothStroke(currentStroke.current);
        const stroke: Stroke = {
          id: uuidv4(),
          type: 'stroke',
          points: smoothed,
          color: penColor,
          thickness: penThickness,
          penType,
          opacity: 1,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          timestamp: Date.now(),
        };
        addObject(stroke);
      }
      currentStroke.current = [];
      return;
    }

    if (currentTool === 'select') {
      isDrawing.current = false;
      dragStart.current = null;
      dragOffsets.current = new Map();
      setSelectionBox(null);
      return;
    }

    if (currentTool === 'shape' && isDrawing.current) {
      isDrawing.current = false;
      if (shapePreview && (Math.abs(shapePreview.width) > 2 || Math.abs(shapePreview.height) > 2)) {
        pushHistory();
        addObject(shapePreview);
      }
      setShapePreview(null);
      return;
    }
  }, [currentTool, penColor, penThickness, penType, shapePreview]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.001;
      const newZoom = Math.max(0.1, Math.min(5, viewTransform.zoom + delta * viewTransform.zoom));
      const scale = newZoom / viewTransform.zoom;
      setViewTransform({
        zoom: newZoom,
        offsetX: mx - (mx - viewTransform.offsetX) * scale,
        offsetY: my - (my - viewTransform.offsetY) * scale,
      });
    } else {
      setViewTransform({
        offsetX: viewTransform.offsetX - e.deltaX,
        offsetY: viewTransform.offsetY - e.deltaY,
      });
    }
  }, [viewTransform]);

  // Touch pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoom.current = viewTransform.zoom;
    }
  }, [viewTransform.zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartDist.current;
      const newZoom = Math.max(0.1, Math.min(5, pinchStartZoom.current * scale));
      
      setViewTransform({
        zoom: newZoom,
      });
    }
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingText) return;
      
      const ctrl = e.ctrlKey || e.metaKey;
      
      if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useWhiteboardStore.getState().redo();
        } else {
          useWhiteboardStore.getState().undo();
        }
        return;
      }
      
      if (ctrl && e.key === 's') {
        e.preventDefault();
        // Auto-save triggers
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectIds.length > 0) {
          e.preventDefault();
          pushHistory();
          deleteObjects(selectedObjectIds);
        }
        return;
      }
      
      if (ctrl && e.key === 'c') {
        // Copy
        return;
      }
      
      if (ctrl && e.key === 'v') {
        // Paste
        return;
      }
      
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        if (selectedObjectIds.length > 0) {
          useWhiteboardStore.getState().duplicateObjects(selectedObjectIds);
        }
        return;
      }
      
      if (e.key === 'Escape') {
        setSelectedObjects([]);
        useWhiteboardStore.getState().setShowPenSettings(false);
        useWhiteboardStore.getState().setShowEraserSettings(false);
        useWhiteboardStore.getState().setShowShapeMenu(false);
        useWhiteboardStore.getState().setShowInsertMenu(false);
        useWhiteboardStore.getState().setShowMainMenu(false);
        return;
      }
      
      // Tool shortcuts
      if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case 'p': useWhiteboardStore.getState().setCurrentTool('pen'); break;
          case 'e': useWhiteboardStore.getState().setCurrentTool('eraser'); break;
          case 'v': useWhiteboardStore.getState().setCurrentTool('select'); break;
          case 'h': useWhiteboardStore.getState().setCurrentTool('hand'); break;
          case 'r': useWhiteboardStore.getState().setCurrentTool('shape'); useWhiteboardStore.getState().setShapeType('rectangle'); break;
          case 'c': useWhiteboardStore.getState().setCurrentTool('shape'); useWhiteboardStore.getState().setShapeType('circle'); break;
          case 'l': useWhiteboardStore.getState().setCurrentTool('shape'); useWhiteboardStore.getState().setShapeType('line'); break;
          case 't': useWhiteboardStore.getState().setCurrentTool('text'); break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectIds, editingText]);

  // Center the canvas initially
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setViewTransform({
      offsetX: rect.width / 2,
      offsetY: rect.height / 2,
      zoom: 0.8,
    });
  }, []);

  const getCursor = () => {
    switch (currentTool) {
      case 'pen': return 'crosshair';
      case 'eraser': return 'crosshair';
      case 'select': return 'default';
      case 'shape': return 'crosshair';
      case 'hand': return isPanning.current ? 'grabbing' : 'grab';
      case 'text': return 'text';
      default: return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor: getCursor(),
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          display: 'block',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

export default Canvas;
