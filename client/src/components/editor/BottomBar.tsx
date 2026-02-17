import { Undo2, Redo2, ZoomIn, ZoomOut, Save, ShoppingCart } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import Button from '../ui/Button';

interface BottomBarProps {
  onSave: () => void;
  onAddToCart: () => void;
}

export default function BottomBar({ onSave, onAddToCart }: BottomBarProps) {
  const { canUndo, canRedo, undo, redo, zoom, setZoom, isDirty, designName } = useEditorStore();

  return (
    <div className="h-16 bg-white border-t flex items-center justify-between px-4">
      {/* Left - Design name */}
      <div className="flex items-center space-x-2">
        <span className="text-gray-600 font-medium">{designName}</span>
        {isDirty && <span className="text-xs text-gray-400">(unsaved)</span>}
      </div>

      {/* Center - History and Zoom */}
      <div className="flex items-center space-x-4">
        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-5 w-5" />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Zoom */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            disabled={zoom <= 0.5}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600 w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            disabled={zoom >= 2}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center space-x-3">
        <Button variant="outline" onClick={onSave} leftIcon={<Save className="h-4 w-4" />}>
          Save Design
        </Button>
        <Button onClick={onAddToCart} leftIcon={<ShoppingCart className="h-4 w-4" />}>
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
