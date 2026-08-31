import { useEffect, useState } from 'react';
import { fabric } from 'fabric';
import {
  Trash2,
  Copy,
  FlipVertical,
  FlipHorizontal,
  ArrowUp,
  ArrowDown,
  Sun,
  Contrast,
  Droplets,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { applyTextEffect, TextEffect } from '../../utils/canvasArtwork';
import {
  TSHIRT_COLORS,
  TSHIRT_SIZES,
  TSHIRT_STYLES,
  TSHIRT_MATERIALS,
  PRINT_AREAS,
} from '../../types';

const FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS',
];

const TEXT_EFFECTS: { value: TextEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'archUp', label: 'Arch Up' },
  { value: 'archDown', label: 'Arch Down' },
  { value: 'wave', label: 'Wave' },
  { value: 'bulge', label: 'Bulge' },
  { value: 'pinch', label: 'Pinch' },
  { value: 'slantLeft', label: 'Slant Left' },
  { value: 'slantRight', label: 'Slant Right' },
  { value: 'perspective', label: 'Perspective' },
];

export default function PropertyPanel() {
  const {
    canvas,
    selectedObject,
    saveHistory,
    size,
    color,
    colorName,
    style,
    material,
    printArea,
    currentView,
    setSize,
    setColor,
    setStyle,
    setMaterial,
    setPrintArea,
    setCurrentView,
    calculatePrice,
  } = useEditorStore();

  const [textProps, setTextProps] = useState({
    text: '',
    fontSize: 32,
    fontFamily: 'Arial',
    fill: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    charSpacing: 0,
    lineHeight: 1,
    textEffect: 'none' as TextEffect,
    effectStrength: 32,
    stroke: '#ffffff',
    strokeWidth: 0,
    shadowEnabled: false,
    shadowColor: '#111111',
    shadowOffsetX: 8,
    shadowOffsetY: 8,
    shadowBlur: 4,
    extrudeEnabled: false,
    extrudeColor: '#ef4444',
    extrudeDepth: 8,
  });

  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });

  // Update text props when selection changes
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'i-text') {
      const textObj = selectedObject as fabric.IText & {
        textEffect?: TextEffect;
        effectStrength?: number;
        stroke?: string;
        strokeWidth?: number;
        shadow?: fabric.Shadow | string | null;
        extrudeEnabled?: boolean;
        extrudeColor?: string;
        extrudeDepth?: number;
      };
      const shadow =
        textObj.shadow && typeof textObj.shadow !== 'string' ? textObj.shadow : undefined;
      setTextProps({
        text: textObj.text || '',
        fontSize: textObj.fontSize || 32,
        fontFamily: textObj.fontFamily || 'Arial',
        fill: (textObj.fill as string) || '#000000',
        fontWeight: (textObj.fontWeight as string) || 'normal',
        fontStyle: (textObj.fontStyle as string) || 'normal',
        underline: textObj.underline || false,
        charSpacing: textObj.charSpacing || 0,
        lineHeight: textObj.lineHeight || 1,
        textEffect: textObj.textEffect || 'none',
        effectStrength: textObj.effectStrength || 32,
        stroke: textObj.stroke || '#ffffff',
        strokeWidth: textObj.strokeWidth || 0,
        shadowEnabled: Boolean(textObj.shadow) && !textObj.extrudeEnabled,
        shadowColor: shadow?.color || '#111111',
        shadowOffsetX: shadow?.offsetX || 8,
        shadowOffsetY: shadow?.offsetY || 8,
        shadowBlur: shadow?.blur || 4,
        extrudeEnabled: Boolean(textObj.extrudeEnabled),
        extrudeColor: textObj.extrudeColor || '#ef4444',
        extrudeDepth: textObj.extrudeDepth || 8,
      });
    }
  }, [selectedObject]);

  const updateTextProperty = (prop: string, value: unknown) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'i-text') return;

    (selectedObject as fabric.IText).set(prop as keyof fabric.IText, value as never);
    canvas.renderAll();
    saveHistory();

    setTextProps((prev) => ({ ...prev, [prop]: value }));
  };

  const updateTextEffect = (effect: TextEffect, strength = textProps.effectStrength) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'i-text') return;

    applyTextEffect(selectedObject as fabric.IText, effect, strength);
    canvas.renderAll();
    saveHistory();
    setTextProps((prev) => ({ ...prev, textEffect: effect, effectStrength: strength }));
  };

  const updateTextShadow = (next: Partial<typeof textProps>) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'i-text') return;

    const props = { ...textProps, ...next };
    const textObj = selectedObject as fabric.IText & {
      extrudeEnabled?: boolean;
      extrudeColor?: string;
      extrudeDepth?: number;
    };

    if (props.extrudeEnabled) {
      textObj.extrudeEnabled = true;
      textObj.extrudeColor = props.extrudeColor;
      textObj.extrudeDepth = props.extrudeDepth;
      textObj.set(
        'shadow',
        new fabric.Shadow({
          color: props.extrudeColor,
          blur: 0,
          offsetX: props.extrudeDepth,
          offsetY: props.extrudeDepth,
        })
      );
    } else if (props.shadowEnabled) {
      textObj.extrudeEnabled = false;
      textObj.set(
        'shadow',
        new fabric.Shadow({
          color: props.shadowColor,
          blur: props.shadowBlur,
          offsetX: props.shadowOffsetX,
          offsetY: props.shadowOffsetY,
        })
      );
    } else {
      textObj.extrudeEnabled = false;
      textObj.set('shadow', undefined);
    }

    canvas.renderAll();
    saveHistory();
    setTextProps(props);
  };

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return;
    if (selectedObject.name === 'tshirt' || selectedObject.name === 'printArea') return;

    canvas.remove(selectedObject);
    canvas.renderAll();
    saveHistory();
  };

  const duplicateSelected = () => {
    if (!canvas || !selectedObject) return;

    selectedObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveHistory();
    });
  };

  const bringForward = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringForward(selectedObject);
    canvas.renderAll();
    saveHistory();
  };

  const sendBackward = () => {
    if (!canvas || !selectedObject) return;
    // Don't send behind t-shirt
    const objects = canvas.getObjects();
    const tshirtIndex = objects.findIndex((obj) => obj.name === 'tshirt');
    const currentIndex = objects.indexOf(selectedObject);
    if (currentIndex > tshirtIndex + 2) {
      canvas.sendBackwards(selectedObject);
      canvas.renderAll();
      saveHistory();
    }
  };

  const flipHorizontal = () => {
    if (!canvas || !selectedObject) return;
    selectedObject.set('flipX', !selectedObject.flipX);
    canvas.renderAll();
    saveHistory();
  };

  const flipVertical = () => {
    if (!canvas || !selectedObject) return;
    selectedObject.set('flipY', !selectedObject.flipY);
    canvas.renderAll();
    saveHistory();
  };

  const applyImageFilter = (type: 'brightness' | 'contrast' | 'saturation', value: number) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'image') return;

    const img = selectedObject as fabric.Image;
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);

    img.filters = [
      new fabric.Image.filters.Brightness({ brightness: newFilters.brightness }),
      new fabric.Image.filters.Contrast({ contrast: newFilters.contrast }),
      new fabric.Image.filters.Saturation({ saturation: newFilters.saturation }),
    ];
    img.applyFilters();
    canvas.renderAll();
  };

  const price = calculatePrice();

  return (
    <div className="w-80 bg-white border-l overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* T-Shirt Options */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">T-Shirt Options</h3>

          {/* View Toggle */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">View</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('front')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'front'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Front
              </button>
              <button
                onClick={() => setCurrentView('back')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'back'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Back
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">Color: {colorName}</label>
            <div className="grid grid-cols-6 gap-2">
              {TSHIRT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex, c.name)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c.hex ? 'border-primary-600 scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">Size</label>
            <div className="flex flex-wrap gap-2">
              {TSHIRT_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    size === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as typeof style)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {TSHIRT_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} {s.priceModifier > 0 && `(+$${s.priceModifier})`}
                </option>
              ))}
            </select>
          </div>

          {/* Material */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">Material</label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value as typeof material)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {TSHIRT_MATERIALS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}{' '}
                  {m.priceModifier !== 0 &&
                    `(${m.priceModifier > 0 ? '+' : ''}$${m.priceModifier})`}
                </option>
              ))}
            </select>
          </div>

          {/* Print Area */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">Print Area</label>
            <select
              value={printArea}
              onChange={(e) => setPrintArea(e.target.value as typeof printArea)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PRINT_AREAS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} {p.priceModifier > 0 && `(+$${p.priceModifier})`}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price per shirt</span>
              <span className="text-xl font-bold text-gray-900">${price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Selected Object Properties */}
        {selectedObject && selectedObject.name !== 'tshirt' && selectedObject.name !== 'printArea' && (
          <>
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Object Actions</h3>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={duplicateSelected}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={bringForward}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Bring Forward"
                >
                  <ArrowUp className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={sendBackward}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Send Backward"
                >
                  <ArrowDown className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={deleteSelected}
                  className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={flipHorizontal}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={flipVertical}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Flip Vertical"
                >
                  <FlipVertical className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Text Properties */}
            {selectedObject.type === 'i-text' && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Text Properties</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Font</label>
                    <select
                      value={textProps.fontFamily}
                      onChange={(e) => updateTextProperty('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {FONTS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Size</label>
                    <input
                      type="number"
                      value={textProps.fontSize}
                      onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min={8}
                      max={120}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Color</label>
                    <input
                      type="color"
                      value={textProps.fill}
                      onChange={(e) => updateTextProperty('fill', e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        updateTextProperty(
                          'fontWeight',
                          textProps.fontWeight === 'bold' ? 'normal' : 'bold'
                        )
                      }
                      className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                        textProps.fontWeight === 'bold'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() =>
                        updateTextProperty(
                          'fontStyle',
                          textProps.fontStyle === 'italic' ? 'normal' : 'italic'
                        )
                      }
                      className={`flex-1 py-2 rounded-lg italic transition-colors ${
                        textProps.fontStyle === 'italic'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      I
                    </button>
                    <button
                      onClick={() => updateTextProperty('underline', !textProps.underline)}
                      className={`flex-1 py-2 rounded-lg underline transition-colors ${
                        textProps.underline
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      U
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Letter Spacing</label>
                      <input
                        type="range"
                        min={-100}
                        max={800}
                        step={10}
                        value={textProps.charSpacing}
                        onChange={(e) => updateTextProperty('charSpacing', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Line Spacing</label>
                      <input
                        type="range"
                        min={0.7}
                        max={2}
                        step={0.05}
                        value={textProps.lineHeight}
                        onChange={(e) => updateTextProperty('lineHeight', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Text Effects</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {TEXT_EFFECTS.map((effect) => (
                        <button
                          key={effect.value}
                          onClick={() => updateTextEffect(effect.value)}
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                            textProps.textEffect === effect.value
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {effect.label}
                        </button>
                      ))}
                    </div>
                    {textProps.textEffect !== 'none' && (
                      <div className="mt-3">
                        <label className="text-sm text-gray-600 mb-1 block">Effect Strength</label>
                        <input
                          type="range"
                          min={4}
                          max={80}
                          value={textProps.effectStrength}
                          onChange={(e) =>
                            updateTextEffect(textProps.textEffect, parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Outline & Depth</h4>
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Outline Width</label>
                        <input
                          type="range"
                          min={0}
                          max={12}
                          value={textProps.strokeWidth}
                          onChange={(e) =>
                            updateTextProperty('strokeWidth', parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <input
                        type="color"
                        value={textProps.stroke}
                        onChange={(e) => updateTextProperty('stroke', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer"
                        title="Outline color"
                      />
                    </div>

                    <button
                      onClick={() =>
                        updateTextShadow({
                          shadowEnabled: !textProps.shadowEnabled,
                          extrudeEnabled: false,
                        })
                      }
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                        textProps.shadowEnabled
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Shadow
                    </button>

                    {textProps.shadowEnabled && (
                      <div className="space-y-2">
                        <input
                          type="color"
                          value={textProps.shadowColor}
                          onChange={(e) => updateTextShadow({ shadowColor: e.target.value })}
                          className="w-full h-10 rounded-lg cursor-pointer"
                          title="Shadow color"
                        />
                        <label className="text-sm text-gray-600 block">Shadow X</label>
                        <input
                          type="range"
                          min={-30}
                          max={30}
                          value={textProps.shadowOffsetX}
                          onChange={(e) =>
                            updateTextShadow({ shadowOffsetX: parseInt(e.target.value) })
                          }
                          className="w-full"
                        />
                        <label className="text-sm text-gray-600 block">Shadow Y</label>
                        <input
                          type="range"
                          min={-30}
                          max={30}
                          value={textProps.shadowOffsetY}
                          onChange={(e) =>
                            updateTextShadow({ shadowOffsetY: parseInt(e.target.value) })
                          }
                          className="w-full"
                        />
                      </div>
                    )}

                    <button
                      onClick={() =>
                        updateTextShadow({
                          extrudeEnabled: !textProps.extrudeEnabled,
                          shadowEnabled: false,
                        })
                      }
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                        textProps.extrudeEnabled
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Extrude
                    </button>

                    {textProps.extrudeEnabled && (
                      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">Depth</label>
                          <input
                            type="range"
                            min={2}
                            max={24}
                            value={textProps.extrudeDepth}
                            onChange={(e) =>
                              updateTextShadow({ extrudeDepth: parseInt(e.target.value) })
                            }
                            className="w-full"
                          />
                        </div>
                        <input
                          type="color"
                          value={textProps.extrudeColor}
                          onChange={(e) => updateTextShadow({ extrudeColor: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer"
                          title="Extrude color"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Image Filters */}
            {selectedObject.type === 'image' && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Image Filters</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center">
                      <Sun className="h-4 w-4 mr-1" /> Brightness
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={filters.brightness}
                      onChange={(e) => applyImageFilter('brightness', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center">
                      <Contrast className="h-4 w-4 mr-1" /> Contrast
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={filters.contrast}
                      onChange={(e) => applyImageFilter('contrast', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 flex items-center">
                      <Droplets className="h-4 w-4 mr-1" /> Saturation
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={filters.saturation}
                      onChange={(e) => applyImageFilter('saturation', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shape Properties */}
            {(selectedObject.type === 'rect' || selectedObject.type === 'circle') && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Shape Properties</h3>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Fill Color</label>
                  <input
                    type="color"
                    value={(selectedObject.fill as string) || '#3b82f6'}
                    onChange={(e) => {
                      selectedObject.set('fill', e.target.value);
                      canvas?.renderAll();
                      saveHistory();
                    }}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
