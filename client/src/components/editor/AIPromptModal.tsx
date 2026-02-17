import { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useEditorStore } from '../../stores/editorStore';
import { aiApi } from '../../services/api';
import type { AIGeneratedImage } from '../../types';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIPromptModal({ isOpen, onClose }: AIPromptModalProps) {
  const { canvas, saveHistory } = useEditorStore();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('default');
  const [styles, setStyles] = useState<{ id: string; name: string; description: string }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<AIGeneratedImage[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadStylesAndSuggestions();
    }
  }, [isOpen]);

  const loadStylesAndSuggestions = async () => {
    try {
      const [stylesRes, suggestionsRes] = await Promise.all([
        aiApi.getStyles(),
        aiApi.getSuggestions(),
      ]);
      setStyles(stylesRes.data.styles);
      setSuggestions(suggestionsRes.data.suggestions);
    } catch (error) {
      console.error('Failed to load AI options:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      const response = await aiApi.generate({ prompt, style, count: 4 });
      setGeneratedImages(response.data.images);
      toast.success('Images generated! Click one to add to canvas.');
    } catch (error) {
      toast.error('Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  const addImageToCanvas = (image: AIGeneratedImage) => {
    if (!canvas) return;

    fabric.Image.fromURL(
      image.url,
      (img) => {
        // Scale to fit print area
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
        onClose();
      },
      { crossOrigin: 'anonymous' }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Design Generator" size="lg">
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a demo using placeholder images. In production, this would
            connect to Stable Diffusion, DALL-E, or similar AI image generation APIs.
          </p>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your design
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A majestic mountain landscape at sunset with vibrant colors..."
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
          />
        </div>

        {/* Suggestions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or try a suggestion
          </label>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion)}
                className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
              >
                {suggestion.length > 30 ? suggestion.slice(0, 30) + '...' : suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
          <div className="grid grid-cols-4 gap-2">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  style === s.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={s.description}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          isLoading={isGenerating}
          className="w-full"
          size="lg"
          leftIcon={isGenerating ? undefined : <Sparkles className="h-5 w-5" />}
        >
          {isGenerating ? 'Generating...' : 'Generate Designs'}
        </Button>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Click an image to add to canvas
            </label>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => addImageToCanvas(image)}
                  className="relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-primary-500 transition-all"
                >
                  <img
                    src={image.url}
                    alt="AI Generated"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-medium">Add to Canvas</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Regenerate */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-4 w-full py-2 text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate More
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
