import { useCallback } from 'react';
import { fabric } from 'fabric';
import { useDropzone } from 'react-dropzone';
import {
  Type,
  Image,
  Sparkles,
  Square,
  Circle,
  MousePointer2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditorStore } from '../../stores/editorStore';
import { uploadsApi } from '../../services/api';

interface ToolbarProps {
  onAIClick: () => void;
}

export default function Toolbar({ onAIClick }: ToolbarProps) {
  const { canvas, activeTool, setActiveTool, saveHistory } = useEditorStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!canvas || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      try {
        // Upload to server
        const response = await uploadsApi.uploadImage(file);
        const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${response.data.url}`;

        // Add to canvas
        fabric.Image.fromURL(
          imageUrl,
          (img) => {
            // Scale image to fit print area
            const maxWidth = 200;
            const maxHeight = 250;
            const scale = Math.min(
              maxWidth / (img.width || 200),
              maxHeight / (img.height || 250)
            );

            img.set({
              left: 200,
              top: 180,
              scaleX: scale,
              scaleY: scale,
              originX: 'center',
              originY: 'center',
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            saveHistory();
            toast.success('Image added to canvas');
          },
          { crossOrigin: 'anonymous' }
        );
      } catch (error) {
        toast.error('Failed to upload image');
      }
    },
    [canvas, saveHistory]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
    noClick: true,
  });

  const addText = useCallback(() => {
    if (!canvas) return;

    const text = new fabric.IText('Your Text', {
      left: 200,
      top: 200,
      fontSize: 32,
      fontFamily: 'Arial',
      fill: '#000000',
      originX: 'center',
      originY: 'center',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveHistory();
  }, [canvas, saveHistory]);

  const addShape = useCallback(
    (type: 'rect' | 'circle') => {
      if (!canvas) return;

      let shape: fabric.Object;

      if (type === 'rect') {
        shape = new fabric.Rect({
          left: 200,
          top: 200,
          width: 100,
          height: 100,
          fill: '#3b82f6',
          originX: 'center',
          originY: 'center',
        });
      } else {
        shape = new fabric.Circle({
          left: 200,
          top: 200,
          radius: 50,
          fill: '#3b82f6',
          originX: 'center',
          originY: 'center',
        });
      }

      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      saveHistory();
    },
    [canvas, saveHistory]
  );

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select', onClick: () => setActiveTool('select') },
    { id: 'text', icon: Type, label: 'Add Text', onClick: addText },
    { id: 'image', icon: Image, label: 'Upload Image', onClick: () => {} },
    { id: 'ai', icon: Sparkles, label: 'AI Generate', onClick: onAIClick },
  ];

  const shapes = [
    { id: 'rect', icon: Square, label: 'Rectangle', onClick: () => addShape('rect') },
    { id: 'circle', icon: Circle, label: 'Circle', onClick: () => addShape('circle') },
  ];

  return (
    <div
      {...getRootProps()}
      className={`w-20 bg-white border-r flex flex-col items-center py-4 space-y-2 ${
        isDragActive ? 'bg-primary-50 border-primary-300' : ''
      }`}
    >
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 bg-primary-100/80 flex items-center justify-center z-10">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto text-primary-600" />
            <p className="text-sm font-medium text-primary-600 mt-2">Drop image here</p>
          </div>
        </div>
      )}

      {/* Main Tools */}
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.onClick}
          className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center transition-colors ${
            activeTool === tool.id
              ? 'bg-primary-100 text-primary-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={tool.label}
        >
          <tool.icon className="h-5 w-5" />
          <span className="text-[10px] mt-1">{tool.label.split(' ')[0]}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="w-12 h-px bg-gray-200 my-2" />

      {/* Shapes */}
      {shapes.map((shape) => (
        <button
          key={shape.id}
          onClick={shape.onClick}
          className="w-14 h-14 rounded-lg flex flex-col items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          title={shape.label}
        >
          <shape.icon className="h-5 w-5" />
          <span className="text-[10px] mt-1">{shape.label}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="w-12 h-px bg-gray-200 my-2" />

      {/* File Upload */}
      <label className="w-14 h-14 rounded-lg flex flex-col items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
        <Upload className="h-5 w-5" />
        <span className="text-[10px] mt-1">Upload</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              onDrop(Array.from(files));
            }
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
