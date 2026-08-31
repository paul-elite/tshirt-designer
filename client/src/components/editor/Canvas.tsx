import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '../../stores/editorStore';
import { addEditorLayers, CANVAS_HEIGHT, CANVAS_WIDTH, isEditorLayer } from '../../utils/canvasArtwork';

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

    addEditorLayers(fabricCanvas, color);

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
      if (obj && !isEditorLayer(obj)) {
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

    addEditorLayers(canvas, color);
  }, [canvas, color]);

  // Handle zoom
  useEffect(() => {
    if (!canvas) return;

    canvas.setZoom(zoom);
    canvas.setWidth(CANVAS_WIDTH * zoom);
    canvas.setHeight(CANVAS_HEIGHT * zoom);
    canvas.renderAll();
  }, [canvas, zoom]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeObject) {
        if (!isEditorLayer(activeObject)) {
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
