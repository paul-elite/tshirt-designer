import { useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '../../stores/editorStore';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 480;
const PRINT_AREA = {
  x: 80,
  y: 80,
  width: 240,
  height: 300,
};

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    canvas,
    setCanvas,
    setSelectedObject,
    saveHistory,
    zoom,
    color,
    currentView,
  } = useEditorStore();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#f3f4f6',
      selection: true,
      preserveObjectStacking: true,
    });

    // Add t-shirt mockup background
    drawTShirtMockup(fabricCanvas, color);

    // Add print area guide
    const printArea = new fabric.Rect({
      left: PRINT_AREA.x,
      top: PRINT_AREA.y,
      width: PRINT_AREA.width,
      height: PRINT_AREA.height,
      fill: 'transparent',
      stroke: '#94a3b8',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      name: 'printArea',
    });
    fabricCanvas.add(printArea);

    // Event handlers
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    fabricCanvas.on('object:modified', () => {
      saveHistory();
    });

    fabricCanvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj && obj.name !== 'tshirt' && obj.name !== 'printArea') {
        saveHistory();
      }
    });

    setCanvas(fabricCanvas);

    // Save initial state
    setTimeout(() => saveHistory(), 100);

    return () => {
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, []);

  // Update t-shirt color
  useEffect(() => {
    if (!canvas) return;

    const tshirt = canvas.getObjects().find((obj) => obj.name === 'tshirt');
    if (tshirt) {
      (tshirt as fabric.Rect).set({ fill: color });
      canvas.renderAll();
    }
  }, [canvas, color]);

  // Handle zoom
  useEffect(() => {
    if (!canvas) return;

    canvas.setZoom(zoom);
    canvas.setWidth(CANVAS_WIDTH * zoom);
    canvas.setHeight(CANVAS_HEIGHT * zoom);
    canvas.renderAll();
  }, [canvas, zoom]);

  // Draw t-shirt mockup
  const drawTShirtMockup = (fabricCanvas: fabric.Canvas, shirtColor: string) => {
    // Simple t-shirt shape using a rectangle for now
    // In production, you'd use an SVG or image
    const tshirt = new fabric.Rect({
      left: 40,
      top: 40,
      width: 320,
      height: 400,
      rx: 20,
      ry: 20,
      fill: shirtColor,
      stroke: '#d1d5db',
      strokeWidth: 2,
      selectable: false,
      evented: false,
      name: 'tshirt',
    });

    // Neckline
    const neckline = new fabric.Ellipse({
      left: 160,
      top: 40,
      rx: 40,
      ry: 25,
      fill: '#f3f4f6',
      stroke: '#d1d5db',
      strokeWidth: 2,
      selectable: false,
      evented: false,
      name: 'tshirt',
    });

    fabricCanvas.add(tshirt);
    fabricCanvas.add(neckline);
    tshirt.sendToBack();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeObject) {
        if (activeObject.name !== 'tshirt' && activeObject.name !== 'printArea') {
          canvas.remove(activeObject);
          canvas.renderAll();
          saveHistory();
        }
      }

      // Copy (Ctrl/Cmd + C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && activeObject) {
        activeObject.clone((cloned: fabric.Object) => {
          (canvas as any)._clipboard = cloned;
        });
      }

      // Paste (Ctrl/Cmd + V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && (canvas as any)._clipboard) {
        (canvas as any)._clipboard.clone((cloned: fabric.Object) => {
          canvas.discardActiveObject();
          cloned.set({
            left: (cloned.left || 0) + 10,
            top: (cloned.top || 0) + 10,
            evented: true,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
          saveHistory();
        });
      }

      // Undo (Ctrl/Cmd + Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      }

      // Redo (Ctrl/Cmd + Shift + Z)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, saveHistory]);

  return (
    <div
      ref={containerRef}
      className="relative bg-white rounded-xl shadow-lg p-4"
      style={{ transform: `scale(${1})` }}
    >
      {/* View indicator */}
      <div className="absolute top-2 left-2 bg-gray-900/75 text-white text-xs px-2 py-1 rounded">
        {currentView === 'front' ? 'Front' : 'Back'}
      </div>

      <canvas ref={canvasRef} />
    </div>
  );
}
