import { fabric } from 'fabric';

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 480;
export const PRINT_AREA = {
  x: 80,
  y: 80,
  width: 240,
  height: 300,
};

export const EDITOR_LAYER_NAMES = ['tshirt', 'printArea'];

export const CANVAS_EXTRA_PROPS = [
  'id',
  'name',
  'textEffect',
  'effectStrength',
  'baseScaleX',
  'baseScaleY',
  'stroke',
  'strokeWidth',
  'shadow',
  'extrudeEnabled',
  'extrudeColor',
  'extrudeDepth',
  'charSpacing',
  'lineHeight',
  'path',
  'pathSide',
  'pathAlign',
  'pathStartOffset',
  'excludeFromExport',
];

export type TextEffect =
  | 'none'
  | 'archUp'
  | 'archDown'
  | 'wave'
  | 'bulge'
  | 'pinch'
  | 'slantLeft'
  | 'slantRight'
  | 'perspective';

export const isEditorLayer = (obj: fabric.Object | { name?: string }) =>
  EDITOR_LAYER_NAMES.includes(String(obj.name ?? ''));

export function getArtworkJSON(canvas: fabric.Canvas) {
  const json = canvas.toJSON(CANVAS_EXTRA_PROPS) as unknown as fabric.ICanvasOptions & {
    objects?: Array<Record<string, unknown>>;
  };

  return {
    ...json,
    objects: (json.objects ?? []).filter((obj) => !isEditorLayer(obj)),
  };
}

export function hasArtwork(canvas: fabric.Canvas) {
  return canvas.getObjects().some((obj) => !isEditorLayer(obj));
}

export function exportArtworkSvg(canvas: fabric.Canvas) {
  const objects = canvas.getObjects();
  const previousVisibility = objects.map((obj) => ({
    obj,
    visible: obj.visible,
  }));

  objects.forEach((obj) => {
    if (isEditorLayer(obj)) {
      obj.set('visible', false);
    }
  });

  const svg = canvas.toSVG();

  previousVisibility.forEach(({ obj, visible }) => {
    obj.set('visible', visible);
  });
  canvas.renderAll();

  return svg;
}

export function downloadArtworkSvg(canvas: fabric.Canvas, fileName = 't-shirt-artwork.svg') {
  const svg = exportArtworkSvg(canvas);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function addEditorLayers(canvas: fabric.Canvas, shirtColor: string) {
  canvas.getObjects().forEach((obj) => {
    if (isEditorLayer(obj)) {
      canvas.remove(obj);
    }
  });

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
    excludeFromExport: true,
  });

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
    excludeFromExport: true,
  });

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
    excludeFromExport: true,
  });

  canvas.add(tshirt);
  canvas.add(neckline);
  canvas.add(printArea);
  tshirt.sendToBack();
  neckline.sendToBack();
  canvas.renderAll();
}

export function applyTextEffect(textObj: fabric.IText, effect: TextEffect, strength: number) {
  const obj = textObj as fabric.IText & {
    textEffect?: TextEffect;
    effectStrength?: number;
    baseScaleX?: number;
    baseScaleY?: number;
    path?: fabric.Path;
    pathAlign?: string;
    pathSide?: string;
    pathStartOffset?: number;
    skewX?: number;
  };
  const baseScaleX = obj.baseScaleX ?? obj.scaleX ?? 1;
  const baseScaleY = obj.baseScaleY ?? obj.scaleY ?? 1;

  obj.set({
    path: undefined,
    pathAlign: 'center',
    pathSide: 'left',
    pathStartOffset: 0,
    skewX: 0,
    scaleX: baseScaleX,
    scaleY: baseScaleY,
  } as Record<string, unknown>);

  if (effect === 'archUp' || effect === 'archDown' || effect === 'wave') {
    const bend = effect === 'archDown' ? Math.abs(strength) : -Math.abs(strength);
    const path =
      effect === 'wave'
        ? `M 0 45 C 60 ${45 + strength}, 110 ${45 - strength}, 170 45 C 225 ${
            45 + strength
          }, 285 ${45 - strength}, 340 45`
        : `M 0 60 Q 170 ${60 + bend * 1.4} 340 60`;

    obj.set({
      path: new fabric.Path(path, { visible: false }),
      pathAlign: 'center',
      pathStartOffset: 0,
    } as Record<string, unknown>);
  }

  if (effect === 'bulge') {
    obj.set({
      scaleX: baseScaleX * (1 + Math.abs(strength) / 120),
      scaleY: baseScaleY * Math.max(0.55, 1 - Math.abs(strength) / 220),
    });
  }

  if (effect === 'pinch') {
    obj.set({
      scaleX: baseScaleX * Math.max(0.55, 1 - Math.abs(strength) / 180),
      scaleY: baseScaleY * (1 + Math.abs(strength) / 260),
    });
  }

  if (effect === 'slantLeft' || effect === 'slantRight' || effect === 'perspective') {
    const direction = effect === 'slantLeft' ? -1 : 1;
    obj.set({
      skewX: effect === 'perspective' ? strength / 2 : direction * Math.abs(strength),
      scaleY: effect === 'perspective' ? baseScaleY * 0.88 : baseScaleY,
    });
  }

  obj.textEffect = effect;
  obj.effectStrength = strength;
  obj.baseScaleX = baseScaleX;
  obj.baseScaleY = baseScaleY;
  obj.setCoords();
}
