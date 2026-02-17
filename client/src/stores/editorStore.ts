import { create } from 'zustand';
import type { fabric } from 'fabric';
import type {
  TShirtSize,
  TShirtStyle,
  TShirtMaterial,
  PrintArea,
  TShirtColor,
  TSHIRT_COLORS,
} from '../types';
import { BASE_PRICE, TSHIRT_STYLES, TSHIRT_MATERIALS, PRINT_AREAS } from '../types';

interface HistoryState {
  past: string[];
  future: string[];
}

interface EditorState {
  // Canvas
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas | null) => void;

  // Design
  designId: string | null;
  designName: string;
  isDirty: boolean;
  setDesignId: (id: string | null) => void;
  setDesignName: (name: string) => void;
  setIsDirty: (dirty: boolean) => void;

  // View
  currentView: 'front' | 'back';
  frontCanvasData: string | null;
  backCanvasData: string | null;
  setCurrentView: (view: 'front' | 'back') => void;
  saveCurrentViewData: () => void;
  loadViewData: (view: 'front' | 'back') => void;

  // T-shirt options
  size: TShirtSize;
  color: string;
  colorName: string;
  style: TShirtStyle;
  material: TShirtMaterial;
  printArea: PrintArea;
  setSize: (size: TShirtSize) => void;
  setColor: (hex: string, name: string) => void;
  setStyle: (style: TShirtStyle) => void;
  setMaterial: (material: TShirtMaterial) => void;
  setPrintArea: (area: PrintArea) => void;

  // Pricing
  calculatePrice: () => number;

  // Selection
  selectedObject: fabric.Object | null;
  setSelectedObject: (obj: fabric.Object | null) => void;

  // History (undo/redo)
  history: HistoryState;
  canUndo: boolean;
  canRedo: boolean;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Zoom
  zoom: number;
  setZoom: (zoom: number) => void;

  // Tool
  activeTool: 'select' | 'text' | 'image' | 'shape' | 'ai';
  setActiveTool: (tool: 'select' | 'text' | 'image' | 'shape' | 'ai') => void;

  // Reset
  resetEditor: () => void;
}

const initialState = {
  canvas: null,
  designId: null,
  designName: 'Untitled Design',
  isDirty: false,
  currentView: 'front' as const,
  frontCanvasData: null,
  backCanvasData: null,
  size: 'M' as TShirtSize,
  color: '#FFFFFF',
  colorName: 'White',
  style: 'crew_neck' as TShirtStyle,
  material: 'cotton' as TShirtMaterial,
  printArea: 'front' as PrintArea,
  selectedObject: null,
  history: { past: [], future: [] },
  canUndo: false,
  canRedo: false,
  zoom: 1,
  activeTool: 'select' as const,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setCanvas: (canvas) => set({ canvas }),

  setDesignId: (id) => set({ designId: id }),
  setDesignName: (name) => set({ designName: name, isDirty: true }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  setCurrentView: (view) => {
    const state = get();
    state.saveCurrentViewData();
    set({ currentView: view });
    // Load the data for the new view after state update
    setTimeout(() => get().loadViewData(view), 0);
  },

  saveCurrentViewData: () => {
    const { canvas, currentView } = get();
    if (!canvas) return;

    const data = JSON.stringify(canvas.toJSON(['id']));
    if (currentView === 'front') {
      set({ frontCanvasData: data });
    } else {
      set({ backCanvasData: data });
    }
  },

  loadViewData: (view) => {
    const { canvas, frontCanvasData, backCanvasData } = get();
    if (!canvas) return;

    const data = view === 'front' ? frontCanvasData : backCanvasData;
    if (data) {
      canvas.loadFromJSON(JSON.parse(data), () => {
        canvas.renderAll();
      });
    } else {
      canvas.clear();
      canvas.renderAll();
    }
  },

  setSize: (size) => set({ size, isDirty: true }),
  setColor: (hex, name) => set({ color: hex, colorName: name, isDirty: true }),
  setStyle: (style) => set({ style, isDirty: true }),
  setMaterial: (material) => set({ material, isDirty: true }),
  setPrintArea: (area) => set({ printArea: area, isDirty: true }),

  calculatePrice: () => {
    const { size, style, material, printArea } = get();
    let price = BASE_PRICE;

    const styleOption = TSHIRT_STYLES.find((s) => s.value === style);
    const materialOption = TSHIRT_MATERIALS.find((m) => m.value === material);
    const printOption = PRINT_AREAS.find((p) => p.value === printArea);

    if (styleOption) price += styleOption.priceModifier;
    if (materialOption) price += materialOption.priceModifier;
    if (printOption) price += printOption.priceModifier;

    if (size === '2XL' || size === '3XL') {
      price += 2;
    }

    return Math.round(price * 100) / 100;
  },

  setSelectedObject: (obj) => set({ selectedObject: obj }),

  saveHistory: () => {
    const { canvas, history } = get();
    if (!canvas) return;

    const currentState = JSON.stringify(canvas.toJSON(['id']));
    set({
      history: {
        past: [...history.past, currentState].slice(-50), // Keep last 50 states
        future: [],
      },
      canUndo: true,
      canRedo: false,
      isDirty: true,
    });
  },

  undo: () => {
    const { canvas, history } = get();
    if (!canvas || history.past.length === 0) return;

    const currentState = JSON.stringify(canvas.toJSON(['id']));
    const previousState = history.past[history.past.length - 1];

    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.renderAll();
      set({
        history: {
          past: history.past.slice(0, -1),
          future: [currentState, ...history.future],
        },
        canUndo: history.past.length > 1,
        canRedo: true,
      });
    });
  },

  redo: () => {
    const { canvas, history } = get();
    if (!canvas || history.future.length === 0) return;

    const currentState = JSON.stringify(canvas.toJSON(['id']));
    const nextState = history.future[0];

    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      set({
        history: {
          past: [...history.past, currentState],
          future: history.future.slice(1),
        },
        canUndo: true,
        canRedo: history.future.length > 1,
      });
    });
  },

  clearHistory: () =>
    set({
      history: { past: [], future: [] },
      canUndo: false,
      canRedo: false,
    }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  resetEditor: () => set(initialState),
}));
