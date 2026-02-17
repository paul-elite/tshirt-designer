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
  });

  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });

  // Update text props when selection changes
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'i-text') {
      const textObj = selectedObject as fabric.IText;
      setTextProps({
        text: textObj.text || '',
        fontSize: textObj.fontSize || 32,
        fontFamily: textObj.fontFamily || 'Arial',
        fill: (textObj.fill as string) || '#000000',
        fontWeight: (textObj.fontWeight as string) || 'normal',
        fontStyle: (textObj.fontStyle as string) || 'normal',
        underline: textObj.underline || false,
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
